# Electronics Cart — Admin Panel

A full React frontend for the Electronics Cart admin panel, covering all 25 modules from the platform scope document. Built with React 18, React Router, Tailwind CSS, and Recharts. All data is mocked in-memory (`src/data/`) — no backend required.

## Run it

```bash
npm install
npm run dev
```

Then open the local URL Vite prints (usually http://localhost:5173).

## Build for production

```bash
npm run build
```

## What's included

- **Dashboard** — KPI tiles, revenue trend, order status breakdown, sales by brand, low stock alerts, recent orders/activity
- **Catalog** — Products (table, filters, bulk actions, add/edit modal), Categories (reorderable tree), Brands, Inventory (per-warehouse stock, adjustments)
- **Sales** — Orders (detail drawer with delivery timeline), Returns, Coupons, Gift Cards, Flash Sales
- **Customers** — Customer list & profile drawer with order history, Reviews moderation queue
- **Content** — CMS (static pages, blog, homepage blocks), Marketing campaigns, Banners
- **Finance** — Taxes (GST rules), Shipping (zones & couriers), Payment Settings (gateways)
- **Insights** — Reports (exportable tables), Analytics (traffic, funnel, top products)
- **System** — User Roles (permission matrix), Notifications, Audit Logs, API Management, System Settings

## Design system

- **Palette**: graphite sidebar (`#0B0E14`), electric indigo primary (`#3654FF`), amber for stock/attention states, cool off-white background — tuned for an electronics/tech retail admin console rather than a generic dashboard template.
- **Type**: Space Grotesk (display/headings), Inter (body/UI), IBM Plex Mono (SKUs, order IDs, timestamps, currency figures).
- **Signature element**: LED-style status dots (`StatusDot` component) instead of generic pill badges for order/stock/return states — a nod to the product category.

## Next steps

This is the admin panel. The customer-facing storefront (20+ pages: Home, PLP, PDP, Cart, Checkout, etc.) is the planned follow-up, sharing the same design tokens.

## Wiring to a real backend

Every page's mock data lives in `src/data/`. Swap the static imports for API calls (e.g. `fetch`/`axios` + React Query) — the component structure and props already expect the same shapes, so this is largely a drop-in replacement.
