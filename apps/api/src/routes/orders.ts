import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { wrap, HttpError } from "../middleware/error";
import { requireAuth } from "../middleware/auth";
import { quoteCart } from "../lib/pricing";
import { paymentProvider, PAYMENT_WINDOW_MINUTES } from "../lib/payment";
import { orderNo, pushTimeline, rupees } from "../lib/util";
import { sendMail, mailTemplates } from "../lib/mailer";

export const cartRouter = Router();

const cartBody = z.object({
  items: z.array(z.object({ productId: z.string(), qty: z.number().int().min(1).max(20) })).min(1),
  couponCode: z.string().max(30).nullish(),
  pincode: z.string().regex(/^\d{6}$/).nullish(),
});

cartRouter.post(
  "/quote",
  wrap(async (req, res) => {
    const body = cartBody.parse(req.body);
    const quote = await quoteCart({ ...body, userId: req.auth?.userId ?? null });
    res.json(quote);
  })
);

export const ordersRouter = Router();

const addressJson = z.object({
  name: z.string().min(2),
  phone: z.string().min(10),
  line1: z.string().min(3),
  line2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().regex(/^\d{6}$/),
});

// checkout — creates a PENDING order with a payment intent + expiry countdown
ordersRouter.post(
  "/",
  wrap(async (req, res) => {
    const body = cartBody
      .extend({
        email: z.string().email(),
        phone: z.string().min(10).max(15),
        shippingAddress: addressJson,
        billingAddress: addressJson.optional(),
        giftNote: z.string().max(300).optional(),
      })
      .parse(req.body);
    const userId = req.auth?.userId ?? null;
    const quote = await quoteCart({
      items: body.items,
      couponCode: body.couponCode,
      pincode: body.shippingAddress.pincode,
      userId,
    });
    if (body.couponCode && quote.couponError) throw new HttpError(400, quote.couponError);

    const order = await prisma.$transaction(async (tx) => {
      // decrement stock atomically; fails if insufficient
      for (const line of quote.lines) {
        const updated = await tx.product.updateMany({
          where: { id: line.productId, stock: { gte: line.qty } },
          data: { stock: { decrement: line.qty } },
        });
        if (updated.count === 0) throw new HttpError(409, `${line.name} just went out of stock`);
        await tx.inventoryLog.create({
          data: { productId: line.productId, delta: -line.qty, reason: "sale" },
        });
      }
      const created = await tx.order.create({
        data: {
          orderNo: orderNo(),
          userId,
          email: body.email,
          phone: body.phone,
          subtotal: quote.subtotal,
          discount: quote.discount,
          couponCode: quote.coupon?.code ?? null,
          shippingFee: quote.shippingFee,
          tax: quote.tax,
          total: quote.total,
          shippingAddress: body.shippingAddress,
          billingAddress: body.billingAddress ?? body.shippingAddress,
          giftNote: body.giftNote,
          paymentExpiresAt: new Date(Date.now() + PAYMENT_WINDOW_MINUTES * 60_000),
          timeline: pushTimeline([], "PENDING", "Order placed, awaiting payment"),
          items: {
            create: quote.lines.map((l) => ({
              productId: l.productId,
              name: l.name,
              image: l.image,
              unit: l.unit,
              price: l.price,
              qty: l.qty,
            })),
          },
        },
        include: { items: true },
      });
      if (quote.coupon) {
        const coupon = await tx.coupon.findUnique({ where: { code: quote.coupon.code } });
        if (coupon) {
          await tx.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } });
          await tx.couponRedemption.create({
            data: { couponId: coupon.id, userId, orderId: created.id, amount: quote.discount },
          });
        }
      }
      return created;
    });

    const intent = await paymentProvider().createIntent(order.id, order.total);
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentProvider: intent.provider, paymentRef: intent.ref },
    });
    res.status(201).json({
      order: { id: order.id, orderNo: order.orderNo, total: order.total, paymentExpiresAt: order.paymentExpiresAt },
      payment: intent.clientPayload,
    });
  })
);

