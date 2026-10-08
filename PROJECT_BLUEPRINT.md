# PROJECT BLUEPRINT & MASTER ARCHITECTURE SPECIFICATION
## Custom AI Review & Digital Customer Card System for Single Medical Shop

---

### 1. PRODUCT OVERVIEW

This application is a **custom, production-ready web application built exclusively for a single independent medical shop (pharmacy)**. 

#### Core Business Objectives:
1. **Google Review Acceleration:** Facilitate genuine, high-quality Google reviews via QR code scans with an AI-assisted composition tool supporting English, Hindi, and Hinglish.
2. **Digital Customer Card:** Provide customers with quick, mobile-friendly access to the pharmacy's contact info, direct WhatsApp messaging, phone calling, Google Maps directions, operating hours, active offers, and review links.
3. **Owner Dashboard:** Provide the non-technical pharmacy owner with a clean, straightforward management portal to view review activity, analyze QR code scan performance, read internal customer feedback, manage current shop offers, and update store contact details.

#### Product Boundary & Anti-Scope:
- **STRICTLY NOT A SAAS PRODUCT.**
- No multi-tenancy or tenant switching.
- No subscription billing, payment gateways, or checkout.
- No inventory, stock, or pharmaceutical supply-chain management.
- No prescription uploads or clinical management.
- No doctor appointment booking or patient medical records.
- No NFT / blockchain / unnecessary enterprise bloatware.

---

### 2. ARCHITECTURE OVERVIEW

The application is structured as a **modular, lightweight, high-performance monolith** using Next.js (App Router) and TypeScript.

```
┌─────────────────────────────────────────────────────────────┐
│                       CLIENT TIER                           │
│  Mobile-First Responsive Web App (React 19 / Modern CSS)    │
│  - Customer QR Landing & Review Flow                        │
│  - Digital Customer Card                                    │
│  - Owner Admin Dashboard                                    │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / Server Actions & API Routes
┌──────────────────────────────▼──────────────────────────────┐
│                    SERVER APPLICATION TIER                  │
│                                                             │
│  ┌────────────────────────┐    ┌─────────────────────────┐  │
│  │   Auth & Security      │    │    AI Service Layer     │  │
│  │  - Session Management  │    │  (Provider Abstraction) │  │
│  │  - Rate Limiting (AI)  │    │  - Gemini / OpenAI      │  │
│  │  - CSRF / Input Guard  │    │  - Prompt Safety Guard  │  │
│  └────────────────────────┘    └─────────────────────────┘  │
│  ┌────────────────────────┐    ┌─────────────────────────┐  │
│  │   Business Logic &     │    │   Analytics & Events    │  │
│  │   Domain Services      │    │  - QR Scan Tracker      │  │
│  │  - Feedback Handling   │    │  - Review Click Tracker │  │
│  │  - Offers & Settings   │    │  - Privacy Protection   │  │
│  └────────────────────────┘    └─────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────┘
                               │ SQLite / Prisma / Drizzle
┌──────────────────────────────▼──────────────────────────────┐
│                      PERSISTENCE TIER                       │
│  Single-instance embedded database (SQLite) or managed DB   │
│  Zero cloud overhead, atomic backups, local file-based      │
└─────────────────────────────────────────────────────────────┘
```

#### Layer Decoupling:
- **UI Components:** Reusable, theme-driven components adhering strictly to the centralized design system (`src/components/`).
- **Business Logic:** Pure domain logic decoupled from UI and framework APIs (`src/lib/`).
- **API & Server Actions:** Type-safe endpoints with strict input validation using Zod (`src/app/api/`).
- **AI Service Abstraction (`AIServiceProvider`):** An interface separating prompt orchestration and response handling from specific model providers (Gemini, OpenAI, etc.).
- **Database Access:** Strongly typed data access layer with indexed queries.

---

### 3. MAIN USER FLOWS

#### Flow A: Customer Experience (High Priority, Mobile-First)

```
[Customer Scans Physical QR Code]
           │
           ▼
[Customer Landing Page] (Decides within 3 seconds)
     ├───► [Option 1: Give a Review]
     │          │
     │          ▼
     │     [Star Rating Selection (1-5 Stars)]
     │          │
     │          ├─── High Rating (4-5 Stars)
     │          │       │
     │          │       ▼
     │          │   [Customer Experience Highlights / Chips]
     │          │   (e.g., Quick Service, Medicines in Stock, Polite Staff)
     │          │       │
     │          │       ▼
     │          │   [Optional Short Note / Voice-to-Text Input]
     │          │       │
     │          │       ▼
     │          │   [Language Selection: English / Hindi / Hinglish]
     │          │       │
     │          │       ▼
     │          │   [AI Review Assistant Generates 3 Natural Drafts]
     │          │       │
     │          │       ▼
     │          │   [Customer Selects, Edits, or Regenerates Review]
     │          │       │
     │          │       ▼
     │          │   [Customer Copies & Clicks "Post on Google"]
     │          │       │
     │          │       ▼
     │          │   [Redirect to Google Business Review URL]
     │          │       │
     │          │       ▼
     │          │   [Thank You / Confirmation Screen]
     │          │
     │          └─── Low Rating / Direct Feedback (1-3 Stars)
     │                  │
     │                  ▼
     │              [Private Feedback Form for Owner]
     │              (What could we have done better?)
     │                  │
     │                  ▼
     │              [Thank You Screen + Owner Alert]
     │
     └───► [Option 2: Digital Customer Card]
                │
                ▼
           [Shop Details & Quick Contact]
                ├── Tap to Call (tel:...)
                ├── Tap to WhatsApp (wa.me/...)
                ├── Tap for Directions (Google Maps Link)
                ├── Operating Hours & Emergency Availability
                ├── Active Pharmacy Offers & Discounts
                └── Shortcut: Write a Google Review
```

