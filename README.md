# Kelecung's Village Plants

Next.js + Supabase CMS/public website for Kelecung's Village.

## Features

- Public home page with search + edible/inedible filter.
- Public plant detail pages at stable slug URLs (`/plants/[slug]`).
- Admin login at `/admin/login` and private editor at `/admin`.
- Plant editor with drag-and-drop block ordering and live preview.
- Auto-publish on save, with explicit unpublish and soft delete.
- Supabase Postgres + Auth + Storage (`plants-public` bucket).

## Stack

- Next.js App Router + TypeScript + Tailwind CSS.
- Supabase (`@supabase/supabase-js`, `@supabase/ssr`).
- `zod`, `react-hook-form`, `@dnd-kit/core`, `@dnd-kit/sortable`.
- `vitest` for unit tests.

## Environment Variables

Copy `.env.example` to `.env.local` and fill values:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
ADMIN_EMAIL=
```

`ADMIN_EMAIL` must match the single shared admin account email.

## Local Development

```bash
npm install
npm run dev
```

Open:
- Public site: [http://localhost:3000](http://localhost:3000)
- Admin login: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

## Supabase Setup

1. Create a Supabase project.
2. Enable email/password auth in **Authentication > Providers**.
3. Create one shared admin user (email/password).
4. Create a public storage bucket named `plants-public`.
5. Run SQL migration from:
   - `/Users/gsharsh/Desktop/kelecung-village-plants/supabase/migrations/202602120001_init.sql`

## Scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
```

## Deploy (Vercel)

1. Import this repository into Vercel.
2. Add the same env vars from `.env.local`.
3. Ensure Supabase migration and bucket setup are complete.
4. Deploy and smoke-test create/save/unpublish/publish flow.

## Notes

- Slugs are editable only before first publish.
- Saving a draft keeps it hidden until explicit publish.
- Soft delete sets `deleted_at` and removes the plant from public pages.
