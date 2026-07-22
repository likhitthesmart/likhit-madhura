import { Router } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { wrap, HttpError } from "../middleware/error";
import { requireRole } from "../middleware/auth";
import { pushTimeline } from "../lib/util";

export const adminRouter = Router();
adminRouter.use(requireRole("ADMIN", "STAFF"));

const audit = (userId: string, action: string, entity: string, entityId?: string, meta?: object) =>
  prisma.auditLog.create({ data: { userId, action, entity, entityId, meta } }).catch(() => undefined);

/* ---------------------------------- dashboard ---------------------------------- */

adminRouter.get(
  "/dashboard",
  wrap(async (_req, res) => {
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 86400_000);
    const monthAgo = new Date(now.getTime() - 30 * 86400_000);
    const paid = { paymentStatus: "PAID" as const };

    const [todaySales, monthSales, todayOrders, pendingOrders, totalCustomers, lowStock, abandoned, visitorsToday, visitorsWeek, recentOrders, topProducts, salesByDay, trafficSources, statusCounts] =
      await Promise.all([
        prisma.order.aggregate({ _sum: { total: true }, where: { ...paid, createdAt: { gte: dayStart } } }),
        prisma.order.aggregate({ _sum: { total: true }, _count: true, where: { ...paid, createdAt: { gte: monthAgo } } }),
        prisma.order.count({ where: { createdAt: { gte: dayStart } } }),
        prisma.order.count({ where: { status: "PENDING" } }),
        prisma.user.count({ where: { role: "CUSTOMER" } }),
        prisma.product.findMany({ where: { active: true, stock: { lte: prisma.product.fields.lowStockAlert } }, select: { id: true, name: true, stock: true, lowStockAlert: true }, take: 10 }),
        prisma.order.count({ where: { paymentStatus: { in: ["UNPAID", "EXPIRED", "FAILED"] }, createdAt: { gte: weekAgo } } }),
        prisma.analyticsEvent.groupBy({ by: ["sessionId"], where: { type: "pageview", createdAt: { gte: dayStart } } }).then((r) => r.length),
        prisma.analyticsEvent.groupBy({ by: ["sessionId"], where: { type: "pageview", createdAt: { gte: weekAgo } } }).then((r) => r.length),
        prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 8, select: { id: true, orderNo: true, email: true, total: true, status: true, paymentStatus: true, createdAt: true } }),
        prisma.orderItem.groupBy({ by: ["productId", "name"], _sum: { qty: true }, where: { order: { ...paid, createdAt: { gte: monthAgo } } }, orderBy: { _sum: { qty: "desc" } }, take: 6 }),
        prisma.$queryRaw<{ day: Date; revenue: bigint; orders: bigint }[]>(
          Prisma.sql`SELECT date_trunc('day', "createdAt") AS day, COALESCE(SUM(total),0)::bigint AS revenue, COUNT(*)::bigint AS orders
                     FROM "Order" WHERE "paymentStatus" = 'PAID' AND "createdAt" >= ${monthAgo}
                     GROUP BY 1 ORDER BY 1`
        ),
        prisma.$queryRaw<{ source: string; count: bigint }[]>(
          Prisma.sql`SELECT COALESCE(NULLIF(split_part(referrer, '/', 3), ''), 'direct') AS source, COUNT(*)::bigint AS count
                     FROM "AnalyticsEvent" WHERE type = 'pageview' AND "createdAt" >= ${weekAgo}
                     GROUP BY 1 ORDER BY 2 DESC LIMIT 6`
        ),
        prisma.order.groupBy({ by: ["status"], _count: true }),
      ]);

    const purchasesWeek = await prisma.order.count({ where: { ...paid, createdAt: { gte: weekAgo } } });
    res.json({
      todayRevenue: todaySales._sum.total ?? 0,
      monthRevenue: monthSales._sum.total ?? 0,
      monthOrders: monthSales._count,
      todayOrders,
      pendingOrders,
      totalCustomers,
      visitorsToday,
      visitorsWeek,
      conversionRate: visitorsWeek ? +((purchasesWeek / visitorsWeek) * 100).toFixed(2) : 0,
      abandonedCarts: abandoned,
      lowStock,
      recentOrders,
      topProducts: topProducts.map((t) => ({ productId: t.productId, name: t.name, qty: t._sum.qty ?? 0 })),
      salesByDay: salesByDay.map((r) => ({ day: r.day, revenue: Number(r.revenue), orders: Number(r.orders) })),
      trafficSources: trafficSources.map((r) => ({ source: r.source, count: Number(r.count) })),
      statusCounts: Object.fromEntries(statusCounts.map((s) => [s.status, s._count])),
    });
  })
);

