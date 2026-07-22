import "dotenv/config";

const req = (key: string, fallback?: string): string => {
  const v = process.env[key] ?? fallback;
  if (v === undefined) throw new Error(`Missing env var ${key}`);
  return v;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: req("DATABASE_URL"),
  jwtAccessSecret: req("JWT_ACCESS_SECRET", "dev_access_secret_change_me"),
  jwtRefreshSecret: req("JWT_REFRESH_SECRET", "dev_refresh_secret_change_me"),
  siteUrl: process.env.SITE_URL ?? "http://localhost:3000",
  paymentProvider: process.env.PAYMENT_PROVIDER ?? "mock",
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM ?? "Madhura Naturals <no-reply@madhuranaturals.in>",
  },
  isProd: (process.env.NODE_ENV ?? "development") === "production",
};
