# Madhura Naturals — API

Express + TypeScript + Prisma + Neon Postgres REST API. All endpoints live under `/api/v1`.

**Interactive docs: [`/api/docs`](http://localhost:4000/api/docs)** (Swagger UI) — the raw
OpenAPI 3.0 document is at `/api/docs.json` if you want to import it into Postman or
generate a client.

## Run locally

Set `DATABASE_URL` in `.env` to the Neon pooled connection string first.

```bash
npm install
npx prisma db push  # create tables
npm run seed        # catalog, blog, FAQs, coupons, zones, admin user
npm run dev         # API on :4000
```

## Scripts

| Script | Does |
|--------|------|
| `npm run dev` | Watch-mode dev server (tsx) |
| `npm run build` | Compile to `dist/` |
| `npm run seed` | Seed the full catalog + content + admin account |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run check:payment` | Assert gateway signature verification rejects forgeries |
| `npm run check:openapi` | Assert the spec covers every route and has no dangling `$ref` |

## Layout

- `src/app.ts` — Express wiring (importable without opening a port)
- `src/index.ts` — starts the listener
- `src/openapi.ts` — the OpenAPI document served at `/api/docs`
- `src/routes/*` — one router per domain (auth, catalog, orders, admin, …)
- `src/lib/*` — tokens, pricing, payment abstraction, mailer, utils
- `src/middleware/*` — auth/RBAC, error handling
- `prisma/schema.prisma` — the data model

## Auth

JWT access tokens (15 min) + rotating refresh tokens stored hashed and set as an
httpOnly cookie scoped to `/api/v1/auth`. Roles: `CUSTOMER`, `STAFF`, `ADMIN`.

## Payments

`src/lib/payment.ts` defines a `PaymentProvider` interface with two implementations,
selected by `PAYMENT_PROVIDER`:

| Value | Behaviour |
|-------|-----------|
| `mock` | Sandbox buttons on checkout; `verify()` always passes. Default. |
| `razorpay` | Real Razorpay Orders API + Checkout widget. |

### Razorpay

Env: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`.
Test keys (`rzp_test_…`) and live keys (`rzp_live_…`) use the same code path —
switching to production is only a key swap.

Flow: `POST /orders` creates a Razorpay order and returns `payment.razorpayOrderId`
+ `keyId` → the browser opens Razorpay Checkout → its callback posts
`razorpay_order_id` / `razorpay_payment_id` / `razorpay_signature` to
`POST /orders/:id/pay`, which HMAC-verifies before marking the order paid.

`POST /orders/razorpay/webhook` is the authoritative confirmation (fires even if
the customer closes the tab). Register it in the Razorpay dashboard for the
`payment.captured` event. Both paths go through the same idempotent transition,
so a webhook racing the browser callback cannot double-count a sale.

`npm run check:payment` asserts the signature verification rejects forged and
tampered payloads.

Seeded admin: `admin@madhuranaturals.in` / `Madhura@2026` (override with `ADMIN_PASSWORD`).
