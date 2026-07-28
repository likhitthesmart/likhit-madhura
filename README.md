# Madhura Naturals — Premium Organic eCommerce Platform

Full-stack, production-ready eCommerce for **Madhura Naturals** ("Premium Organic Goodness") — a premium South Indian organic food brand. Cinematic Higgsfield-generated visuals, a luxury earthy design system, and a complete commerce engine.

## Stack

| Layer | Tech |
|---|---|
| Storefront | Next.js 15 (App Router) · React 19 · TypeScript · TailwindCSS · Framer Motion · Lenis · Zustand · Lucide |
| API | Node.js · Express · TypeScript · Zod · Prisma 6 · PostgreSQL |
| Auth | JWT access (15 min) + rotating refresh tokens (httpOnly cookie) · RBAC (CUSTOMER/STAFF/ADMIN) |
| Email | Nodemailer (SMTP-ready; logs to console when unconfigured) |
| Media | Higgsfield-generated hero film + 46 brand images, self-hosted under `apps/web/public/media` |
| Deploy | Docker Compose (db/api/web) · PM2 · reverse proxy and TLS managed on the host |

## Repo layout

```
apps/api    Express REST API  (src/routes/*, prisma/schema.prisma, src/seed.ts)
apps/web    Next.js storefront + customer account + dark admin panel (src/app/*)
docker-compose.yml  Production stack
ecosystem.config.js PM2 alternative to Docker
```

## Local development (Windows/macOS/Linux — no Docker needed)

Database is Neon (hosted Postgres) — no local Postgres to run. Put the Neon
connection string in `apps/api/.env` as `DATABASE_URL` (see `.env.example`).

```bash
# 1. API — terminal A
cd apps/api
npm install
npx prisma db push  # create tables
npm run seed        # 8 categories, 21 products, blogs, FAQs, coupons, zones, admin user
npm run dev         # API on :4000

# 2. Web — terminal C
cd apps/web
npm install
npm run dev         # storefront on :3000 (proxies /api/v1/* to :4000)
```

**Admin login:** `admin@madhuranaturals.in` / `Madhura@2026` (change via `ADMIN_PASSWORD` env before seeding). Admin panel at `/admin`.

## Production

```bash
cp .env.example .env   # fill secrets (JWT, SMTP, Cloudinary, DB password, SITE_URL)
docker compose up -d --build
docker compose exec api npx prisma db push && docker compose exec api npm run seed
```

The containers publish to loopback only (`127.0.0.1:3000` web, `127.0.0.1:4000` api).
Point your own reverse proxy at those: `/api/` → `:4000`, everything else → `:3000`.
TLS is terminated there too — the stack itself serves plain HTTP.

## Feature map

- **Storefront**: cinematic hero film, animated brand story, categories, featured products, farm-to-home journey, certifications, testimonials, Instagram gallery, blog previews, FAQ accordion, newsletter.
- **Catalog**: search with autocomplete + voice input, filters (category/price/rating/stock/organic/bestseller/discount), sorting, pagination.
- **Product page**: hover-zoom gallery (video-ready), nutrition table, benefits/uses, storage, per-product FAQs, verified reviews with photos, related + recently viewed, JSON-LD Product/Breadcrumb schema.
- **Cart/Checkout**: quantity mgmt, save-for-later, live server quote (coupons incl. auto-apply/category/user/limits, shipping zones by pincode, GST breakup), multi-step checkout, gift note, payment window countdown, retry/failure flows. Payment gateway abstracted (`apps/api/src/lib/payment.ts`) — implement `PaymentProvider` for Razorpay/PhonePe/Cashfree/Stripe without touching checkout.
- **Accounts**: signup/login/refresh/logout, email verify + password reset (SMTP-ready), profile, addresses, order history + invoices, wishlist, coupons, guest order tracking by orderNo+email.
- **Admin (dark theme)**: dashboard (revenue, orders, visitors, conversion, abandoned carts, top products, low stock, traffic sources), products/categories CRUD + bulk upload endpoint, inventory with logs + adjustments, order management with timeline/status/tracking/CSV export, users & roles, advanced coupons with analytics, review moderation, blog/FAQ/testimonial content, shipping zones, enquiries (contact + chat escalations), subscribers, visitor analytics (device/browser/OS/pages/funnel/referrers), store settings, audit logs.
- **Chatbot "Madhu"**: themed floating assistant answering products/orders/delivery/returns/offers/FAQs from live store data, escalates to support.
- **Security**: helmet, rate limiting, Zod validation everywhere, bcrypt, RBAC, rotating refresh tokens, audit logs, soft product deletes.
- **SEO**: per-page metadata, canonical URLs, OG/Twitter cards, Organization/Product/Article/FAQ/Breadcrumb JSON-LD, sitemap.xml, robots.txt.
- **Analytics**: first-party event pipeline (pageviews, add-to-cart, checkout, purchase) with device/browser/OS/referrer capture; GA4/Meta Pixel/Clarity slots via env vars in compose.

## Regenerating brand imagery

All visuals were generated with **Higgsfield AI** (nano-banana image model + Kling 3.0 Turbo for the hero film). `assets-manifest.json` maps every media file to its generation job ID; prompts follow a house style — warm golden-hour South Indian scenes, earthy olive/beige/gold palette, "MADHURA NATURALS" kraft-label packshots.
