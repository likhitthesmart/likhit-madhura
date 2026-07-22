import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { wrap } from "../middleware/error";

export const analyticsRouter = Router();

analyticsRouter.post(
  "/events",
  wrap(async (req, res) => {
    const body = z
      .object({
        sessionId: z.string().max(64),
        type: z.string().max(40),
        path: z.string().max(300).optional(),
        referrer: z.string().max(300).optional(),
        device: z.string().max(20).optional(),
        browser: z.string().max(40).optional(),
        os: z.string().max(40).optional(),
        screen: z.string().max(20).optional(),
        meta: z.record(z.unknown()).optional(),
      })
      .parse(req.body);
    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ?? req.socket.remoteAddress ?? undefined;
    await prisma.analyticsEvent.create({
      data: { ...body, meta: body.meta as object | undefined, ip, userId: req.auth?.userId },
    });
    res.status(202).json({ ok: true });
  })
);