/* ---------------------------------- categories ---------------------------------- */

const categoryBody = z.object({
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  name: z.string().min(2),
  description: z.string().optional(),
  image: z.string().optional(),
  sortOrder: z.number().int().default(0),
  active: z.boolean().default(true),
});

adminRouter.get("/categories", wrap(async (_req, res) => {
  res.json({ categories: await prisma.category.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { products: true } } } }) });
}));
adminRouter.post("/categories", wrap(async (req, res) => {
  const category = await prisma.category.create({ data: categoryBody.parse(req.body) });
  await audit(req.auth!.userId, "create", "category", category.id);
  res.status(201).json({ category });
}));
adminRouter.patch("/categories/:id", wrap(async (req, res) => {
  const category = await prisma.category.update({ where: { id: req.params.id }, data: categoryBody.partial().parse(req.body) });
  await audit(req.auth!.userId, "update", "category", category.id);
  res.json({ category });
}));
adminRouter.delete("/categories/:id", wrap(async (req, res) => {
  const count = await prisma.product.count({ where: { categoryId: req.params.id } });
  if (count) throw new HttpError(400, "Move or delete this category's products first");
  await prisma.category.delete({ where: { id: req.params.id } });
  await audit(req.auth!.userId, "delete", "category", req.params.id);
  res.json({ ok: true });
}));

/* ---------------------------------- products ---------------------------------- */

const productBody = z.object({
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  name: z.string().min(2),
  tagline: z.string().nullish(),
  description: z.string().min(10),
  price: z.number().int().positive(),
  mrp: z.number().int().positive(),
  unit: z.string().min(1),
  sku: z.string().min(2),
  stock: z.number().int().min(0),
  lowStockAlert: z.number().int().min(0).default(10),
  images: z.array(z.string()).default([]),
  video: z.string().nullish(),
  categoryId: z.string(),
  tags: z.array(z.string()).default([]),
  bestSeller: z.boolean().default(false),
  featured: z.boolean().default(false),
  organicCertified: z.boolean().default(true),
  active: z.boolean().default(true),
  nutrition: z.record(z.string()).nullish(),
  ingredients: z.array(z.string()).default([]),
  benefits: z.array(z.string()).default([]),
  storage: z.string().nullish(),
  uses: z.array(z.string()).default([]),
  faqs: z.array(z.object({ q: z.string(), a: z.string() })).nullish(),
  seoTitle: z.string().nullish(),
  seoDescription: z.string().nullish(),
});

