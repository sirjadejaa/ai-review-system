# PostgreSQL (Neon) & Vercel Deployment Guide

This document details the database architecture, configuration, migration strategy, and deployment procedure for hosting the Pharmacy AI Review & Digital Card application on **Vercel** with a free **PostgreSQL database on Neon**.

---

## 1. Database Architecture Overview

- **ORM:** Prisma 6.19.3
- **Provider:** PostgreSQL (`provider = "postgresql"`)
- **Host:** Neon Serverless PostgreSQL (`neon.tech`)
- **Tenancy:** Single-tenant (one independent pharmacy)
- **Data Models:**
  - `ShopSettings`: Singleton pharmacy identity, contact numbers, structured hours, and persistent logo data.
  - `Feedback`: Private 1–5 star customer feedback records with workflow status (`NEW`, `REVIEWED`, `RESOLVED`).
  - `Offer`: Promotional pharmacy announcements with expiration dates and active status.
  - `AnalyticsEvent`: Privacy-preserving interaction events (`QR_SCAN`, `GOOGLE_REVIEW_CLICK`, `CALL_CLICK`, `WHATSAPP_CLICK`, `DIRECTIONS_CLICK`).
  - `AdminUser`: Store owner credentials (Bcrypt password hash only).
  - `AdminSession`: Cascading server-side session tokens (SHA-256 hash storage).

---

## 2. Neon Database Provisioning (Free Tier)

1. Log in to [Neon Console](https://console.neon.tech).
2. Create a new project (e.g. `pharmacy-review-system`).
3. Select region closest to your pharmacy customers (e.g. `ap-southeast-1` or `eu-central-1`).
4. Copy your database connection string from the Neon dashboard:
   - **Pooled connection string (Recommended for Vercel):**
     ```text
     postgresql://[user]:[password]@[endpoint]-pooler.[region].aws.neon.tech/[dbname]?sslmode=require
     ```
   - **Direct connection string (For migrations/CLI):**
     ```text
     postgresql://[user]:[password]@[endpoint].[region].aws.neon.tech/[dbname]?sslmode=require
     ```

---

## 3. Environment Variable Configuration

Configure the following environment variables in your Vercel Project Settings (**Settings > Environment Variables**):

| Variable Name | Environment | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | Production & Preview | Neon pooled connection string with `?sslmode=require` |
| `NEXT_PUBLIC_APP_URL` | Production | Canonical public URL (e.g. `https://your-pharmacy.vercel.app`) |
| `ADMIN_USERNAME` | Production | Owner username (e.g. `admin`) |
| `ADMIN_PASSWORD_HASH` | Production | Bcrypt hash of owner password (generate via `npx bcryptjs <password>`) |
| `ADMIN_SESSION_SECRET` | Production | High-entropy random secret (32+ chars) |
| `AI_PROVIDER` | Production | `gemini` (recommended) or `openai` or `mock` |
| `AI_API_KEY` | Production | Gemini or OpenAI API key (server-side only) |
| `AI_RATE_LIMIT_PER_MINUTE` | Production | Recommended: `10` |

> ⚠️ **CRITICAL SECURITY RULE:**  
> Never commit `.env`, `.env.local`, or `.env.production` to Git. Ensure all secrets and database passwords are set exclusively via Vercel's encrypted Environment Variables dashboard.

---

## 4. Migration Strategy

### Production Migration Command
Before launching or upon updating the schema, deploy migrations to the Neon database using:

```bash
npx prisma migrate deploy
# or
npm run db:migrate:deploy
```

- **DO NOT** run `npx prisma migrate dev` in production.
- **DO NOT** run `npx prisma db push` in production.
- `prisma migrate deploy` applies the baseline migration (`prisma/migrations/20261009000000_init_postgresql`) deterministically using the `_prisma_migrations` tracking table.

### Local Development Database
For local development, you can use:
1. **Local PostgreSQL:**  
   `DATABASE_URL="postgresql://localhost:5432/ai_review_system"`
2. **Neon Dev Branch:**  
   Create a dedicated branch in your Neon project (e.g. `dev`) and point your local `.env` to it.

To apply migrations locally:
```bash
npm run db:migrate:deploy
```

---

## 5. Seed Behavior & Production Safety

The seed script ([`prisma/seed.ts`](file:///Users/jadejanildeepsinh/Desktop/ai-review-system%20/prisma/seed.ts)) includes strict environment detection:

- **Production Mode (`NODE_ENV=production`):**  
  Zero demo data is created. It guarantees that the singleton `ShopSettings` record (`id = 'default_shop'`) exists with clean, unconfigured fields so the app renders its elegant initial setup state.
- **Development Mode (`NODE_ENV=development`):**  
  Initializes a development admin user. Demo offers and sample business details are ONLY seeded if explicitly opted-in via `SEED_DEV_DEMO=true`.

---

## 6. Vercel Build & Deployment Pipeline

The project `package.json` build script is pre-configured for Vercel:

```json
"build": "prisma generate && next build"
```

1. **Prisma Client Generation:** `prisma generate` compiles the `@prisma/client` engine for the Vercel Lambda Linux environment during the build phase.
2. **Next.js Optimization:** `next build` bundles the production application.
3. **Edge Middleware & Security Headers:** `next.config.ts` enforces `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `Strict-Transport-Security`.

---

## 7. Pre-Deployment Verification Checklist

- [x] Prisma datasource provider configured to `postgresql`.
- [x] Initial PostgreSQL migration generated (`20261009000000_init_postgresql`).
- [x] `migration_lock.toml` configured to `postgresql`.
- [x] `package.json` includes `db:migrate:deploy` and `prisma generate && next build`.
- [x] Production build passes cleanly (`npm run build`).
- [x] TypeScript: 0 errors (`npm run type-check`).
- [x] ESLint: 0 errors (`npm run lint`).
- [x] Vitest: 186/186 tests passing on PostgreSQL (`npm test`).
