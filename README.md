# Pharmacy AI Review & Digital Customer Card System

A bespoke, production-ready web application designed specifically for a **single independent medical shop (retail pharmacy)**. Built to facilitate genuine, high-quality Google reviews via physical QR codes and provide visiting patients with a digital storefront card.

---

## 🌟 Key Capabilities

### 1. Customer QR Landing Experience (`/` & `/?source=...`)
- **Frictionless Mobile-First Entry:** Loads instantly when scanned from store standees or counter cards with zero app installation required.
- **Placement Source Attribution:** Preserves QR source tags (`?source=counter`, `?source=table`, `?source=card`, `?source=qr`) for physical in-store analytics.
- **Graceful Unconfigured State:** Renders an elegant placeholder state if store details haven't been configured yet, preventing broken UI or fake numbers.

### 2. Automatic AI Review Assistant (`/customer/review`)
- **Instant Generation:** Triggers automatically upon selecting a star rating (1–5 ★) without manual "Generate" buttons.
- **3 Distinct Natural Drafts:** Provides *Recommended*, *Short*, and *Detailed* options matching customer sentiment and selected visit highlights.
- **Multilingual Support:** Conversational drafts in **English**, **Hindi (Devanagari script)**, and **Hinglish (Latin alphabet)**.
- **Strict Anti-Fabrication Rules:** System prompts and server-side validators strictly forbid inventing medicines, dosages, prices, doctor names, or medical outcomes.
- **Google Review Handoff:** Copies text to the customer's clipboard with one tap, tracks click conversion, and opens the pharmacy's Google Review URL (with safe copy-only fallback if unconfigured).

### 3. Digital Customer Card (`/customer/card`)
- **One-Tap Actions:** Fast buttons for **Call Pharmacy**, **WhatsApp Chat**, and **Google Maps Directions**.
- **Store Hours & Schedule:** Displays current operating hours and open/closed status.
- **Off-Hours Medicine Notice:** Subtle emergency badge for urgent prescription needs outside standard hours.
- **Active Store Offers:** Displays active promotional discounts and senior citizen perks with automatic expiry filtering.

### 4. Physical Store QR Code Studio (`/admin/settings` & Admin Header)
- **Built-in Generator:** Generate, preview, and download print-ready QR codes for all 4 store placements directly inside the Admin Console.
- **Multi-Format Export:**
  - High-resolution **1024 × 1024 px PNG** (with 30% error correction).
  - Scalable vector **SVG** for graphic designers and commercial print shops.
- **1-Click Printable Standee:** Generates an A6 / 4×6 inch counter tent card layout ready to print for physical billing counters.
- **Brand Theme Toggle:** Choice between **Pharmacy Forest Green** (`#123e35`) and **Classic Black** (`#000000`).

### 5. Owner Management Console (`/admin`)
- **Secure Authentication:** Single owner account protected with salted Bcrypt hashing, constant-time dummy verifications, and brute-force lockout rate limiting.
- **Session Security:** 256-bit cryptographically secure session tokens; only SHA-256 hashes are stored in the database.
- **Conversion Funnel Analytics:** Tracks the journey from physical QR scans to Google Review button clicks without tracking invasive personal data or device fingerprints.
- **Private Feedback Manager (`/admin/reviews`):** Private customer ratings, notes, and resolution workflow (`NEW` → `REVIEWED` → `RESOLVED`).
- **Promotional Offers Manager (`/admin/offers`):** Create and schedule seasonal pharmacy offers and discounts.
- **Pharmacy Settings (`/admin/settings`):** Manage pharmacy identity, phone numbers, Google Maps/Review links, schedule, and logo uploads (with PNG/JPEG/WebP magic-byte validation).

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | [Next.js 16.4](https://nextjs.org/) (App Router, Turbopack, React 19) |
| **Language** | TypeScript (Strict mode, 0 errors) |
| **Database** | [PostgreSQL](https://www.postgresql.org/) (Hosted on [Neon](https://neon.tech/)) |
| **ORM** | [Prisma 6.19.3](https://www.prisma.io/) |
| **Styling** | Vanilla CSS Modules with Centralized Design Tokens (No Tailwind) |
| **Testing** | [Vitest 5.0](https://vitest.dev/) (186 automated unit & integration tests) |
| **Icons** | [Lucide React](https://lucide.dev/) |

---

## 🎨 Visual Identity & Design System

The application features a bespoke **luxury apothecary / private healthcare clinic** aesthetic:
- **Palette:** Deep Forest Green (`#123e35`), Muted Sage (`#4a6b61`), Warm Ivory (`#faf8f5`), Warm White (`#ffffff`), and Restrained Burgundy (`#8f2323`).
- **Typography:** Editorial serif headings paired with clean modern sans-serif controls (including native Devanagari font fallbacks).
- **Admin Console:** Architectural dark sidebar (`#0c2621`) with responsive mobile slide-over drawer.

---

## 🚀 Getting Started Locally

### 1. Prerequisites
- Node.js 18+ or 20+
- PostgreSQL (Local instance or free cloud database on [Neon](https://neon.tech/))

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/sirjadejaa/ai-review-system.git
cd ai-review-system

# Install dependencies
npm install
```

### 3. Environment Setup
Copy the example environment file:
```bash
cp .env.example .env
```
Update `.env` with your PostgreSQL database URL and development credentials:
```env
NEXT_PUBLIC_APP_URL="http://localhost:3000"
DATABASE_URL="postgresql://username:password@localhost:5432/ai_review_system"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD_HASH="$2a$10$developmentdummyhashforlocaltestingonly123456"
ADMIN_SESSION_SECRET="development-session-secret-key-minimum-32-characters"
AI_PROVIDER="mock"
```

### 4. Database Setup & Seeding
```bash
# Apply PostgreSQL migrations
npm run db:migrate:deploy

# Initialize development database
npm run db:seed
```

### 5. Run the Application
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the customer experience, or [http://localhost:3000/admin](http://localhost:3000/admin) to log into the management console.

---

## 🧪 Verification Commands

The repository enforces strict quality standards:

```bash
npm run type-check   # TypeScript type verification (0 errors)
npm run lint         # ESLint check (0 errors, 0 warnings)
npm test             # Vitest test suite (186/186 tests passing)
npm run build        # Production Next.js build with Turbopack
```

---

## ☁️ Deployment Guide

For detailed instructions on deploying the application to **Vercel** with a free serverless PostgreSQL database on **Neon**, refer to:

👉 **[`POSTGRES_NEON_DEPLOYMENT.md`](./POSTGRES_NEON_DEPLOYMENT.md)**

---

## 🔒 Security Architecture
- **No Client Secrets:** All API keys, database credentials, and session tokens remain strictly server-side.
- **Security Headers:** Enforced via `next.config.ts`:
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
  - `Referrer-Policy: strict-origin-when-cross-origin`
- **Sanitization:** Strict URL verification (http/https only) and regex guards against prompt injection and HTML injection.
