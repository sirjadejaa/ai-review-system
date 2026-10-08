# DATABASE & CORE ARCHITECTURE DOCUMENTATION
## Single Medical Shop / Pharmacy AI Review & Digital Customer Card System

---

### 1. DATABASE TECHNOLOGY & RATIONALE

- **ORM:** Prisma v6.19.3
- **Local Engine:** SQLite (`file:../data/pharmacy.db`)
- **Production Compatibility:** Full standard relational compatibility (PostgreSQL / Managed SQL) via standard Prisma migration without application code refactoring.
- **Why Prisma + SQLite for Single Shop:**
  - Zero cloud infrastructure costs and zero operational friction for a single independent medical shop.
  - Server-only singleton connection prevents memory leaks and connection spikes in Next.js development and production.
  - Full TypeScript type-safety generated directly from schema.
  - Atomic file-based backups.

---

### 2. LOCAL SETUP & ENVIRONMENT CONFIGURATION

The database connection is configured via `DATABASE_URL` in `.env`:

```env
# Local SQLite Database Path (resolved relative to prisma/ directory)
DATABASE_URL="file:../data/pharmacy.db"
```

#### Key NPM Scripts:
```bash
npm run db:generate   # Regenerates Prisma Client
npm run db:migrate    # Runs pending migrations against the database
npm run db:seed       # Executes safe, idempotent development seed
npm run db:push       # Pushes schema prototyping changes without migrations
```

---

### 3. SCHEMA OVERVIEW & MODELS

The database is strictly single-tenant. There are **zero tenant tables, zero multi-shop columns, and zero subscription billing records**.

```
┌─────────────────────────────────┐
│          ShopSettings           │ (Singleton Record: id = "default_shop")
├─────────────────────────────────┤
│ id (PK): "default_shop"         │
│ shopName: String                │
│ tagline: String?                │
│ phoneNumber: String?            │
│ whatsappNumber: String?         │
│ address: String?                │
│ googleMapsUrl: String?          │
│ googleReviewUrl: String?        │
│ openingHours: String (JSON)     │
│ isEmergencyOpen: Boolean        │
│ createdAt / updatedAt: DateTime │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│            Feedback             │ (Customer Feedback - 1-5 Stars)
├─────────────────────────────────┤
│ id (PK): CUID                   │
│ rating: Int (1-5 range)         │
│ tags: String (JSON array)       │
│ notes: String?                  │
│ customerContact: String?        │
│ status: "NEW"|"REVIEWED"|...    │
│ createdAt (Indexed)             │
│ updatedAt: DateTime             │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│              Offer              │ (Promotional Banners)
├─────────────────────────────────┤
│ id (PK): CUID                   │
│ title: String                   │
│ description: String?            │
│ badge: String?                  │
│ validUntil: DateTime? (Indexed) │
│ isActive: Boolean (Indexed)     │
│ sortOrder: Int (Indexed)        │
│ createdAt / updatedAt: DateTime │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│         AnalyticsEvent          │ (Privacy-Preserving QR & Clicks)
├─────────────────────────────────┤
│ id (PK): CUID                   │
│ eventType: Event Enum (Indexed) │
│ source: String?                 │
│ createdAt (Indexed)             │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│            AdminUser            │ (Owner Account Foundation)
├─────────────────────────────────┤
│ id (PK): CUID                   │
│ username: String (Unique)       │
│ passwordHash: String            │
│ lastLoginAt: DateTime?          │
│ createdAt / updatedAt: DateTime │
└─────────────────────────────────┘
```

---

### 4. PRIVACY & SECURITY BOUNDARIES

1. **Zero Medical Data:**
   - The schema intentionally has **no fields** for prescription images, doctor recommendations, disease diagnoses, clinical files, patient history, or insurance information.
2. **Honest Review Click Metrics:**
   - Tracks `GOOGLE_REVIEW_CLICK`. Never claims `googleReviewConfirmed`.
3. **No Invasive Tracking:**
   - Analytics events track only event type and optional attribution (`QR`, `DIRECT`, `COUNTER`). Zero GPS coordinates, zero MAC addresses, zero device fingerprints.
4. **Password Security:**
   - `AdminUser.passwordHash` stores bcrypt hashes only. Plaintext passwords are never accepted or stored.
5. **Server-Only Isolation:**
   - `src/lib/db/client.ts` and all repositories in `src/lib/repositories/` run strictly on the server. They are never imported into client components (`'use client'`).

---

### 5. REPOSITORY LAYER ARCHITECTURE

Components and routes access data through typed repository functions rather than calling Prisma directly:

- **`shopSettingsRepository` (`src/lib/repositories/shop-settings-repository.ts`):**
  - `getShopSettings()`: Retrieves or self-heals the singleton pharmacy settings.
  - `updateShopSettings(input)`: Validates and updates store info.
- **`feedbackRepository` (`src/lib/repositories/feedback-repository.ts`):**
  - `createFeedback(input)`: Enforces 1–5 star rating constraint via Zod.
  - `listFeedback(options)`: Chronological retrieval for admin review inbox.
  - `updateFeedbackStatus(id, status)`: Transitions status (`NEW` $\rightarrow$ `REVIEWED` $\rightarrow$ `RESOLVED`).
  - `getFeedbackSummary()`: Computes total count and average rating.
- **`offerRepository` (`src/lib/repositories/offer-repository.ts`):**
  - `createOffer(input)`, `getOfferById(id)`, `updateOffer(id, input)`, `deleteOffer(id)`.
  - `listActiveOffers()`: Filters by active state and future/null expiration, sorted by `sortOrder`.
- **`analyticsRepository` (`src/lib/repositories/analytics-repository.ts`):**
  - `trackAnalyticsEvent(input)`: Records QR scans and call/review clicks.
  - `getAnalyticsSummary()`: Aggregates counts by event type.
- **`adminUserRepository` (`src/lib/repositories/admin-user-repository.ts`):**
  - `getAdminUserByUsername(username)`: Retrieves user with password hash for Phase 3 authentication.
  - `createAdminUser(input)`: Creates user with username uniqueness check.

---

### 6. SEED STRATEGY & SAFETY

- **File:** `prisma/seed.ts`
- **Safety Guarantee:**
  - Idempotent: Checks existence before inserting. Does not overwrite modified settings.
  - Safe: Never drops tables or deletes existing records.
  - Development values clearly labeled (e.g., `Sanjivani Medical & Pharmacy (Dev Demo)`).
