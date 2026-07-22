import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { prisma } from "../prisma";
import { env } from "../env";
import { wrap, HttpError } from "../middleware/error";
import { requireAuth } from "../middleware/auth";
import { signAccess, issueRefresh, rotateRefresh, revokeRefresh } from "../lib/tokens";
import { sendMail, mailTemplates } from "../lib/mailer";

export const authRouter = Router();

const authLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 30, standardHeaders: true });
authRouter.use(authLimiter);

const publicUser = (u: { id: string; email: string; name: string; phone: string | null; role: string; emailVerifiedAt: Date | null }) => ({
  id: u.id,
  email: u.email,
  name: u.name,
  phone: u.phone,
  role: u.role,
  emailVerified: !!u.emailVerifiedAt,
});

authRouter.post(
  "/signup",
  wrap(async (req, res) => {
    const body = z
      .object({
        name: z.string().min(2).max(80),
        email: z.string().email().toLowerCase(),
        password: z.string().min(8).max(100),
        phone: z.string().min(10).max(15).optional(),
      })
      .parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) throw new HttpError(409, "An account with this email already exists");
    const verifyToken = crypto.randomBytes(24).toString("hex");
    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        passwordHash: await bcrypt.hash(body.password, 11),
        verifyToken,
      },
    });
    void sendMail(user.email, "Verify your email — Madhura Naturals", mailTemplates.verify(`${env.siteUrl}/verify-email?token=${verifyToken}`));
    await issueRefresh(res, user.id, true);
    res.status(201).json({ user: publicUser(user), accessToken: signAccess(user.id, user.role) });
  })
);

authRouter.post(
  "/login",
  wrap(async (req, res) => {
    const body = z
      .object({ email: z.string().email().toLowerCase(), password: z.string(), remember: z.boolean().optional() })
      .parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user || !(await bcrypt.compare(body.password, user.passwordHash)))
      throw new HttpError(401, "Invalid email or password");
    if (user.blocked) throw new HttpError(403, "This account has been blocked");
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await issueRefresh(res, user.id, body.remember ?? false);
    res.json({ user: publicUser(user), accessToken: signAccess(user.id, user.role) });
  })
);

authRouter.post(
  "/refresh",
  wrap(async (req, res) => {
    const token = req.cookies?.refresh_token;
    if (!token) throw new HttpError(401, "No session");
    const user = await rotateRefresh(res, token);
    if (!user) throw new HttpError(401, "Session expired");
    res.json({ user: publicUser(user), accessToken: signAccess(user.id, user.role) });
  })
);

authRouter.post(
  "/logout",
  wrap(async (req, res) => {
    const token = req.cookies?.refresh_token;
    if (token) await revokeRefresh(token);
    res.clearCookie("refresh_token", { path: "/api/v1/auth" });
    res.json({ ok: true });
  })
);

authRouter.post(
  "/verify-email",
  wrap(async (req, res) => {
    const { token } = z.object({ token: z.string() }).parse(req.body);
    const user = await prisma.user.findFirst({ where: { verifyToken: token } });
    if (!user) throw new HttpError(400, "Invalid or used verification link");
    await prisma.user.update({ where: { id: user.id }, data: { emailVerifiedAt: new Date(), verifyToken: null } });
    res.json({ ok: true });
  })
);

authRouter.post(
  "/forgot-password",
  wrap(async (req, res) => {
    const { email } = z.object({ email: z.string().email().toLowerCase() }).parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const resetToken = crypto.randomBytes(24).toString("hex");
      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken, resetExpiresAt: new Date(Date.now() + 3600_000) },
      });
      void sendMail(email, "Reset your password — Madhura Naturals", mailTemplates.reset(`${env.siteUrl}/reset-password?token=${resetToken}`));
    }
    res.json({ ok: true }); // do not reveal whether the email exists
  })
);

authRouter.post(
  "/reset-password",
  wrap(async (req, res) => {
    const body = z.object({ token: z.string(), password: z.string().min(8).max(100) }).parse(req.body);
    const user = await prisma.user.findFirst({
      where: { resetToken: body.token, resetExpiresAt: { gt: new Date() } },
    });
    if (!user) throw new HttpError(400, "Reset link is invalid or expired");
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(body.password, 11), resetToken: null, resetExpiresAt: null },
    });
    await prisma.refreshToken.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } });
    res.json({ ok: true });
  })
);

authRouter.get(
  "/me",
  requireAuth,
  wrap(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.auth!.userId } });
    if (!user) throw new HttpError(401, "Account not found");
    res.json({ user: publicUser(user) });
  })
);
