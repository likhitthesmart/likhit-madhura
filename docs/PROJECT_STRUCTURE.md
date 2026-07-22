# Project Structure

A two-app monorepo: a Next.js storefront (`apps/web`) and an Express + Prisma API (`apps/api`), fronted by Nginx in production.

```
madhura-organics/
├── apps/
│   ├── api/                      # Express + Prisma + PostgreSQL REST API
│   │   ├── prisma/
│   │   │   └── schema.prisma      # full data model (users, products, orders, coupons…)
│   │   ├── scripts/
│   │   │   └── dev-db.ts          # embedded Postgres for local dev (no Docker needed)
│   │   ├── src/
│   │   │   ├── env.ts             # typed env loader
│   │   │   ├── prisma.ts          # Prisma client singleton
│   │   │   ├── index.ts           # app entry — mounts all routers + middleware
│   │   │   ├── seed.ts            # full catalog / content / admin seed
│   │   │   ├── lib/               # domain logic
│   │   │   │   ├── tokens.ts       # JWT access + rotating refresh tokens
│   │   │   │   ├── pricing.ts      # cart quote: coupons, shipping zones, GST
│   │   │   │   ├── payment.ts      # payment provider abstraction (mock → Razorpay/Stripe…)
│   │   │   │   ├── mailer.ts       # Nodemailer (SMTP-ready) + templates
│   │   │   │   └── util.ts         # order numbers, money, timeline helpers
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts         # attachAuth / requireAuth / requireRole (RBAC)
│   │   │   │   └── error.ts        # async wrap + Zod/HTTP error handler
│   │   │   └── routes/            # one router per domain
│   │   │       ├── auth.ts         # signup, login, refresh, verify, reset
│   │   │       ├── catalog.ts      # categories, products, search
│   │   │       ├── reviews.ts      # product reviews + wishlist
│   │   │       ├── account.ts      # profile, addresses, coupons
│   │   │       ├── orders.ts       # cart quote, checkout, payment, tracking
│   │   │       ├── blog.ts         # posts + comments
│   │   │       ├── contact.ts      # enquiries, newsletter, chatbot
│   │   │       ├── content.ts      # home / faqs / reviews content
│   │   │       ├── analytics.ts    # first-party event ingest
│   │   │       └── admin.ts        # dashboard, CRUD, inventory, analytics
│   │   ├── Dockerfile
│   │   └── .dockerignore
│   │
│   └── web/                       # Next.js 15 App Router storefront + admin
│       ├── public/
│       │   ├── media/             # Higgsfield-generated hero film + brand imagery
│       │   └── llms.txt           # AI-search (GEO) brand summary
│       └── src/
│           ├── app/               # routes (see below)
│           ├── components/
│           │   ├── layout/         # header, footer, providers, chatbot, lead-capture
│           │   ├── ui/             # logo, motion, newsletter, auth-card
│           │   ├── commerce/       # product-card, lead-magnet-band
│           │   ├── home/           # hero, sections, teasers
│           │   └── admin/          # admin design system (ui.tsx)
│           ├── lib/               # api client, formatters
│           ├── store/             # Zustand stores (auth, cart, prefs)
│           ├── Dockerfile
│           └── .dockerignore
│
├── docs/                          # architecture, structure, deployment, specs
├── nginx/nginx.conf               # reverse proxy (80 → web/api; 443 SSL-ready)
├── docker-compose.yml             # db + api + web + nginx
├── ecosystem.config.js            # PM2 (non-Docker deploy)
├── assets-manifest.json           # media file → Higgsfield job id
└── README.md
```

## Web routes (`apps/web/src/app`)

| Route | Purpose |
|-------|---------|
| `/` | Landing page (lean: hero, brand, why-us, categories, products, teasers, lead magnet) |
| `/shop`, `/product/[slug]` | Catalog listing (filters/sort/search) + product detail |
| `/cart`, `/checkout`, `/checkout/result` | Cart, multi-step checkout, order result |
| `/about` | Our Story (brand + founders) |
| `/our-heritage` | Farming, cold-press process, certifications |
| `/reviews` | Customer reviews + aggregate rating |
| `/blog`, `/blog/[slug]` | Journal & recipes |
| `/faq`, `/contact`, `/track-order` | Support pages |
| `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/verify-email` | Auth |
| `/account/*` | Customer dashboard (orders, wishlist, addresses, coupons, settings) |
| `/admin/*` | Enterprise admin panel (dark theme) |
| `/policies/[policy]` | Shipping, returns, privacy, terms |
| `sitemap.ts`, `robots.ts`, `icon.svg` | SEO / branding |
