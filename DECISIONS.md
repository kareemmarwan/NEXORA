# DECISIONS.md — Reasonable defaults and trade-offs

This file documents decisions made where the specification was open-ended.

---

## 1. Database & Schema

- **Order numbers**: sequence-based (`AS-YYYY-000123`). Sequence is global, not reset per year. The format still looks per-year.
- **Payment proof storage**: private Supabase Storage bucket `payment-proofs` with signed URLs (120s expiry for customer, 300s for admin). Files stored at `{user_id}/{order_id}-{timestamp}.{ext}`.
- **Service covers**: public bucket `service-covers` (direct URL access).
- **Brief storage**: stored as a single JSONB column in `orders.brief`. Structure: `{ answers: { [serviceId]: { answers: string[], notes?: string } }, contact_phone: string }`.
- **role escalation prevention**: trigger `prevent_role_escalation` blocks non-admin updates to the `role` column. Also enforced in RLS `with check`.

## 2. i18n & RTL

- Arabic is default locale; English is secondary.
- Numbers and prices use Western digits (0-9) in both languages via `Intl.NumberFormat('en-US')`.
- Directional icons flip with `rtl:-scale-x-100` Tailwind class.
- All layout uses Tailwind CSS logical properties (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`, `border-s`).

## 3. Payments

- **Manual payment**: admin-managed methods (bank transfer, mobile wallet, cash). Customer uploads proof image/PDF.
- **Stripe Checkout**: hosted checkout session. Webhook marks order paid. Enabled only when `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are set.
- **Price trust**: all prices, delivery days and subtotals are recomputed server-side from the database in `POST /api/orders`. Client prices are never trusted.

## 4. Cart & Checkout

- Cart persists in `localStorage` via Zustand `persist`. Cart content is NOT authoritative — the server recomputes on order creation.
- Checkout is a 3-step flow: brief → payment method → review & confirm.
- Brief requirements are fetched server-side via `POST /api/checkout/preview` (validates service IDs and returns server-computed pricing).

## 5. Auth

- Supabase Auth with email+password. Google OAuth is supported if configured in the Supabase dashboard.
- `profiles` row is auto-created by a database trigger on `auth.users` insert.
- Password reset uses Supabase's built-in flow with redirect to `/reset-password`.
- Admin routes are protected both in middleware (role check) and in each server component (requireAdmin helper).

## 6. Security

- All mutations go through server actions or route handlers that re-check session and role.
- `SUPABASE_SERVICE_ROLE_KEY` is only imported in modules with `import 'server-only'`.
- Rate limiting: in-memory sliding window per IP. Swap for Upstash Redis in production by implementing the same interface.
- File uploads: validated for type and size. Payment proofs: 5 MB, image/PDF only. Service covers: 4 MB, images only.
- Markdown rendered with `rehype-sanitize` to prevent XSS.

## 7. Email

- Transactional emails via Resend, behind `RESEND_API_KEY` flag. Skipped silently when not configured.
- Bilingual templates for order created, payment confirmed, delivered.

## 8. UI & Design

- No heavy UI kit. All components built from scratch with Tailwind and semantic HTML.
- Theme: light by default, dark mode via `class` on `<html>`, system preference respected, persisted in `localStorage`.
- Brand color: deep blue (`hsl(217 91% 60%)`). Navbar and footer use navy `#03234d` (`hsl(214 42% 16%)`) with light text.
- Font: Cairo for both Arabic and English, via `next/font/google`.

## 9. Performance

- Server components by default. Client components only where needed (cart, forms, interactive UI).
- `loading.tsx` and `error.tsx` per route group.
- `not-found.tsx` for 404 pages.
- Service catalog is server-rendered with URL-driven filters (shareable URLs).
- SEO: `generateMetadata` on service pages, JSON-LD `Service` schema.

## 10. Testing

- Unit tests for pricing logic (`tests/pricing.test.ts`) and input validation (`tests/validation.test.ts`) via vitest.
- Playwright smoke tests (`tests/e2e/smoke.spec.ts`) cover: home page loads, catalog renders, service page has Add to cart, login form renders, language switcher works.

## 11. What needs YOUR input before launch

- [ ] Replace placeholder prices in `supabase/seed.sql` with real prices.
- [ ] Fill in real bank/wallet details in the `payment_methods` seed row.
- [ ] Replace `support@example.com` and phone numbers in the footer and `.env.example`.
- [ ] Upload real service cover images (or use placeholder URLs).
- [ ] Configure Stripe keys and webhook secret (or leave blank for manual-only).
- [ ] Configure Resend API key for transactional emails (or leave blank).
- [ ] Set your site URL in `NEXT_PUBLIC_SITE_URL`.
- [ ] Add your logo or replace the text logo in the header.
- [ ] Update the Arabic/English service descriptions in `supabase/seed.sql` with your real offerings.
- [ ] Create the first admin user via SQL as documented in `README.md`.
- [ ] Test both Arabic (RTL) and English (LTR) layouts visually on mobile and desktop.