adminRouter.get("/products", wrap(async (req, res) => {
  const q = z.object({ q: z.string().optional(), page: z.coerce.number().default(1) }).parse(req.query);
  const where: Prisma.ProductWhereInput = q.q ? { OR: [{ name: { contains: q.q, mode: "insensitive" } }, { sku: { contains: q.q, mode: "insensitive" } }] } : {};
  const [items, total] = await Promise.all([
    prisma.product.findMany({ where, orderBy: { createdAt: "desc" }, skip: (q.page - 1) * 20, take: 20, include: { category: true } }),
    prisma.product.count({ where }),
  ]);
  res.json({ items, total, pages: Math.ceil(total / 20) });
}));
adminRouter.post("/products", wrap(async (req, res) => {
  const data = productBody.parse(req.body);
  const product = await prisma.product.create({ data: { ...data, nutrition: data.nutrition ?? undefined, faqs: data.faqs ?? undefined } });
  if (data.stock > 0) await prisma.inventoryLog.create({ data: { productId: product.id, delta: data.stock, reason: "restock" } });
  await audit(req.auth!.userId, "create", "product", product.id);
  res.status(201).json({ product });
}));
adminRouter.post("/products/bulk", wrap(async (req, res) => {
  const rows = z.array(productBody).max(200).parse(req.body);
  const created = await prisma.$transaction(rows.map((data) => prisma.product.create({ data: { ...data, nutrition: data.nutrition ?? undefined, faqs: data.faqs ?? undefined } })));
  await audit(req.auth!.userId, "bulk_create", "product", undefined, { count: created.length });
  res.status(201).json({ count: created.length });
}));
adminRouter.patch("/products/:id", wrap(async (req, res) => {
  const data = productBody.partial().parse(req.body);
  const before = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!before) throw new HttpError(404, "Product not found");
  const product = await prisma.product.update({ where: { id: req.params.id }, data: { ...data, nutrition: data.nutrition ?? undefined, faqs: data.faqs ?? undefined } });
  if (data.stock !== undefined && data.stock !== before.stock)
    await prisma.inventoryLog.create({ data: { productId: product.id, delta: data.stock - before.stock, reason: "adjustment" } });
  await audit(req.auth!.userId, "update", "product", product.id);
  res.json({ product });
}));
adminRouter.delete("/products/:id", wrap(async (req, res) => {
  await prisma.product.update({ where: { id: req.params.id }, data: { active: false } }); // soft delete keeps order history intact
  await audit(req.auth!.userId, "deactivate", "product", req.params.id);
  res.json({ ok: true });
}));

/* ---------------------------------- inventory ---------------------------------- */

adminRouter.get("/inventory", wrap(async (_req, res) => {
  const products = await prisma.product.findMany({
    orderBy: { stock: "asc" },
    select: { id: true, name: true, sku: true, unit: true, stock: true, lowStockAlert: true, active: true },
  });
  res.json({ products });
}));
adminRouter.get("/inventory/logs", wrap(async (req, res) => {
  const q = z.object({ productId: z.string().optional(), page: z.coerce.number().default(1) }).parse(req.query);
  const where = q.productId ? { productId: q.productId } : {};
  const logs = await prisma.inventoryLog.findMany({ where, orderBy: { at: "desc" }, skip: (q.page - 1) * 30, take: 30, include: { product: { select: { name: true, sku: true } } } });
  res.json({ logs });
}));
adminRouter.post("/inventory/:productId/adjust", wrap(async (req, res) => {
  const { delta, reason } = z.object({ delta: z.number().int(), reason: z.string().default("adjustment") }).parse(req.body);
  const product = await prisma.product.update({ where: { id: req.params.productId }, data: { stock: { increment: delta } } });
  await prisma.inventoryLog.create({ data: { productId: product.id, delta, reason } });
  await audit(req.auth!.userId, "inventory_adjust", "product", product.id, { delta, reason });
  res.json({ stock: product.stock });
}));

/* ---------------------------------- orders ---------------------------------- */

