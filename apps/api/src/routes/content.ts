import { Router } from "express";
import { prisma } from "../prisma";
import { wrap } from "../middleware/error";

// public content consumed by the storefront
export const contentRouter = Router();

contentRouter.get(
  "/home",
  wrap(async (_req, res) => {
    const [faqs, testimonials] = await Promise.all([
      prisma.faq.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" }, take: 8 }),
      prisma.testimonial.findMany({ where: { active: true }, take: 8 }),
    ]);
    res.json({ faqs, testimonials });
  })
);

contentRouter.get(
  "/faqs",
  wrap(async (_req, res) => {
    res.json({ faqs: await prisma.faq.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }) });
  })
);

// dedicated reviews page: testimonials + approved product reviews + aggregate stats
contentRouter.get(
  "/reviews",
  wrap(async (_req, res) => {
    const [testimonials, reviews, agg, productAgg] = await Promise.all([
      prisma.testimonial.findMany({ where: { active: true } }),
      prisma.review.findMany({
        where: { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        take: 24,
        include: { user: { select: { name: true } }, product: { select: { name: true, slug: true, images: true } } },
      }),
      prisma.review.aggregate({ where: { status: "APPROVED" }, _avg: { rating: true }, _count: true }),
      prisma.product.aggregate({ where: { active: true, ratingCount: { gt: 0 } }, _sum: { ratingCount: true } }),
    ]);
    const testimonialAvg = testimonials.length
      ? testimonials.reduce((s, t) => s + t.rating, 0) / testimonials.length
      : 0;
    const reviewCount = (agg._count ?? 0) + (productAgg._sum.ratingCount ?? 0) + testimonials.length;
    const avg = agg._count ? agg._avg.rating ?? testimonialAvg : testimonialAvg || 4.9;
    res.json({
      testimonials,
      reviews,
      stats: { avgRating: Number(avg.toFixed(1)), reviewCount: Math.max(reviewCount, testimonials.length) },
    });
  })
);
