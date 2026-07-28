# Deployment Guide

## Option A — Docker Compose (recommended)

The whole stack (PostgreSQL + API + web) runs from one file. The reverse proxy and
TLS are managed on the host, outside this compose file.

```bash
cp .env.example .env
# Fill in: DB_PASSWORD, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, SITE_URL,
#          SMTP_*, CLOUDINARY_*, and optional analytics IDs.

docker compose up -d --build
```

On first boot the API container runs `prisma db push` and seeds the catalog automatically
(see `apps/api/Dockerfile`). Both containers publish on loopback only:
`127.0.0.1:3000` (web) and `127.0.0.1:4000` (api).

Verify:

```bash
docker compose ps
curl http://127.0.0.1:4000/api/v1/health   # {"ok":true}
curl -I http://127.0.0.1:3000/             # 200
```

### Reverse proxy and HTTPS

Handled on the host. Route `/api/` → `127.0.0.1:4000` and everything else →
`127.0.0.1:3000`, and terminate TLS there — the containers speak plain HTTP and are
not reachable from outside the machine.

Two things the app needs from the proxy:

- `SITE_URL` must be the public HTTPS origin. It is the OAuth redirect base, the link
  base in emails, and the allowed CORS origin, so a mismatch breaks Google sign-in.
- Forward `X-Forwarded-For` and `X-Forwarded-Proto`. The API runs with
  `trust proxy = 1`, so rate limiting keys on the real client IP and secure cookies
  are only set when the request is recognised as HTTPS.

## Option B — PM2 (bare metal / VM)

For hosts with Node and PostgreSQL already installed:

```bash
# API
cd apps/api && npm ci && npm run build
npx prisma db push && npm run seed

# Web
cd ../web && npm ci && npm run build

# From repo root, start both under PM2
pm2 start ecosystem.config.js
pm2 save && pm2 startup
```

Put your reverse proxy in front, routing `/api/` → `:4000` and everything else → `:3000`.

## Environment variables

| Variable | Used by | Notes |
|----------|---------|-------|
| `DATABASE_URL` | api | Postgres connection string |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | api | Long random strings — **required in production** |
| `SITE_URL` | api, web | Public origin, e.g. `https://madhuranaturals.in` |
| `PAYMENT_PROVIDER` | api | `mock` today; swap when a gateway is wired |
| `SMTP_HOST/PORT/USER/PASS/FROM` | api | Transactional email; logs to console if unset |
| `CLOUDINARY_*` | api | Optional media uploads |
| `NEXT_PUBLIC_GA_ID` / `NEXT_PUBLIC_META_PIXEL_ID` / `NEXT_PUBLIC_CLARITY_ID` | web | Optional analytics, injected at build |
| `ADMIN_PASSWORD` | api (seed) | Overrides the default admin password |

## Post-deploy checklist

- [ ] Change the seeded admin password (`admin@madhuranaturals.in`).
- [ ] Set strong `JWT_*` secrets and a real `DB_PASSWORD`.
- [ ] Point DNS at the host and enable HTTPS.
- [ ] Configure SMTP so order/verification emails actually send.
- [ ] Wire a real payment provider in `apps/api/src/lib/payment.ts`.
- [ ] Submit `sitemap.xml` in Google Search Console.
