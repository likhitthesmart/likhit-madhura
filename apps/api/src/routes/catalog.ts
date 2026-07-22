import { Router } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { wrap, HttpError } from "../middleware/error";

export const catalogRouter = Router();

catalogRouter.get(
  "/categories",
  wrap(async (_req, res) => {
    const categories = await prisma.category.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { products: { where: { active: true } } } } },
    });
    res.json({ categories });
  })
);

const listQuery = z.object({
  category: z.string().optional(),
  q: z.string().max(100).optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  inStock: z.coerce.boolean().optional(),
  minRating: z.coerce.number().optional(),
  organic: z.coerce.boolean().optional(),
  bestSeller: z.coerce.boolean().optional(),
  discounted: z.coerce.boolean().optional(),
  sort: z.enum(["newest", "price_asc", "price_desc", "rating", "popular"]).default("popular"),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(48).default(12),
});

catalogRouter.get(
  "/products",
  wrap(async (req, res) => {
    const q = listQuery.parse(req.query);
    const where: Prisma.ProductWhereInput = { active: true };
    if (q.category) where.category = { slug: q.category };
    if (q.q)
      where.OR = [
        { name: { contains: q.q, mode: "insensitive" } },
        { tagline: { contains: q.q, mode: "insensitive" } },
        { description: { contains: q.q, mode: "insensitive" } },
        { tags: { has: q.q.toLowerCase() } },
      ];
    if (q.minPrice !== undefined) where.price = { gte: Math.round(q.minPrice * 100) };
    if (q.maxPrice !== undefined)
      where.price = { ...(where.price as object), lte: Math.round(q.maxPrice * 100) };
    if (q.inStock) where.stock = { gt: 0 };
    if (q.minRating) where.ratingAvg = { gte: q.minRating };
    if (q.organic) where.organicCertified = true;
    if (q.bestSeller) where.bestSeller = true;
    if (q.discounted) where.mrp = { gt: prisma.product.fields.price };

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      q.sort === "newest" ? { createdAt: "desc" }
      : q.sort === "price_asc" ? { price: "asc" }
      : q.sort === "price_desc" ? { price: "desc" }
      : q.sort === "rating" ? { ratingAvg: "desc" }
      : { soldCount: "desc" };

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip: (q.page - 1) * q.limit,
        take: q.limit,
        include: { category: { select: { slug: true, name: true } } },
      }),
      prisma.product.count({ where }),
    ]);
    res.json({ items, total, page: q.page, pages: Math.ceil(total / q.limit) });
  })
);

catalogRouter.get(
  "/products/featured",
  wrap(async (_req, res) => {
    const items = await prisma.product.findMany({
      where: { active: true, featured: true },
      take: 8,
      include: { category: { select: { slug: true, name: true } } },
    });
    res.json({ items });
  })
);

catalogRouter.get(
  "/search/suggest",
  wrap(async (req, res) => {
    const q = z.string().min(1).max(60).parse(req.query.q);
    const items = await prisma.product.findMany({
      where: {
        active: true,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { tags: { has: q.toLowerCase() } },
        ],
      },
      take: 6,
      select: { slug: true, name: true, unit: true, price: true, images: true },
    });
    const trending = await prisma.product.findMany({
      where: { active: true, bestSeller: true },
      take: 4,
      select: { slug: true, name: true },
    });
    res.json({ items, trending: trending.map((t) => t.name) });
  })
);

catalogRouter.get(
  "/products/:slug",
  wrap(async (req, res) => {
    const product = await prisma.product.findUnique({
      where: { slug: req.params.slug },
      include: {
        category: { select: { slug: true, name: true } },
        reviews: {
          where: { status: "APPROVED" },
          orderBy: { createdAt: "desc" },
          take: 20,
          include: { user: { select: { name: true } } },
        },
      },
    });
    if (!product || !product.active) throw new HttpError(404, "Product not found");
    const related = await prisma.product.findMany({
      where: { categoryId: product.categoryId, active: true, id: { not: product.id } },
      take: 4,
      include: { category: { select: { slug: true, name: true } } },
    });
    res.json({ product, related });
  })
);
