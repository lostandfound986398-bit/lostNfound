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
- Copy the session pooler connection URI from **Connect** into `DATABASE_URL` and `DIRECT_URL` in `apps/api/.env`. Use the exact host supplied by Supabase and URL-encode special characters in the database password. The API and database tools currently prefer `DIRECT_URL`.

The database tools load `apps/api/.env`; a separate database environment file is not required.
See Supabase's [connection guide](https://supabase.com/docs/guides/database/connecting-to-postgres) and [API key guide](https://supabase.com/docs/guides/getting-started/api-keys).

Updating these settings does not create tables or restore data from the deleted project.
SQL, migrations, seed data, and storage setup are a separate, later step. Database-backed features require that setup before they can work.
Restart the development servers after changing environment values.

## GitHub

Connect this folder to the intended GitHub repository after confirming its URL.
Local `.env` files and `private/` are excluded by `.gitignore`; commit only the example environment files.
