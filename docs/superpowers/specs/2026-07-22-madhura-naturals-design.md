# Madhura Naturals — eCommerce Platform Design

Date: 2026-07-22. Source: user /goal spec (full requirements provided verbatim by user).

## Brand

- Display name: **Madhura Naturals** (per supplied logo and final instruction). "Premium Organic Goodness" tagline.
- Logo: recreated as inline SVG (lotus line-mark + serif wordmark) for crisp rendering; raster export used for OG images.
- Palette: olive/forest/algae greens; warm beige, sand, cream, ivory; gold/copper/muted brown accents. No bright colors.
- Type: Cormorant Garamond (headings) + Manrope (body) via next/font.

## Architecture

Monorepo (npm workspaces not needed — two independent apps):

- `apps/api` — Express 4 + TypeScript + Prisma 6 + PostgreSQL. Schema already written (existing `prisma/schema.prisma`, unchanged). REST under `/api/v1`. JWT access (15 min) + rotating refresh tokens (httpOnly cookies). Zod input validation, helmet, rate limiting, RBAC middleware (CUSTOMER/STAFF/ADMIN), audit logs. Payment provider abstraction (`providers/payment.ts`): `mock` provider implements create/confirm/fail/expiry; Razorpay/Stripe/PhonePe slot in behind the same interface. Nodemailer SMTP (logs to console when SMTP env absent). Seed script loads full catalog, blog, FAQs, testimonials, shipping zones, coupons, admin user.
- `apps/web` — Next.js 15 App Router + TypeScript + Tailwind + Framer Motion + Lenis + Zustand + Lucide. Server components fetch the API server-side (`API_URL`); client mutations go through Next rewrites to `/api/v1/*`. Storefront (public), `/account/*` (customer dashboard), `/admin/*` (dark enterprise panel). SEO: metadata API, JSON-LD (Organization, Product, Breadcrumb, Article), sitemap.ts, robots.ts, OG tags.
- Deployment: existing docker-compose (db/api/web/nginx), PM2 ecosystem file, nginx SSL-ready. Unchanged.
- Local dev DB (no Docker/Postgres on this machine): `embedded-postgres` dev dependency boots a throwaway Postgres for dev/verification. Production path stays docker-compose Postgres.

## Visuals (Higgsfield)

All imagery generated with Higgsfield, downloaded and self-hosted in `apps/web/public/media`:

- Hero: cinematic looping video (Option 1 — user-preferred): South Indian sunrise fields → oil pour → turmeric → millets → brass vessels → ghee, warm golden tones, 16:9 + poster image fallback.
- 8 category images, ~21 product packshots (consistent art direction: kraft/glass packaging, warm beige backdrop), heritage/process/journey set, Instagram gallery (6), blog covers (4), about/contact banners.

## Catalog structure

8 categories: Cold Pressed Oils / Ghee / Organic Sugar & Jaggery / Millets / Flours & Atta / Idly Ravva / Spices & Traditionals / Healthy Biscuits (3 variants). 21 seeded products covering every item in the spec. Categories fully manageable from admin.

## Deliberate simplifications (ponytail)

- Three.js/R3F + GSAP skipped: hero is the cinematic video (Option 1); Framer Motion + Lenis cover parallax/micro-animations. Add R3F only if a 3D section is later requested.
- Voice search "ready" = mic button wired to Web Speech API where available; heatmaps/courier/social-login/OTP are schema- and UI-ready stubs per spec ("ready", not live integrations).
- Chatbot is a rule-based themed assistant over live API data (products, order status, FAQs) with escalation to support enquiry — no external LLM dependency.
