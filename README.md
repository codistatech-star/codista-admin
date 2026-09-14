# Codista Academy

One Next.js app for the public website and academy admin.

## Domains

| Host | App |
|------|-----|
| `www.codista.in` / `codista.in` | Public site (`/`, `/journey`) |
| `admin.codista.in` | Admin + Website CMS (`/admin/*`) |

Locally both work on `localhost:3000`. Admin UI is at `/admin/login`.

## Stack

- Next.js 15 (App Router)
- Neon Postgres + Prisma
- Auth.js (credentials) — roles: **Admin** (seeded), **Branch Admin** (Settings)

## Setup

1. Copy `.env.example` to `.env` and set Neon URLs + `AUTH_SECRET`.
2. Install and migrate:

```bash
cd codista
npm install
npx prisma db push
npm run db:seed
npm run dev
```

3. Login: `admin@codista.in` / `ChangeMe@123` (override via `SEED_*` env vars).

## Membership model

- No auto monthly fee rows.
- Collect payment → receipt + cash entry → extend `validUntil`.
- Lists show Active / Expiring / Expired from dates.
- Members map to **many batches** and **many extra classes**.
- Joining-fee day slabs configured in Settings.

## Deploy cutover (Phase 5)

1. Deploy this app to Vercel (or similar).
2. Add domains `www.codista.in` and `admin.codista.in` to the same project.
3. Set env: `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `AUTH_URL=https://admin.codista.in`, `ADMIN_HOST=admin.codista.in`, `PUBLIC_HOST=www.codista.in`.
4. Run `prisma migrate deploy` / `db push` + seed on production.
5. Point DNS A/CNAME for both hosts to the deployment.
6. Stop using old `app.codista.in` public CMS APIs once www reads from Neon.
7. Keep old ASP.NET admin offline after staff cutover.

Cookie/session stays on the admin host only (do not set cookie domain to `.codista.in`).
