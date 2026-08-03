# Electronics Cart — Admin Panel

React admin console for Electronics Cart, wired to the `ecommerce-backend` APIs. Built with React 19, React Router, Tailwind CSS, and Recharts.

## Prerequisites

1. Backend running on `http://localhost:5000` (see `../ecommerce-backend`)
2. Admin user seeded (`npm run seed:admin` in the backend)

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:5173 and sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from the backend `.env`.

Vite proxies `/api` → `http://localhost:5000`. Override with `VITE_API_BASE_URL` if needed (see `.env.example`).

## Build for production

```bash
npm run build
```

For production, set `VITE_API_BASE_URL` to your API origin (e.g. `https://api.example.com/api`).

## What's included

All 25 modules load and mutate live data:

- **Auth** — Staff login, JWT session, protected routes
- **Dashboard / Reports / Analytics** — Live KPIs and charts
- **Catalog** — Products, categories, brands, inventory adjustments
- **Sales** — Orders, returns, coupons, gift cards, flash sales
- **Customers** — Profiles, block/unblock, review moderation
- **Content** — CMS pages, blog, homepage blocks, marketing campaigns, banners
- **Finance** — Taxes, shipping zones, payment gateway settings
- **System** — Staff/roles, notifications, audit logs, API keys/webhooks, store settings

## Design system

- **Palette**: graphite sidebar (`#0B0E14`), electric indigo primary (`#3654FF`), amber for attention states
- **Type**: Space Grotesk (display), Inter (body), IBM Plex Mono (IDs/currency)
- **Status**: LED-style `StatusDot` for order/stock/return states
