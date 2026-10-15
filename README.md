# AI Services Store — Setup Guide

A bilingual (Arabic/English) productized-services website that sells AI agents, WhatsApp bots, workflow automation and related services with fixed prices and fixed delivery times.

## Tech Stack

- **Next.js 14** (App Router) + TypeScript (strict)
- **TailwindCSS** with CSS logical properties
- **Supabase** — Postgres, Auth, Storage, Row Level Security
- **next-intl** — i18n with `ar` (default) and `en`
- **Zustand** — cart state with `persist`
- **Stripe Checkout** — optional online payments
- **Resend** — optional transactional emails

---

## Step-by-step setup

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com), create a project and note:

- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` key (under Settings → API) → `SUPABASE_SERVICE_ROLE_KEY`

### 2. Run the database migration

Open the Supabase **SQL Editor**, paste the contents of `supabase/migrations/0001_init.sql` and run it.

Then paste `supabase/seed.sql` and run it to insert the demo categories, services, add-ons and payment methods.

### 3. Create the first admin

After you register your first user through the app, run in the SQL Editor:

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'you@example.com');
```

Replace `you@example.com` with the email you used to register.

### 4. Configure environment variables

Copy `.env.example` to `.env.local` and fill in:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Optional — online payments (Stripe)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional — transactional emails (Resend)
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@yourdomain.com
```

If `STRIPE_SECRET_KEY` is not set, the online payment option is automatically hidden and manual payment works.

If `RESEND_API_KEY` is not set, emails are skipped silently.

### 5. Install dependencies and run

```bash
npm install
npm run dev
```

Open `http://localhost:3000/ar` (Arabic, RTL) or `http://localhost:3000/en` (English, LTR).

### 6. Stripe webhook (optional)

Install the [Stripe CLI](https://stripe.com/docs/stripe-cli) and forward webhooks:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET` in `.env.local`.

### 7. Deploy to Vercel (optional)

1. Push the repo to GitHub.
2. Import in [vercel.com](https://vercel.com).
3. Set the environment variables in the Vercel dashboard.
4. Deploy. The app builds with `npm run build`.

---

## Scripts

| Command             | Description                         |
| ------------------- | ----------------------------------- |
| `npm run dev`       | Start dev server                    |
| `npm run build`     | Production build                    |
| `npm run lint`      | ESLint check                        |
| `npm run typecheck` | TypeScript type check               |
| `npm test`          | Run unit tests (vitest)             |
| `npm run test:e2e`  | Run Playwright smoke tests (needs running server) |

---

## Project structure

```
messages/          ar.json, en.json — all UI strings
supabase/          SQL migration + seed
src/
  app/[locale]/    Next.js App Router pages
  components/      ui/, layout/, services/, cart/, orders/, admin/
  lib/             supabase, stripe, pricing, validation, email, utils
  store/           Zustand cart store
  types/           Database TypeScript types
tests/             Unit tests (vitest) + e2e (Playwright)
```

---

## What needs your input before launch

See the **final checklist** printed at the end of the build, or check `DECISIONS.md`.

---

## License

Private — all rights reserved.