# Madhura Naturals — API

Express + TypeScript + Prisma + PostgreSQL REST API. All endpoints live under `/api/v1`.

## Run locally

```bash
npm install
npm run dev:db      # embedded Postgres on :5433 (keep running)
npx prisma db push  # create tables
npm run seed        # catalog, blog, FAQs, coupons, zones, admin user
npm run dev         # API on :4000
```

## Scripts

| Script | Does |
|--------|------|
| `npm run dev` | Watch-mode dev server (tsx) |
| `npm run dev:db` | Boot a throwaway embedded PostgreSQL (UTF-8) for local dev |
| `npm run build` | Compile to `dist/` |
| `npm run seed` | Seed the full catalog + content + admin account |
| `npm run typecheck` | `tsc --noEmit` |

## Layout

- `src/routes/*` — one router per domain (auth, catalog, orders, admin, …)
- `src/lib/*` — tokens, pricing, payment abstraction, mailer, utils
- `src/middleware/*` — auth/RBAC, error handling
- `prisma/schema.prisma` — the data model

## Auth

JWT access tokens (15 min) + rotating refresh tokens stored hashed and set as an
httpOnly cookie scoped to `/api/v1/auth`. Roles: `CUSTOMER`, `STAFF`, `ADMIN`.

## Payments

`src/lib/payment.ts` defines a `PaymentProvider` interface with a `mock` implementation.
Add a Razorpay/Stripe/PhonePe/Cashfree provider there and switch `PAYMENT_PROVIDER` —
the checkout flow does not change.

Seeded admin: `admin@madhuranaturals.in` / `Madhura@2026` (override with `ADMIN_PASSWORD`).