adminRouter.get("/orders", wrap(async (req, res) => {
  const q = z.object({ status: z.string().optional(), q: z.string().optional(), page: z.coerce.number().default(1) }).parse(req.query);
  const where: Prisma.OrderWhereInput = {
    ...(q.status ? { status: q.status as never } : {}),
    ...(q.q ? { OR: [{ orderNo: { contains: q.q, mode: "insensitive" } }, { email: { contains: q.q, mode: "insensitive" } }] } : {}),
  };
  const [orders, total] = await Promise.all([
    prisma.order.findMany({ where, orderBy: { createdAt: "desc" }, skip: (q.page - 1) * 20, take: 20, include: { items: true } }),
    prisma.order.count({ where }),
  ]);
  res.json({ orders, total, pages: Math.ceil(total / 20) });
}));
adminRouter.get("/orders/export", wrap(async (_req, res) => {
  const orders = await prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 1000, include: { items: true } });
  const header = "orderNo,date,email,status,paymentStatus,total,items";
  const lines = orders.map((o) =>
    [o.orderNo, o.createdAt.toISOString(), o.email, o.status, o.paymentStatus, (o.total / 100).toFixed(2), `"${o.items.map((i) => `${i.name} x${i.qty}`).join("; ")}"`].join(",")
  );
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=orders.csv");
  res.send([header, ...lines].join("\n"));
}));
adminRouter.get("/orders/:id", wrap(async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id }, include: { items: true, user: { select: { name: true, email: true } } } });
  if (!order) throw new HttpError(404, "Order not found");
  res.json({ order });
}));
adminRouter.patch("/orders/:id/status", wrap(async (req, res) => {
  const body = z.object({
    status: z.enum(["PENDING", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]),
    note: z.string().optional(),
    trackingNo: z.string().optional(),
    courier: z.string().optional(),
  }).parse(req.body);
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) throw new HttpError(404, "Order not found");
  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: body.status,
      trackingNo: body.trackingNo ?? order.trackingNo,
      courier: body.courier ?? order.courier,
      ...(body.status === "REFUNDED" ? { paymentStatus: "REFUNDED" } : {}),
      timeline: pushTimeline(order.timeline, body.status, body.note),
    },
  });
  await audit(req.auth!.userId, "order_status", "order", order.id, { status: body.status });
  res.json({ order: updated });
}));

/* ---------------------------------- users ---------------------------------- */

adminRouter.get("/users", wrap(async (req, res) => {
  const q = z.object({ q: z.string().optional(), page: z.coerce.number().default(1) }).parse(req.query);
  const where: Prisma.UserWhereInput = q.q ? { OR: [{ name: { contains: q.q, mode: "insensitive" } }, { email: { contains: q.q, mode: "insensitive" } }] } : {};
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (q.page - 1) * 20,
      take: 20,
      select: { id: true, name: true, email: true, phone: true, role: true, blocked: true, lastLoginAt: true, createdAt: true, _count: { select: { orders: true } } },
    }),
    prisma.user.count({ where }),
  ]);
  res.json({ users, total, pages: Math.ceil(total / 20) });
}));
adminRouter.patch("/users/:id", requireRole("ADMIN"), wrap(async (req, res) => {
  const body = z.object({ role: z.enum(["CUSTOMER", "STAFF", "ADMIN"]).optional(), blocked: z.boolean().optional() }).parse(req.body);
  const user = await prisma.user.update({ where: { id: req.params.id }, data: body });
  await audit(req.auth!.userId, "update", "user", user.id, body);
  res.json({ user: { id: user.id, role: user.role, blocked: user.blocked } });
}));

/* ---------------------------------- coupons ---------------------------------- */

const couponBody = z.object({
  code: z.string().min(3).max(30).transform((s) => s.toUpperCase()),
  description: z.string().nullish(),
  type: z.enum(["PERCENT", "FLAT"]),
  value: z.number().int().positive(),
  minCart: z.number().int().min(0).default(0),
  maxDiscount: z.number().int().positive().nullish(),
  categoryId: z.string().nullish(),
  userId: z.string().nullish(),
  startsAt: z.coerce.date().nullish(),
  endsAt: z.coerce.date().nullish(),
  usageLimit: z.number().int().positive().nullish(),
  perUserLimit: z.number().int().min(0).default(1),
  autoApply: z.boolean().default(false),
  stackable: z.boolean().default(false),
  active: z.boolean().default(true),
});

