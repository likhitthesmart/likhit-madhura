import jwt from "jsonwebtoken";
import crypto from "crypto";
import type { Response } from "express";
import { env } from "../env";
import { prisma } from "../prisma";

export interface AccessPayload {
  sub: string;
  role: string;
}

export const signAccess = (userId: string, role: string) =>
  jwt.sign({ sub: userId, role }, env.jwtAccessSecret, { expiresIn: "15m" });

export const verifyAccess = (token: string): AccessPayload =>
  jwt.verify(token, env.jwtAccessSecret) as unknown as AccessPayload;

const hash = (t: string) => crypto.createHash("sha256").update(t).digest("hex");

export async function issueRefresh(res: Response, userId: string, remember: boolean) {
  const token = crypto.randomBytes(48).toString("hex");
  const days = remember ? 30 : 7;
  await prisma.refreshToken.create({
    data: {
      tokenHash: hash(token),
      userId,
      expiresAt: new Date(Date.now() + days * 86400_000),
    },
  });
  res.cookie("refresh_token", token, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: "lax",
    path: "/api/v1/auth",
    maxAge: days * 86400_000,
  });
}

export async function rotateRefresh(res: Response, token: string) {
  const record = await prisma.refreshToken.findUnique({
    where: { tokenHash: hash(token) },
    include: { user: true },
  });
  if (!record || record.revokedAt || record.expiresAt < new Date()) return null;
  if (record.user.blocked) return null;
  await prisma.refreshToken.update({ where: { id: record.id }, data: { revokedAt: new Date() } });
  await issueRefresh(res, record.userId, true);
  return record.user;
}

export async function revokeRefresh(token: string) {
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hash(token), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