#### Flow B: Owner Experience (Simple, Non-Technical)

```
[Admin Login URL (/admin/login)]
           │
           ▼
[Credential Authentication + Session Token]
           │
           ▼
[Owner Dashboard (/admin)]
     ├── Overview: Summary cards (Total Scans, Review Clicks, New Feedback)
     ├── Reviews & Feedback: Read private customer feedback, mark as resolved
     ├── QR Analytics: Scans over time, high-traffic days, review conversion clicks
     ├── Offers: Add/edit/expire pharmacy discount banners and seasonal deals
     └── Shop Settings: Update phone, WhatsApp number, hours, Google Review URL
```

---

### 4. DATABASE PLANNING

For a single medical shop, database complexity must be kept minimal, performant, and durable. SQLite (or PostgreSQL) via a modern ORM (Prisma/Drizzle) fits this perfectly.

#### Planned Schema Entities:

1. **`ShopSettings` (Single Row):**
   - `id`: Primary Key
   - `shopName`: Text
   - `tagline`: Text (nullable)
   - `phoneNumber`: Text
   - `whatsappNumber`: Text
   - `address`: Text
   - `googleMapsUrl`: Text
   - `googleReviewUrl`: Text
   - `openingHours`: JSON (Array of day/time objects)
   - `isEmergencyOpen`: Boolean
   - `updatedAt`: DateTime

2. **`Feedback` (Internal Customer Feedback):**
   - `id`: Primary Key (UUID/CUID)
   - `rating`: Integer (1-5)
   - `tags`: JSON (Array of selected tags)
   - `notes`: Text (nullable)
   - `customerContact`: Text (nullable, voluntary)
   - `status`: Enum (`NEW`, `REVIEWED`, `RESOLVED`)
   - `createdAt`: DateTime (Indexed)

3. **`Offer` (Store Offers & Promotions):**
   - `id`: Primary Key (UUID)
   - `title`: Text
   - `description`: Text
   - `badge`: Text (e.g., "10% OFF", "Senior Citizen")
   - `validUntil`: DateTime (nullable)
   - `isActive`: Boolean (default true)
   - `sortOrder`: Integer
   - `createdAt`: DateTime

4. **`AnalyticsEvent` (Privacy-Conscious QR & Interaction Tracking):**
   - `id`: Primary Key
   - `eventType`: Enum (`QR_SCAN`, `GOOGLE_REVIEW_CLICK`, `CALL_CLICK`, `WHATSAPP_CLICK`, `DIRECTIONS_CLICK`)
   - `source`: Text (e.g., 'counter_card', 'flyer', 'bill_receipt')
   - `createdAt`: DateTime (Indexed)

5. **`AdminUser` (Single Owner Account):**
   - `id`: Primary Key
   - `username`: Text (unique)
   - `passwordHash`: Text (Bcrypt/Argon2)
   - `lastLoginAt`: DateTime (nullable)

---

### 5. SECURITY PRINCIPLES

1. **Authentication & Session Management:**
   - Server-enforced authentication using HTTP-only, secure, `SameSite=Lax` cookies.
   - Passwords hashed with Bcrypt/Argon2.
   - Brute-force protection on login route (lockout / delay after 5 failed attempts).
2. **Server-Side Validation:**
   - Client inputs never trusted; validated with Zod on the server.
   - Input sanitization against XSS and injection attacks.
3. **Secrets Isolation:**
   - AI API keys (Gemini/OpenAI) and admin secrets are strictly server-side environment variables.
   - Absolutely zero secrets bundled into client code.
4. **AI Route Rate Limiting:**
   - Server-side rate limiter (e.g., max 5 AI generation calls per IP per minute) to eliminate API abuse or budget depletion.
5. **IDOR & Parameter Tampering:**
   - All mutation endpoints verify server session credentials before modifying settings or offers.

---

### 6. AI SAFETY & REVIEW GENERATION RULES