adminRouter.get("/coupons", wrap(async (_req, res) => {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { redemptions: true } } } });
  res.json({ coupons });
}));
adminRouter.get("/coupons/:id/analytics", wrap(async (req, res) => {
  const [redemptions, totals] = await Promise.all([
    prisma.couponRedemption.findMany({ where: { couponId: req.params.id }, orderBy: { at: "desc" }, take: 50, include: { order: { select: { orderNo: true, total: true } } } }),
    prisma.couponRedemption.aggregate({ where: { couponId: req.params.id }, _sum: { amount: true }, _count: true }),
  ]);
  res.json({ redemptions, totalDiscount: totals._sum.amount ?? 0, uses: totals._count });
}));
adminRouter.post("/coupons", wrap(async (req, res) => {
  const coupon = await prisma.coupon.create({ data: couponBody.parse(req.body) });
  await audit(req.auth!.userId, "create", "coupon", coupon.id);
  res.status(201).json({ coupon });
}));
adminRouter.patch("/coupons/:id", wrap(async (req, res) => {
  const coupon = await prisma.coupon.update({ where: { id: req.params.id }, data: couponBody.partial().parse(req.body) });
  await audit(req.auth!.userId, "update", "coupon", coupon.id);
  res.json({ coupon });
}));
adminRouter.delete("/coupons/:id", wrap(async (req, res) => {
  await prisma.coupon.delete({ where: { id: req.params.id } });
  await audit(req.auth!.userId, "delete", "coupon", req.params.id);
  res.json({ ok: true });
}));

/* ---------------------------------- reviews moderation ---------------------------------- */

adminRouter.get("/reviews", wrap(async (req, res) => {
  const q = z.object({ status: z.enum(["PENDING", "APPROVED", "REJECTED"]).default("PENDING") }).parse(req.query);
  const reviews = await prisma.review.findMany({
    where: { status: q.status },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { user: { select: { name: true, email: true } }, product: { select: { name: true, slug: true } } },
  });
  res.json({ reviews });
}));
adminRouter.patch("/reviews/:id", wrap(async (req, res) => {
  const { status } = z.object({ status: z.enum(["APPROVED", "REJECTED"]) }).parse(req.body);
  const review = await prisma.review.update({ where: { id: req.params.id }, data: { status } });
  const agg = await prisma.review.aggregate({ where: { productId: review.productId, status: "APPROVED" }, _avg: { rating: true }, _count: true });
  await prisma.product.update({
    where: { id: review.productId },
    data: { ratingAvg: agg._avg.rating ?? 0, ratingCount: agg._count },
  });
  await audit(req.auth!.userId, "moderate", "review", review.id, { status });
  res.json({ review });
}));

/* ---------------------------------- content: blog, faqs, testimonials ---------------------------------- */

const blogBody = z.object({
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  title: z.string().min(3),
  excerpt: z.string().min(10),
  content: z.string().min(20),
  cover: z.string().nullish(),
  category: z.string(),
  tags: z.array(z.string()).default([]),
  authorName: z.string().default("Madhura Naturals"),
  published: z.boolean().default(true),
  seoTitle: z.string().nullish(),
  seoDescription: z.string().nullish(),
});
adminRouter.get("/blog", wrap(async (_req, res) => {
  res.json({ posts: await prisma.blogPost.findMany({ orderBy: { publishedAt: "desc" } }) });
}));
adminRouter.post("/blog", wrap(async (req, res) => {
  const post = await prisma.blogPost.create({ data: blogBody.parse(req.body) });
  await audit(req.auth!.userId, "create", "blog", post.id);
  res.status(201).json({ post });
}));
adminRouter.patch("/blog/:id", wrap(async (req, res) => {
  const post = await prisma.blogPost.update({ where: { id: req.params.id }, data: blogBody.partial().parse(req.body) });
  res.json({ post });
}));
adminRouter.delete("/blog/:id", wrap(async (req, res) => {
  await prisma.blogPost.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
}));
adminRouter.get("/blog-comments", wrap(async (_req, res) => {
  res.json({ comments: await prisma.blogComment.findMany({ where: { approved: false }, include: { post: { select: { title: true, slug: true } } } }) });
}));
adminRouter.patch("/blog-comments/:id", wrap(async (req, res) => {
  const { approved } = z.object({ approved: z.boolean() }).parse(req.body);
  if (approved) await prisma.blogComment.update({ where: { id: req.params.id }, data: { approved: true } });
  else await prisma.blogComment.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
}));

