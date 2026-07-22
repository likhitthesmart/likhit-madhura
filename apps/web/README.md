# Madhura Naturals — Web

Next.js 15 (App Router) storefront, customer account area and admin panel.
TypeScript · Tailwind · Framer Motion · Lenis · Zustand · Lucide.

## Run locally

```bash
npm install
npm run dev          # storefront on :3100 (proxies /api/v1/* to the API)
```

The API must be running (see `apps/api`). `API_URL` (server) and `NEXT_PUBLIC_SITE_URL`
are read from `apps/web/.env`.

## Scripts

| Script | Does |
|--------|------|
| `npm run dev` | Dev server on port 3100 |
| `npm run build` | Production build (standalone output) |
| `npm run start` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` |

## Layout

- `src/app/*` — routes (storefront, `/account`, `/admin`)
- `src/components/layout` — header, footer, providers, chatbot, lead-capture
- `src/components/ui` — logo, motion, newsletter, auth-card
- `src/components/commerce` — product card, lead-magnet band
- `src/components/home` — homepage sections and teasers
- `src/components/admin` — admin design system
- `src/lib` — API client + formatters
- `src/store` — Zustand stores (auth, cart, prefs)

## Design system

Earthy palette (forest / olive / cream / sand / gold / copper) in `tailwind.config.ts`;
component classes (`.btn-primary`, `.card-organic`, `.input-field`, …) in
`src/app/globals.css`. Headings use Cormorant Garamond, body uses Manrope.

## SEO

Per-page metadata + canonicals, JSON-LD (Organization, Product, Breadcrumb, Article,
AggregateRating, FAQ), `sitemap.ts`, `robots.ts`, and `public/llms.txt` for AI search.
