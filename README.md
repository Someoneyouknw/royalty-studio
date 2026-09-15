# Royalty Studio — Photography Website + CMS

A production-ready, fully responsive photography business website with a
built-in content management system. Built with **Next.js (App Router) +
TypeScript**, **Tailwind CSS**, and **Supabase** (PostgreSQL, Auth, Storage,
Realtime).

The public site is a premium photography experience; the admin dashboard lets a
photographer manage the entire website — photos, categories, services,
testimonials, inquiries, live chat, and settings — **without touching code.**

---

## Table of contents

1. [Tech stack](#tech-stack)
2. [Features](#features)
3. [Prerequisites](#prerequisites)
4. [Quick start](#quick-start)
5. [Environment variables](#environment-variables)
6. [Supabase setup](#supabase-setup) — database, storage, auth, realtime
7. [Create your first admin](#create-your-first-admin)
8. [Local development](#local-development)
9. [Deploying to Vercel](#deploying-to-vercel)
10. [Custom domain](#custom-domain)
11. [How things work](#how-things-work) — images, chat, WhatsApp
12. [Project structure](#project-structure)
13. [Production checklist](#production-checklist)
14. [Security notes](#security-notes)

---

## Tech stack

- **Next.js 15** (App Router, Server Components, Route Handlers, Server Actions-ready)
- **TypeScript** everywhere
- **Tailwind CSS 3** with a custom design system (orange / black / white / cream)
- **shadcn-style UI primitives** built on Radix UI, **lucide-react** icons,
  **Framer Motion** for subtle animation
- **Supabase**: PostgreSQL, Auth, Storage, Realtime
- **Zod** for validation, **@dnd-kit** for drag‑and‑drop ordering,
  **sonner** for toasts, self-hosted fonts via **@fontsource**

> **Version note:** we pin the latest patched **Next.js 15.x** rather than
> jumping to 16 so the whole ecosystem (Radix, Framer Motion, `@supabase/ssr`)
> stays on well-tested ground. Fonts are self-hosted (no runtime Google Fonts
> dependency) for performance and privacy.

---

## Features

**Public site** — home (hero, featured work, categories, services, about,
testimonials, CTA), portfolio with dynamic category filtering and a
full-screen keyboard/swipe lightbox, services, about, and a contact page with a
booking/inquiry form. Floating WhatsApp button and a live chat widget. SEO
metadata, Open Graph, `sitemap.xml`, `robots.txt`, and JSON-LD structured data.

**Admin CMS** (`/admin`) — dashboard overview, drag-and-drop multi-photo
uploader, portfolio manager (search / filter / bulk actions / edit / feature /
publish), category manager with a safe-delete flow, services, testimonials,
inquiry manager (with call / WhatsApp / email quick actions), a realtime chat
inbox, and full website settings. Fully responsive — manage everything from a
phone.

---

## Prerequisites

- **Node.js 18.18+** (Node 20+ recommended)
- A free **Supabase** account → <https://supabase.com>
- A **Vercel** account for deployment (optional but recommended)

---

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Create your env file and fill in Supabase values (see below)
cp .env.example .env.local

# 3. Run the database migrations + seed in Supabase (see "Supabase setup")

# 4. Start the dev server
npm run dev
# → http://localhost:3000  (public site)
# → http://localhost:3000/admin/login  (admin)
```

---

## Environment variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Where to find it | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API | Public (anon) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API | **Server only — never expose** |
| `NEXT_PUBLIC_SITE_URL` | Your site URL | `http://localhost:3000` locally; your domain in prod |

`.env.local` is git-ignored. **Never commit real keys.** The service-role key
is only ever read on the server (it is used solely to clean up Storage files
after an authorized delete).

---

## Supabase setup

### 1. Create a project

Create a new project at <https://supabase.com/dashboard>. Note the project URL
and API keys (Project Settings → API) for your `.env.local`.

### 2. Run the migrations

Open **Supabase → SQL Editor** and run these files **in order** (copy‑paste the
contents of each and click *Run*):

1. `supabase/migrations/0001_schema.sql` — tables, enums, indexes, foreign
   keys, constraints, triggers, and the `is_admin()` helper.
2. `supabase/migrations/0002_rls.sql` — Row Level Security policies.
3. `supabase/migrations/0003_storage.sql` — Storage buckets and their policies.

Then optionally load demo content:

4. `supabase/seed/seed.sql` — demo categories, services, testimonials, a
   settings row, and a few stock demo photos. **All clearly marked as demo** —
   delete it any time and replace with your own via the admin dashboard.

> Prefer the CLI? With the [Supabase CLI](https://supabase.com/docs/guides/local-development)
> linked to your project you can run `supabase db push` after placing these in
> your migrations folder, or `psql` them directly.

### 3. Storage buckets

`0003_storage.sql` creates four public buckets automatically: **portfolio**,
**branding**, **services**, **testimonials**. Public read, admin-only write —
enforced by Storage RLS policies. No manual bucket creation needed.

### 4. Authentication settings

In **Supabase → Authentication**:

- **Providers → Email:** enable **Email/Password**.
- **Turn OFF public sign-ups** (Authentication → Providers → Email → *Allow new
  users to sign up* = off, or Auth → Settings). This is important — see
  [Security notes](#security-notes). You'll create admins manually.
- **Enable Anonymous sign-ins** (Authentication → Providers → Anonymous). The
  public chat widget signs visitors in anonymously so Row Level Security can
  scope each conversation to its owner. Without this, live chat is disabled
  (visitors are gracefully directed to WhatsApp / the contact form instead).
- **URL configuration:** set your Site URL and add
  `https://YOUR-DOMAIN/admin/auth/callback` to the **Redirect URLs** (and
  `http://localhost:3000/admin/auth/callback` for local password resets).

### 5. Realtime

The chat tables (`messages`, `conversations`) are added to the
`supabase_realtime` publication by `0001_schema.sql`, so realtime works out of
the box.

---

## Create your first admin

Public sign-up is disabled, so create the photographer's account directly:

1. **Supabase → Authentication → Users → Add user** → *Create new user*.
2. Enter the email and a password, and tick **Auto Confirm User**.
3. A matching row is created in `public.profiles` automatically (via the
   `handle_new_user` trigger) with `role = 'admin'`.
4. Sign in at `/admin/login`.

To add another admin later, repeat step 1. (Multi-role staff management is
schema-ready via the `role` column for a future version.)

---

## Local development

```bash
npm run dev        # start the dev server
npm run build      # production build
npm run start      # run the production build locally
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
```

---

## Deploying to Vercel

1. Push this repo to GitHub (see the note at the top of the delivery message).
2. In Vercel, **New Project → Import** your GitHub repo. Framework preset:
   **Next.js** (auto-detected).
3. Add the environment variables from your `.env.local`
   (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`). Set
   `NEXT_PUBLIC_SITE_URL` to your production URL.
4. **Deploy.** Every push to your main branch redeploys automatically.

---

## Custom domain

1. Vercel → Project → **Settings → Domains** → add `www.yourdomain.com` (and the
   apex `yourdomain.com`), following Vercel's DNS instructions.
2. Update `NEXT_PUBLIC_SITE_URL` to `https://www.yourdomain.com` and redeploy so
   canonical URLs, the sitemap, and Open Graph tags use the real domain.
3. Add the domain's `/admin/auth/callback` URL to Supabase **Redirect URLs**.

HTTPS is handled automatically by Vercel.

---

## How things work

### Images

Uploads go through `POST /api/upload`, which validates type (JPG/PNG/WebP) and
size (≤10 MB) **on the server**, stores the file in Supabase Storage, and
returns a public URL. The database stores only metadata + the storage path —
never the image bytes. Public images render through **`next/image`** for
automatic responsive sizes, lazy loading, and modern formats (AVIF/WebP).
Galleries paginate ("Load more") so the whole portfolio never loads at once.
Deleting a photo also removes its Storage object.

### Chat (Supabase Realtime)

The floating widget creates a `conversation` and `messages` under an
**anonymous auth session**, so Row Level Security scopes each visitor to their
own conversation. Both the visitor widget and the admin inbox subscribe to
Realtime, so messages appear without refreshing. Admin replies post through
`POST /api/messages`.

### WhatsApp

The WhatsApp number and default message come from **site settings** (never
hard-coded). Buttons appear on the homepage CTA, contact page, footer, floating
button, and inquiry details, each opening a `wa.me` deep link with a
context-appropriate pre-filled message.

---

## Project structure

```
app/
  (public)/            # public site (home, portfolio, services, about, contact)
  admin/               # login, reset-password, auth callback
    (protected)/       # dashboard + all CMS pages (auth-guarded)
  api/                 # Route Handlers (photos, categories, services, …)
  sitemap.ts, robots.ts
components/
  ui/                  # shadcn-style primitives (button, dialog, select, …)
  layout/ home/ gallery/ portfolio/ booking/ chat/ admin/ shared/ seo/
lib/
  supabase/            # client / server / admin / public / middleware
  auth.ts data.ts validations.ts api.ts fetcher.ts whatsapp.ts rate-limit.ts
types/database.ts      # typed schema (regenerate with `supabase gen types`)
supabase/
  migrations/          # 0001_schema, 0002_rls, 0003_storage
  seed/seed.sql
middleware.ts          # refreshes auth + guards /admin
```

---

## Production checklist

- [ ] Ran `0001` → `0002` → `0003` migrations in Supabase
- [ ] (Optional) ran `seed.sql`, then replaced demo content with your own
- [ ] Enabled **Email/Password** auth; **disabled public sign-ups**
- [ ] Enabled **Anonymous sign-ins** (for live chat)
- [ ] Created your admin user (Auto Confirm) and signed in at `/admin/login`
- [ ] Added your production + localhost `/admin/auth/callback` to Redirect URLs
- [ ] Set all env vars in Vercel; `NEXT_PUBLIC_SITE_URL` = your real domain
- [ ] Updated **Website Settings** in the admin: studio name, contact details,
      WhatsApp number, social links, hero/about images, SEO
- [ ] Uploaded real photos; set featured images; published categories/services
- [ ] Only published **genuine** testimonials (removed the demo ones)
- [ ] Verified `sitemap.xml` and `robots.txt` show your domain

---

## Security notes

- **Row Level Security** is on for every table. The public (anon) role can only
  read *published* content and submit inquiries / its own chat; all management
  and all private data (inquiries, conversations, visitor contact details)
  require an authenticated admin.
- The **service-role key** never reaches the browser (guarded by a
  `server-only` import) and is used only for post-authorization Storage cleanup.
- **Server-side authorization** is enforced in every admin API route
  (`requireAdmin`) and in the admin layout — not just by hiding UI.
- **Disable public sign-ups.** New auth users are granted the `admin` role by a
  trigger (intended for the single-photographer use case where you create
  accounts manually). If public sign-up were left on, anyone could self-register
  as admin. Keep it off and create admins from the Supabase dashboard.
- Inputs are validated with **Zod**; uploads are validated for type and size on
  the server; a lightweight rate limiter guards public inquiry submissions; and
  API errors never leak raw database messages to clients.
- No payment processing is included (by design). The architecture leaves room
  for email notifications, analytics, client galleries, etc. without a rewrite.

---

Built for Royalty Studio. Replace the demo content and make it yours.