const faqBody = z.object({ question: z.string().min(5), answer: z.string().min(5), category: z.string().default("general"), sortOrder: z.number().int().default(0), active: z.boolean().default(true) });
adminRouter.get("/faqs", wrap(async (_req, res) => res.json({ faqs: await prisma.faq.findMany({ orderBy: { sortOrder: "asc" } }) })));
adminRouter.post("/faqs", wrap(async (req, res) => res.status(201).json({ faq: await prisma.faq.create({ data: faqBody.parse(req.body) }) })));
adminRouter.patch("/faqs/:id", wrap(async (req, res) => res.json({ faq: await prisma.faq.update({ where: { id: req.params.id }, data: faqBody.partial().parse(req.body) }) })));
adminRouter.delete("/faqs/:id", wrap(async (req, res) => { await prisma.faq.delete({ where: { id: req.params.id } }); res.json({ ok: true }); }));

const testimonialBody = z.object({ name: z.string().min(2), location: z.string().nullish(), quote: z.string().min(5), rating: z.number().int().min(1).max(5).default(5), image: z.string().nullish(), active: z.boolean().default(true) });
adminRouter.get("/testimonials", wrap(async (_req, res) => res.json({ testimonials: await prisma.testimonial.findMany() })));
adminRouter.post("/testimonials", wrap(async (req, res) => res.status(201).json({ testimonial: await prisma.testimonial.create({ data: testimonialBody.parse(req.body) }) })));
adminRouter.patch("/testimonials/:id", wrap(async (req, res) => res.json({ testimonial: await prisma.testimonial.update({ where: { id: req.params.id }, data: testimonialBody.partial().parse(req.body) }) })));
adminRouter.delete("/testimonials/:id", wrap(async (req, res) => { await prisma.testimonial.delete({ where: { id: req.params.id } }); res.json({ ok: true }); }));

/* ---------------------------------- shipping zones ---------------------------------- */

const zoneBody = z.object({
  name: z.string().min(2),
  pincodePrefixes: z.array(z.string().regex(/^\d{1,6}$/)).default([]),
  fee: z.number().int().min(0),
  freeAbove: z.number().int().min(0).default(0),
  etaDaysMin: z.number().int().min(0),
  etaDaysMax: z.number().int().min(0),
  active: z.boolean().default(true),
});
adminRouter.get("/shipping-zones", wrap(async (_req, res) => res.json({ zones: await prisma.shippingZone.findMany() })));
adminRouter.post("/shipping-zones", wrap(async (req, res) => res.status(201).json({ zone: await prisma.shippingZone.create({ data: zoneBody.parse(req.body) }) })));
adminRouter.patch("/shipping-zones/:id", wrap(async (req, res) => res.json({ zone: await prisma.shippingZone.update({ where: { id: req.params.id }, data: zoneBody.partial().parse(req.body) }) })));
adminRouter.delete("/shipping-zones/:id", wrap(async (req, res) => { await prisma.shippingZone.delete({ where: { id: req.params.id } }); res.json({ ok: true }); }));

/* ---------------------------------- enquiries, subscribers ---------------------------------- */

adminRouter.get("/enquiries", wrap(async (req, res) => {
  const q = z.object({ source: z.enum(["CONTACT", "CHAT", "SUPPORT"]).optional(), status: z.enum(["NEW", "OPEN", "RESOLVED"]).optional() }).parse(req.query);
  const enquiries = await prisma.enquiry.findMany({ where: { ...(q.source ? { source: q.source } : {}), ...(q.status ? { status: q.status } : {}) }, orderBy: { createdAt: "desc" }, take: 100 });
  res.json({ enquiries });
}));
adminRouter.patch("/enquiries/:id", wrap(async (req, res) => {
  const { status } = z.object({ status: z.enum(["NEW", "OPEN", "RESOLVED"]) }).parse(req.body);
  res.json({ enquiry: await prisma.enquiry.update({ where: { id: req.params.id }, data: { status } }) });
}));
adminRouter.get("/subscribers", wrap(async (_req, res) => {
  const subscribers = await prisma.subscriber.findMany({ orderBy: { createdAt: "desc" } });
  res.json({ subscribers });
}));
adminRouter.get("/subscribers/export", wrap(async (_req, res) => {
  const subs = await prisma.subscriber.findMany({ where: { active: true } });
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=subscribers.csv");
  res.send(["email,joined", ...subs.map((s) => `${s.email},${s.createdAt.toISOString()}`)].join("\n"));
}));