1. **Strict Non-Fabrication Rule:**
   - The AI assistant assists customers in expressing **their own real experience**.
   - The AI **NEVER** fabricates facts, staff behavior, discounts, unmentioned medicine availability, or doctor recommendations.
   - Input mapping is deterministic: Only user-chosen tags (e.g., "fast service", "friendly staff") and user-typed notes form the prompt context.
2. **No False Claims:**
   - Never generate superlative advertising claims ("best pharmacy in town", "lowest rates guaranteed").
   - Never make medical or pharmacological claims.
3. **Language Support:**
   - **English:** Clean, natural, polite customer reviews.
   - **Hindi:** Natural conversational Hindi (Devanagari script).
   - **Hinglish:** Natural Hindi written in English/Latin script (e.g., *"Yahan saari medicines time par mil jati hain aur staff ka nature bhi helpful hai"*).
4. **Customer Autonomy:**
   - Customer must review, select, edit, or regenerate drafts.
   - **Zero automatic submissions:** The application redirects to Google; the customer pastes and posts voluntarily on Google's native interface.
5. **Separation of Metrics:**
   - Track **"Google Review Clicks"**, NOT "Confirmed Reviews" (honesty in analytics).

---

### 7. DESIGN SYSTEM RULES

1. **Single Centralized Design System:**
   - A single CSS design system with CSS custom properties (`tokens.css`).
   - Reusable components (`Button`, `Card`, `Rating`, `Badge`, `Input`, `Modal`).
   - No ad-hoc colors, inline font overrides, or fragmented styling across individual pages.
2. **Visual Direction:**
   - **Tone:** Premium, Modern, Trustworthy, Pharmacy/Medical Clean.
   - **Palette:** Deep slate/navy foundation, clean crisp surfaces, calming clinical teal/emerald accents, warm gold for review stars.
   - **Typography:** High-legibility modern sans-serif typography (`Inter` or system fonts), high contrast ratios meeting WCAG 2.1 AA.
   - **Motion:** Subtle, purposeful micro-transitions (150ms-250ms ease-out). No flashy, distracting animations.
   - **Mobile-First Layout:** Touch targets $\ge 48\text{px}$, ergonomic one-hand reach on mobile screens.

---

### 8. CUSTOMER DATA & PRIVACY PRINCIPLES

1. **Zero Medical Data Collection:**
   - Do NOT collect prescription images, patient names, medical conditions, medication regimens, diagnoses, or insurance info.
2. **Minimal Voluntary Info:**
   - If a customer submits internal feedback, contact information (phone/email) is 100% optional.
3. **Privacy-Preserving Analytics:**
   - Track aggregate QR scan counts and interaction button clicks.
   - Do NOT track MAC addresses, invasive device fingerprinting, or GPS coordinates.

---

### 9. ENVIRONMENT REQUIREMENTS

| Variable Name | Required | Purpose |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_APP_URL` | Yes | Canonical domain for generating QR codes (never `localhost` in prod) |
| `ADMIN_USERNAME` | Yes | Login handle for the pharmacy owner |
| `ADMIN_PASSWORD_HASH` | Yes | Bcrypt hash of owner dashboard password |
| `ADMIN_SESSION_SECRET` | Yes | HMAC / cryptographic secret for admin session tokens |
| `DATABASE_URL` | Yes | Database connection string (SQLite file path or Postgres URL) |
| `AI_PROVIDER` | Yes | Active provider: `gemini`, `openai`, or `mock` |
| `AI_API_KEY` | Optional in dev | API key for Gemini / OpenAI |
| `AI_RATE_LIMIT_PER_MINUTE` | Yes | Throttling limit per client IP for AI review generation |

---

### 10. DEVELOPMENT ROADMAP (PHASES 0 TO 12)

- **PHASE 0:** Project Blueprint, Architecture & Rules *(Current Phase - Complete)*
- **PHASE 1:** Project Foundation & Centralized Design System
- **PHASE 2:** Database & Core Architecture Layer
- **PHASE 3:** Admin Authentication & Security
- **PHASE 4:** Customer QR & Landing Experience
- **PHASE 5:** Rating & Customer Feedback Engine
- **PHASE 6:** AI Review Assistant (English, Hindi, Hinglish)
- **PHASE 7:** Google Review Redirection & Tracking
- **PHASE 8:** Digital Customer Card
- **PHASE 9:** Owner Dashboard & Analytics
- **PHASE 10:** Offers & Pharmacy Information Management
- **PHASE 11:** Final UX Polish, Accessibility, Security & Quality Hardening
- **PHASE 12:** Production Deployment, Printable Production QR & Client Handover

---

### 11. OUT-OF-SCOPE FEATURES (EXCLUDED)

The following items are strictly outside the initial project scope:
- Customer loyalty points, cashback, or reward wallet.
- Automated WhatsApp bot or SMS marketing pipelines.
- Multi-branch pharmacy support.
- Prescription OCR, medication dispensing, or pill reminders.
- SaaS multi-tenant billing or subscription plans.
- Native iOS / Android application wrappers.
