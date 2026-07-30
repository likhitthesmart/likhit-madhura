import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../prisma";
import { wrap, HttpError } from "../middleware/error";
import { requireAuth } from "../middleware/auth";

export const accountRouter = Router();
accountRouter.use(requireAuth);

accountRouter.patch(
  "/profile",
  wrap(async (req, res) => {
    const body = z
      .object({ name: z.string().min(2).max(80).optional(), phone: z.string().min(10).max(15).nullable().optional() })
      .parse(req.body);
    const user = await prisma.user.update({ where: { id: req.auth!.userId }, data: body });
    res.json({ user: { id: user.id, name: user.name, email: user.email, phone: user.phone } });
  })
);

accountRouter.post(
  "/change-password",
  wrap(async (req, res) => {
    const body = z.object({ current: z.string(), password: z.string().min(8).max(100) }).parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: req.auth!.userId } });
    // Google-only accounts have no password to compare — they set one via forgot-password
    if (!user?.passwordHash) throw new HttpError(400, "This account signs in with Google. Use “Forgot password” to set one.");
    if (!(await bcrypt.compare(body.current, user.passwordHash)))
      throw new HttpError(400, "Current password is incorrect");
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(body.password, 11) },
    });
    res.json({ ok: true });
  })
);

/* The client owns the list shape (newest first, deduped, capped) — the server just
   stores it, so there is no second copy of that logic here. */
accountRouter.get(
  "/searches",
  wrap(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.auth!.userId },
      select: { recentSearches: true },
    });
    res.json({ recentSearches: user?.recentSearches ?? [] });
  })
);

accountRouter.put(
  "/searches",
  wrap(async (req, res) => {
    const body = z.object({ recentSearches: z.array(z.string().min(1).max(80)).max(6) }).parse(req.body);
    await prisma.user.update({ where: { id: req.auth!.userId }, data: body });
    res.json({ ok: true });
  })
);

const addressSchema = z.object({
  label: z.string().max(30).default("Home"),
  name: z.string().min(2).max(80),
  // same rule the order route enforces — a saved address is the source for checkout
  phone: z
    .string()
    .transform((s) => s.replace(/[\s-]/g, ""))
    .pipe(z.string().regex(/^(?:\+?91)?[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number")),
  line1: z.string().min(3).max(120),
  line2: z.string().max(120).optional(),
  city: z.string().min(2).max(60),
  state: z.string().min(2).max(60),
  pincode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
  isDefault: z.boolean().default(false),
});

accountRouter.get(
  "/addresses",
  wrap(async (req, res) => {
    const addresses = await prisma.address.findMany({
      where: { userId: req.auth!.userId },
      orderBy: { isDefault: "desc" },
    });
    res.json({ addresses });
  })
);

accountRouter.post(
  "/addresses",
  wrap(async (req, res) => {
    const body = addressSchema.parse(req.body);
    if (body.isDefault)
      await prisma.address.updateMany({ where: { userId: req.auth!.userId }, data: { isDefault: false } });
    const address = await prisma.address.create({ data: { ...body, userId: req.auth!.userId } });
    res.status(201).json({ address });
  })
);

accountRouter.patch(
  "/addresses/:id",
  wrap(async (req, res) => {
    const body = addressSchema.partial().parse(req.body);
    const existing = await prisma.address.findFirst({ where: { id: req.params.id, userId: req.auth!.userId } });
    if (!existing) throw new HttpError(404, "Address not found");
    if (body.isDefault)
      await prisma.address.updateMany({ where: { userId: req.auth!.userId }, data: { isDefault: false } });
    const address = await prisma.address.update({ where: { id: existing.id }, data: body });
    res.json({ address });
  })
);

accountRouter.delete(
  "/addresses/:id",
  wrap(async (req, res) => {
    await prisma.address.deleteMany({ where: { id: req.params.id, userId: req.auth!.userId } });
    res.json({ ok: true });
  })
);

accountRouter.get(
  "/coupons",
  wrap(async (req, res) => {
    const now = new Date();
    const coupons = await prisma.coupon.findMany({
      where: {
        active: true,
        OR: [{ userId: null }, { userId: req.auth!.userId }],
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
      select: { code: true, description: true, type: true, value: true, minCart: true, endsAt: true },
    });
    res.json({ coupons });
  })
);
