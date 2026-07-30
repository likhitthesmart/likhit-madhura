import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { wrap, HttpError } from "../middleware/error";
import { requireAuth } from "../middleware/auth";
import { sendMail, notifyAdmin, mailTemplates } from "../lib/mailer";

export const reviewsRouter = Router();

reviewsRouter.post(
  "/products/:slug/reviews",
  requireAuth,
  wrap(async (req, res) => {
    const body = z
      .object({
        rating: z.number().int().min(1).max(5),
        title: z.string().max(120).optional(),
        body: z.string().min(5).max(2000),
        photos: z.array(z.string().url()).max(4).default([]),
        videoUrl: z.string().url().optional(),
      })
      .parse(req.body);
    const product = await prisma.product.findUnique({ where: { slug: req.params.slug } });
    if (!product) throw new HttpError(404, "Product not found");
    const purchased = await prisma.orderItem.findFirst({
      where: { productId: product.id, order: { userId: req.auth!.userId, paymentStatus: "PAID" } },
    });
    const review = await prisma.review.upsert({
      where: { userId_productId: { userId: req.auth!.userId, productId: product.id } },
      create: {
        userId: req.auth!.userId,
        productId: product.id,
        rating: body.rating,
        title: body.title,
        body: body.body,
        photos: body.photos,
        videoUrl: body.videoUrl,
        verified: !!purchased,
      },
      update: { rating: body.rating, title: body.title, body: body.body, photos: body.photos, videoUrl: body.videoUrl, status: "PENDING" },
      // the reviewer's address, so the acknowledgement below needs no second query
      include: { user: { select: { email: true, name: true } } },
    });
    void sendMail(review.user.email, "Thank you for your review — Madhura Naturals", mailTemplates.reviewReceived(product.name));
    notifyAdmin(
      `New ${body.rating}★ review on ${product.name}`,
      mailTemplates.adminModeration("review", `${review.user.name} <${review.user.email}>`, product.name, body.body)
    );
    res.status(201).json({ review, message: "Thank you! Your review is awaiting approval." });
  })
);

export const wishlistRouter = Router();
wishlistRouter.use(requireAuth);

wishlistRouter.get(
  "/",
  wrap(async (req, res) => {
    const items = await prisma.wishlistItem.findMany({
      where: { userId: req.auth!.userId },
      orderBy: { createdAt: "desc" },
      include: { product: { include: { category: { select: { slug: true, name: true } } } } },
    });
    res.json({ items });
  })
);

wishlistRouter.post(
  "/:productId",
  wrap(async (req, res) => {
    await prisma.wishlistItem.upsert({
      where: { userId_productId: { userId: req.auth!.userId, productId: req.params.productId } },
      create: { userId: req.auth!.userId, productId: req.params.productId },
      update: {},
    });
    res.status(201).json({ ok: true });
  })
);

wishlistRouter.delete(
  "/:productId",
  wrap(async (req, res) => {
    await prisma.wishlistItem.deleteMany({
      where: { userId: req.auth!.userId, productId: req.params.productId },
    });
    res.json({ ok: true });
  })
);
