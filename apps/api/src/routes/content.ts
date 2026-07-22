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
