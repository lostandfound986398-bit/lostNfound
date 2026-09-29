# CBEA Lost & Found Management System

A responsive campus lost-and-found platform for students, faculty, staff, and administrators.

## Applications

- `apps/web` — Next.js user and administrator portal
- `apps/api` — NestJS REST API
- `packages/contracts` — shared TypeScript domain contracts
- `packages/database` — Prisma schema and database tooling

## Local development

```bash
npm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
npm run dev
```

The web app runs on `http://localhost:3000` and the API on `http://localhost:4000`.

If these environment files already exist, edit them instead of overwriting them.
Fill in the Supabase values before starting the applications.

## Connect a replacement Supabase project

Use the same replacement project in both environment files:

- In `apps/api/.env`, set `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SECRET_KEY` from the project's API settings.
- In `apps/web/.env.local`, set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to that project's URL and publishable key. The secret key belongs only in the API environment.
- Copy the transaction pooler URI from **Connect** into `DATABASE_URL` in `apps/api/.env`. Copy the direct connection URI into `DIRECT_URL`. Use the exact hosts supplied by Supabase and URL-encode special characters in the database password. The deployed API uses the pooler; migrations and seed scripts prefer the direct connection.

The database tools load `apps/api/.env`; a separate database environment file is not required.
See Supabase's [connection guide](https://supabase.com/docs/guides/database/connecting-to-postgres) and [API key guide](https://supabase.com/docs/guides/getting-started/api-keys).

Updating these settings does not create tables or restore data from the deleted project.
After configuring the target Supabase project, run `npm run db:setup` to apply pending migrations, seed the seven categories and eight locations, and configure storage buckets. This command writes to the configured project; it can be rerun without duplicating seed entries.

Report photos are public JPG/PNG/WEBP images limited to 10 MB. The upload policy permits only active registered users to upload new photos. Proof files are private (images/PDF, 10 MB), with no browser upload or read access until the proof workflow is implemented. Bucket restrictions and access policies follow the [Supabase Storage access-control guide](https://supabase.com/docs/guides/storage/security/access-control).

Setup does not import school records or create administrator accounts. Registration still requires a matching record in the school master list.
Restart the development servers after changing environment values.

## GitHub

Connect this folder to the intended GitHub repository after confirming its URL.
Local `.env` files and `private/` are excluded by `.gitignore`; commit only the example environment files.

## Vercel deployment

This repository uses two Vercel projects connected to the same GitHub repository:

- `lost-n-found` — root directory `apps/web`, Next.js frontend
- `lost-n-found-api` — root directory `apps/api`, NestJS API

Set the API project's production and preview variables to `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `DATABASE_URL`, `DIRECT_URL`, `WEB_ORIGIN`, `SITE_URL`, and `NODE_ENV=production`. Use the Supabase transaction-pooler URI for `DATABASE_URL` so serverless instances do not consume direct database connections.

Set the web project's production and preview variables to `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_API_URL`, and `NEXT_PUBLIC_SITE_URL`. `NEXT_PUBLIC_API_URL` must be the deployed `lost-n-found-api` URL; `NEXT_PUBLIC_SITE_URL`, `WEB_ORIGIN`, and `SITE_URL` must use the deployed frontend URL.

Never add `SUPABASE_SECRET_KEY`, database passwords, or connection strings to an `.env.example` file or a `NEXT_PUBLIC_*` variable. After the variables are configured, run `npm run db:setup` once against the target Supabase project and deploy the API before the web app.

## Student workflow and client demo

See [the student workflow demonstration](docs/student-workflow-demo.md) for a walkthrough, acceptance checks, office contact configuration, and abandoned-photo maintenance. Students can also open **Help** from the portal navigation.
