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
| `NEXT_PUBLIC_APP_URL` | Production | Canonical public URL (e.g. `https://your-pharmacy.vercel.app` or custom domain) |
| `ADMIN_USERNAME` | Production | Owner username (e.g. `admin`) |
| `ADMIN_PASSWORD_HASH` | Production | Bcrypt hash of owner password (generate via `npx bcryptjs <password>`) |
| `ADMIN_SESSION_SECRET` | Production | High-entropy random secret (32+ chars) |
| `AI_PROVIDER` | Production | Primary: `ollama` (Ollama Cloud) or fallback: `gemini` / `openai` / `mock` |
| `OLLAMA_API_KEY` | Production | Ollama Cloud API Key (server-side only) |
| `OLLAMA_BASE_URL` | Production | Default: `https://ollama.com/v1` |
| `OLLAMA_MODEL` | Production | Model identifier (e.g. `gemma4:31b` or verified equivalent) |
| `AI_API_KEY` | Production | Gemini API key (when using `AI_PROVIDER=gemini`) |
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
- `prisma migrate deploy` applies the baseline migration (`prisma/migrations/20261009000000_init_postgresql`) and custom branding migration (`prisma/migrations/20261013000000_add_custom_branding_fields`) deterministically using the `_prisma_migrations` tracking table without resetting or losing existing pharmacy records.

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

## 6. Custom Domain & DNS Launch Checklist

When delivering to an individual pharmacy client with their own domain (e.g., `pharmacy.example.com` or `arogyapharmacy.in`):

1. **Vercel Domains Configuration:**
   - In Vercel Project Settings > **Domains**, enter the pharmacy's domain.
2. **DNS Record Setup (at Pharmacy's DNS registrar/Cloudflare):**
   - **Apex domain (`example.com`):**  
     - Type: `A`  
     - Name: `@`  
     - Value: `76.76.21.21`
   - **Subdomain (`www.example.com` or `reviews.example.com`):**  
     - Type: `CNAME`  
     - Name: `www` or `reviews`  
     - Value: `cname.vercel-dns.com`
3. **Automatic SSL / HTTPS:**
   - Vercel automatically issues and renews Let's Encrypt SSL certificates once DNS propagates.
4. **Environment Variable Update:**
   - Update `NEXT_PUBLIC_APP_URL` in Vercel to the custom domain (e.g. `https://arogyapharmacy.in`). This ensures printed counter standees and QR codes encode the custom domain URL.
5. **Rollback Procedure:**
   - If an issue arises in production, navigate to Vercel > **Deployments**, locate the last stable deployment, and click **Promote to Production** for instant zero-downtime rollback.

---

## 7. Post-Deployment Smoke Tests

After deploying or updating configuration:
1. **Customer Review Journey:**
   - Open `/` and `/customer/review`.
   - Verify pharmacy name, logo, and brand colors match the configured settings.
   - Select 5 stars, select service tags, and generate review drafts.
   - Verify 3 natural suggestions appear with copy buttons.
   - Verify direct Google Review link redirects to the configured Google page.
2. **Digital Card Journey:**
   - Open `/customer/card`.
   - Verify phone click, WhatsApp click, Directions click, and Website click open proper apps/links.
   - Verify emergency notice appears with helpline when enabled.
3. **Admin Settings Journey:**
   - Log into `/admin/login`.
   - Open `/admin/settings`.
   - Change a color preset or enter custom hex colors, update contact details, and click "Save Changes".
   - Refresh the page and confirm settings persist.

---

## 8. Verification & Quality Checklist

- [x] Prisma datasource provider configured to `postgresql`.
- [x] Initial PostgreSQL migration generated (`20261009000000_init_postgresql`).
- [x] Custom branding migration generated (`20261013000000_add_custom_branding_fields`).
- [x] `migration_lock.toml` configured to `postgresql`.
- [x] `package.json` includes `db:migrate:deploy` and `prisma generate && next build`.
- [x] Production build passes cleanly with Turbopack (`npm run build`).
- [x] TypeScript: 0 errors (`npm run type-check`).
- [x] ESLint: 0 errors (`npm run lint`).
- [x] Vitest: 241/241 tests passing across 15 suites (`npm test`).