/* ---------------------------------- visitor analytics ---------------------------------- */

adminRouter.get("/analytics", wrap(async (req, res) => {
  const days = z.coerce.number().min(1).max(90).default(7).parse(req.query.days ?? 7);
  const since = new Date(Date.now() - days * 86400_000);
  const [pageviews, sessions, byDevice, byBrowser, byOs, topPages, referrers, funnel, byCountry, recent] = await Promise.all([
    prisma.analyticsEvent.count({ where: { type: "pageview", createdAt: { gte: since } } }),
    prisma.analyticsEvent.groupBy({ by: ["sessionId"], where: { createdAt: { gte: since } } }).then((r) => r.length),
    prisma.analyticsEvent.groupBy({ by: ["device"], _count: true, where: { type: "pageview", createdAt: { gte: since } } }),
    prisma.analyticsEvent.groupBy({ by: ["browser"], _count: true, where: { type: "pageview", createdAt: { gte: since } } }),
    prisma.analyticsEvent.groupBy({ by: ["os"], _count: true, where: { type: "pageview", createdAt: { gte: since } } }),
    prisma.analyticsEvent.groupBy({ by: ["path"], _count: true, where: { type: "pageview", createdAt: { gte: since } }, orderBy: { _count: { path: "desc" } }, take: 10 }),
    prisma.$queryRaw<{ source: string; count: bigint }[]>(
      Prisma.sql`SELECT COALESCE(NULLIF(split_part(referrer, '/', 3), ''), 'direct') AS source, COUNT(*)::bigint AS count
                 FROM "AnalyticsEvent" WHERE type = 'pageview' AND "createdAt" >= ${since} GROUP BY 1 ORDER BY 2 DESC LIMIT 10`
    ),
    Promise.all(
      ["pageview", "add_to_cart", "begin_checkout", "purchase"].map(async (t) => ({
        step: t,
        sessions: (await prisma.analyticsEvent.groupBy({ by: ["sessionId"], where: { type: t, createdAt: { gte: since } } })).length,
      }))
    ),
    prisma.analyticsEvent.groupBy({ by: ["country"], _count: true, where: { type: "pageview", createdAt: { gte: since }, country: { not: null } }, take: 10 }),
    prisma.analyticsEvent.findMany({ orderBy: { createdAt: "desc" }, take: 30, select: { type: true, path: true, device: true, browser: true, sessionId: true, ip: true, createdAt: true } }),
  ]);
  res.json({
    pageviews,
    sessions,
    byDevice: byDevice.map((d) => ({ device: d.device ?? "unknown", count: d._count })),
    byBrowser: byBrowser.map((d) => ({ browser: d.browser ?? "unknown", count: d._count })),
    byOs: byOs.map((d) => ({ os: d.os ?? "unknown", count: d._count })),
    topPages: topPages.map((p) => ({ path: p.path, count: p._count })),
    referrers: referrers.map((r) => ({ source: r.source, count: Number(r.count) })),
    funnel,
    byCountry: byCountry.map((c) => ({ country: c.country, count: c._count })),
    recent,
  });
}));

/* ---------------------------------- settings + audit ---------------------------------- */

adminRouter.get("/settings", wrap(async (_req, res) => {
  const settings = await prisma.setting.findMany();
  res.json({ settings: Object.fromEntries(settings.map((s) => [s.key, s.value])) });
}));
adminRouter.put("/settings/:key", wrap(async (req, res) => {
  const value = req.body?.value;
  const setting = await prisma.setting.upsert({ where: { key: req.params.key }, create: { key: req.params.key, value }, update: { value } });
  await audit(req.auth!.userId, "update", "setting", setting.key);
  res.json({ setting });
}));
adminRouter.get("/audit-logs", requireRole("ADMIN"), wrap(async (_req, res) => {
  const logs = await prisma.auditLog.findMany({ orderBy: { at: "desc" }, take: 100, include: { user: { select: { name: true, email: true } } } });
  res.json({ logs });
}));
