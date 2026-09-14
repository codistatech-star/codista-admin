# Cutover checklist — www.codista.in + admin.codista.in

1. Create Neon project and copy connection strings into production env.
2. Deploy `codista/` to Vercel (or similar) as one project.
3. Attach domains:
   - `www.codista.in` (and apex `codista.in` → redirect to www)
   - `admin.codista.in`
4. Production env vars:
   - `DATABASE_URL`, `DIRECT_URL`
   - `AUTH_SECRET`
   - `AUTH_URL=https://admin.codista.in`
   - `ADMIN_HOST=admin.codista.in`
   - `PUBLIC_HOST=www.codista.in`
5. Run `npx prisma db push` (or migrate deploy) and `npm run db:seed`.
6. Verify:
   - https://www.codista.in/ loads public Home
   - https://www.codista.in/journey loads Journey
   - https://admin.codista.in/ redirects to login/dashboard
   - Admin cookies are host-only (not `.codista.in`)
7. Publish real achievements/gallery in CMS before promoting Journey content.
8. Retire old `app.codista.in` CodistaSite APIs and ASP.NET admin UI after staff sign-off.
9. Optional later: migrate member master data from MySQL (not auto-generated fee rows).
