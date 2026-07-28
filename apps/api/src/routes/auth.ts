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
    if (!user?.passwordHash || !(await bcrypt.compare(body.password, user.passwordHash)))
      throw new HttpError(401, "Invalid email or password");
    if (user.blocked) throw new HttpError(403, "This account has been blocked");
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await issueRefresh(res, user.id, body.remember ?? false);
    res.json({ user: publicUser(user), accessToken: signAccess(user.id, user.role) });
  })
);

/** Verifies a Google ID token. Google's tokeninfo endpoint checks the signature
 *  and expiry for us; the audience and email_verified checks are ours to make —
 *  without the aud check any Google token from any app would be accepted.
 *  ponytail: one HTTPS hop per sign-in instead of local JWKS verification;
 *  swap in google-auth-library if login volume ever makes the hop hurt. */
/* ------------------------- Google OAuth 2.0 (auth code) ------------------------- */

const STATE_COOKIE = "g_oauth_state";
const STATE_OPTS = { httpOnly: true, secure: env.isProd, sameSite: "lax" as const, path: "/api/v1/auth" };

/** Verifies a Google ID token. Google's tokeninfo endpoint checks the signature
 *  and expiry for us; the audience and email_verified checks are ours to make —
 *  without the aud check any Google token from any app would be accepted.
 *  ponytail: one HTTPS hop per sign-in instead of local JWKS verification;
 *  swap in google-auth-library if login volume ever makes the hop hurt. */
export const verifyGoogle = async (idToken: string) => {
  if (!env.google.clientId) throw new HttpError(503, "Google sign-in is not configured");
  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
  if (!res.ok) throw new HttpError(401, "Google sign-in failed, please try again");
  const t = (await res.json()) as { aud?: string; sub?: string; email?: string; email_verified?: string | boolean; name?: string };
  if (t.aud !== env.google.clientId) throw new HttpError(401, "This Google sign-in was not issued for Madhura Naturals");
  if (String(t.email_verified) !== "true" || !t.email || !t.sub) throw new HttpError(401, "Your Google account has no verified email");
  return { sub: t.sub, email: t.email.toLowerCase(), name: t.name };
};

/** Google vouched for the address, so an existing password account with the same
 *  email is the same person — link it rather than erroring on a duplicate. */
const upsertGoogleUser = async (profile: Awaited<ReturnType<typeof verifyGoogle>>) => {
  const existing = await prisma.user.findUnique({ where: { email: profile.email } });
  if (existing?.blocked) throw new HttpError(403, "This account has been blocked");
  return existing
    ? prisma.user.update({
        where: { id: existing.id },
        data: {
          provider: "google",
          providerId: profile.sub,
          lastLoginAt: new Date(),
          emailVerifiedAt: existing.emailVerifiedAt ?? new Date(),
          verifyToken: null,
        },
      })
    : prisma.user.create({
        data: {
          email: profile.email,
          name: profile.name?.trim() || profile.email.split("@")[0],
          provider: "google",
          providerId: profile.sub,
          emailVerifiedAt: new Date(),
          lastLoginAt: new Date(),
        },
      });
};

// step 1 — send the browser to Google's consent screen
authRouter.get(
  "/google/start",
  wrap(async (_req, res) => {
    if (!env.google.clientId || !env.google.clientSecret)
      throw new HttpError(503, "Google sign-in is not configured");
    // state ties the callback to this browser — without it, an attacker can feed
    // a victim their own code and land the victim in the attacker's account
    const state = crypto.randomBytes(16).toString("hex");
    res.cookie(STATE_COOKIE, state, { ...STATE_OPTS, maxAge: 10 * 60_000 });
    const params = new URLSearchParams({
      client_id: env.google.clientId,
      redirect_uri: env.google.redirectUri,
      response_type: "code",
      scope: "openid email profile",
      state,
      prompt: "select_account",
    });
    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  })
);

// step 2 — Google returns the browser here with a single-use code
authRouter.get(
  "/google/callback",
  wrap(async (req, res) => {
    // every failure lands back on the login page: this is a browser navigation,
    // so a JSON error body would just be shown as raw text
    const back = (message: string) => res.redirect(`${env.siteUrl}/login?error=${encodeURIComponent(message)}`);
    const q = req.query as Record<string, string | undefined>;
    const expected = req.cookies?.[STATE_COOKIE];
    res.clearCookie(STATE_COOKIE, STATE_OPTS);

    if (q.error) {
      // access_denied covers both "user clicked cancel" and "consent screen is in
      // Testing and this address is not a Test user" — say both, they look identical here
      console.error("[google:consent]", q.error); // logged, not echoed: it is attacker-settable
      return back(
        q.error === "access_denied"
          ? "Google sign-in was declined. If the app is still in Testing, add this address under Test users."
          : "Google sign-in failed, please try again"
      );
    }
    if (!q.code || !expected || q.state !== expected) return back("Google sign-in expired, please try again");

    const token = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: q.code,
        client_id: env.google.clientId,
        client_secret: env.google.clientSecret,
        redirect_uri: env.google.redirectUri,
        grant_type: "authorization_code",
      }),
    });
    if (!token.ok) {
      // Google's body names the real cause (invalid_client, redirect_uri_mismatch,
      // invalid_grant …) — never shown to the user, but we are blind without it
      console.error("[google:token]", token.status, await token.text());
      return back("Google sign-in failed, please try again");
    }
    const { id_token: idToken } = (await token.json()) as { id_token?: string };
    if (!idToken) return back("Google did not return an identity, please try again");

    let user;
    try {
      user = await upsertGoogleUser(await verifyGoogle(idToken));
    } catch (e) {
      console.error("[google:signin]", e);
      return back(e instanceof HttpError ? e.message : "Google sign-in failed");
    }
    await issueRefresh(res, user.id, true);
    // non-httpOnly marker the web store reads to know a refresh is worth trying
    res.cookie("mn_auth", "1", { path: "/", sameSite: "lax", secure: env.isProd, maxAge: 30 * 86400_000 });
    res.redirect(`${env.siteUrl}${user.role === "CUSTOMER" ? "/account" : "/admin"}`);
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