const findOrder = async (id: string) => {
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) throw new HttpError(404, "Order not found");
  return order;
};

const restock = async (orderId: string) => {
  const items = await prisma.orderItem.findMany({ where: { orderId } });
  for (const item of items) {
    await prisma.product.update({ where: { id: item.productId }, data: { stock: { increment: item.qty } } });
    await prisma.inventoryLog.create({
      data: { productId: item.productId, delta: item.qty, reason: "return", refOrder: orderId },
    });
  }
};

// payment confirmation (mock gateway; real gateways verify signature in provider.verify)
ordersRouter.post(
  "/:id/pay",
  wrap(async (req, res) => {
    const order = await findOrder(req.params.id);
    if (order.paymentStatus === "PAID") return res.json({ status: "PAID" });
    if (order.paymentExpiresAt && order.paymentExpiresAt < new Date()) {
      if (order.paymentStatus !== "EXPIRED") {
        await restock(order.id);
        await prisma.order.update({
          where: { id: order.id },
          data: { paymentStatus: "EXPIRED", status: "CANCELLED", timeline: pushTimeline(order.timeline, "CANCELLED", "Payment window expired") },
        });
      }
      throw new HttpError(410, "Payment window expired");
    }
    const ok = await paymentProvider().verify(order.id, req.body ?? {});
    if (!ok) throw new HttpError(400, "Payment verification failed");
    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "PAID",
        status: "PROCESSING",
        timeline: pushTimeline(order.timeline, "PROCESSING", "Payment received, order confirmed"),
      },
    });
    for (const item of order.items)
      await prisma.product.update({ where: { id: item.productId }, data: { soldCount: { increment: item.qty } } });
    void sendMail(order.email, `Order ${order.orderNo} confirmed — Madhura Naturals`, mailTemplates.orderConfirmed(order.orderNo, rupees(order.total)));
    res.json({ status: updated.paymentStatus, orderNo: order.orderNo });
  })
);

ordersRouter.post(
  "/:id/fail",
  wrap(async (req, res) => {
    const order = await findOrder(req.params.id);
    if (order.paymentStatus === "PAID") throw new HttpError(400, "Order already paid");
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: "FAILED", timeline: pushTimeline(order.timeline, "PENDING", "Payment attempt failed") },
    });
    res.json({ status: "FAILED", retryAllowed: !!order.paymentExpiresAt && order.paymentExpiresAt > new Date() });
  })
);

ordersRouter.get(
  "/:id/status",
  wrap(async (req, res) => {
    const order = await findOrder(req.params.id);
    res.json({
      id: order.id,
      orderNo: order.orderNo,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentExpiresAt: order.paymentExpiresAt,
      total: order.total,
    });
  })
);

// public tracking by order number + email (guest friendly)
ordersRouter.get(
  "/track",
  wrap(async (req, res) => {
    const q = z.object({ orderNo: z.string(), email: z.string().email() }).parse(req.query);
    const order = await prisma.order.findFirst({
      where: { orderNo: q.orderNo, email: q.email.toLowerCase() },
      select: { orderNo: true, status: true, paymentStatus: true, timeline: true, trackingNo: true, courier: true, createdAt: true },
    });
    if (!order) throw new HttpError(404, "No order found for this order number and email");
    res.json({ order });
  })
);

// authenticated order history
ordersRouter.get(
  "/mine",
  requireAuth,
  wrap(async (req, res) => {
    const orders = await prisma.order.findMany({
      where: { userId: req.auth!.userId },
      orderBy: { createdAt: "desc" },
      include: { items: true },
    });
    res.json({ orders });
  })
);

ordersRouter.get(
  "/mine/:id",
  requireAuth,
  wrap(async (req, res) => {
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, userId: req.auth!.userId },
      include: { items: true },
    });
    if (!order) throw new HttpError(404, "Order not found");
    res.json({ order });
  })
);
