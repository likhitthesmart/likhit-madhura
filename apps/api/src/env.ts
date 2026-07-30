import "dotenv/config";

const req = (key: string, fallback?: string): string => {
  const v = process.env[key] ?? fallback;
  if (v === undefined) throw new Error(`Missing env var ${key}`);
  return v;
};

const siteUrl = (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: req("DATABASE_URL"),
  jwtAccessSecret: req("JWT_ACCESS_SECRET", "dev_access_secret_change_me"),
  jwtRefreshSecret: req("JWT_REFRESH_SECRET", "dev_refresh_secret_change_me"),
  siteUrl,
  paymentProvider: process.env.PAYMENT_PROVIDER ?? "mock",
  // Unset -> the chatbot falls back to its rule-based replies instead of erroring
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  // Where the shop's own copy of orders and enquiries lands. Comma-separated for
  // several recipients. Unset -> those notifications are logged, not sent.
  adminEmail: (process.env.ADMIN_EMAIL ?? "").trim(),
  razorpay: {
    // test keys start rzp_test_, live keys rzp_live_ — same API, no mode flag
    keyId: process.env.RAZORPAY_KEY_ID ?? "",
    keySecret: process.env.RAZORPAY_KEY_SECRET ?? "",
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET ?? "",
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    // derived, not configurable — it must match an Authorised redirect URI in the
    // Google console exactly, and a second env var is a second thing to get wrong
    redirectUri: `${siteUrl}/api/v1/auth/google/callback`,
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM ?? "Madhura Naturals <no-reply@madhuranaturals.in>",
  },
  isProd: (process.env.NODE_ENV ?? "development") === "production",
};
