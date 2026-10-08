# Offers & Pharmacy Information Management Architecture

This document describes the design, implementation, data models, security, and customer card integration for **Phase 10 — Offers & Pharmacy Information Management** in the single independent pharmacy web application.

---

## 1. Overview & Objectives

Phase 10 enables the pharmacy owner to manage their promotional deals and storefront information directly from the authenticated admin portal:

1. **Offers Management (`/admin/offers`)**:
   - Create, edit, toggle active/inactive status, set expiry dates, customize display ordering, and delete promotional deals.
   - Maintain historical visibility of expired or deactivated offers for the owner, while ensuring that the public Digital Customer Card only displays currently active, non-expired offers.
2. **Pharmacy Information Management (`/admin/settings`)**:
   - Maintain the singleton `ShopSettings` record representing the physical store's identity, contact channels, address, Google Maps location, Google Review page link, operating schedule, and emergency availability.
   - Updates immediately synchronize with the customer-facing Digital Customer Card (`/customer/card`) and landing page (`/`).

---

## 2. Admin Authentication & Route Protection

All management routes and data mutations are strictly protected by the Phase 3 server-side authentication system.

| Route | Purpose | Access Control |
|---|---|---|
| `/admin/offers` | Offers Management (List, Add, Edit, Toggle, Delete) | `requireAdmin('/admin/offers')` |
| `/admin/settings` | Pharmacy Information & Opening Hours Editor | `requireAdmin('/admin/settings')` |
| `createOfferAction` | Server Action to create promotional offer | `requireAdmin('/admin/offers')` |
| `updateOfferAction` | Server Action to update promotional offer | `requireAdmin('/admin/offers')` |
| `toggleOfferActiveAction` | Server Action to activate/deactivate offer | `requireAdmin('/admin/offers')` |
| `deleteOfferAction` | Server Action to permanently delete offer | `requireAdmin('/admin/offers')` |
| `updateShopSettingsAction` | Server Action to save pharmacy settings | `requireAdmin('/admin/settings')` |

Unauthenticated requests are redirected with HTTP 307 to `/admin/login?returnUrl=<sanitized_path>`.

---

## 3. Offers Management Architecture

### Data Model (`Offer`)
```prisma
model Offer {
  id          String    @id @default(cuid())
  title       String
  description String?
  badge       String?   // e.g. "10% OFF", "SENIOR CITIZEN", "SPECIAL"
  validUntil  DateTime? // Nullable expiration date
  isActive    Boolean   @default(true)
  sortOrder   Int       @default(0)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([isActive, sortOrder])
  @@index([validUntil])
}
```

### Offer Visibility Rules
An offer's visibility on the customer-facing Digital Customer Card (`/customer/card`) follows a strict dual-condition rule:
$$\text{Customer Visible} \iff \text{isActive} = \text{true} \;\land\; (\text{validUntil is null} \;\lor\; \text{validUntil} \ge \text{current time})$$

- **Active & Valid**: Displayed on `/customer/card`.
- **Expired Offers**: Automatically hidden from `/customer/card`. Never automatically deleted from the database—they remain visible in `/admin/offers` marked with an `Expired` badge for owner records.
- **Inactive Offers**: Temporarily hidden from `/customer/card` without deleting.
- **Display Ordering**: Sorted by `sortOrder ASC`, then `createdAt DESC`. Lower numbers have higher priority (e.g. `0` appears before `1`).

### Plain Text & Content Security
- Offer fields (`title`, `description`, `badge`) are strictly plain text.
- HTML tags, scripts, and Markdown are never parsed or rendered with `dangerouslySetInnerHTML`.
- All text inputs are trimmed and validated with Zod before database persistence.

---

## 4. Pharmacy Information Management Architecture

### Singleton Data Model (`ShopSettings`)
```prisma
model ShopSettings {
  id              String   @id @default("default_shop")
  shopName        String
  tagline         String?
  phoneNumber     String?
  whatsappNumber  String?
  address         String?
  googleMapsUrl   String?
  googleReviewUrl String?
  openingHours    String   @default("[]") // JSON: [{"days":"...","hours":"..."}]
  isEmergencyOpen Boolean  @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### Editable Fields & Validation Rules
- **Pharmacy Name (`shopName`)**: Required string (2–100 characters). Displayed across all customer and admin pages.
- **Tagline (`tagline`)**: Optional string (max 150 characters). If cleared, customer card hides the tagline banner.
- **Phone Number (`phoneNumber`)**: Optional string (max 20 characters). Powers the customer one-click `tel:` action link formatted via `formatTelHref()`.
- **WhatsApp Number (`whatsappNumber`)**: Optional string (max 20 characters). Powers the customer one-click `https://wa.me/...` action link formatted via `formatWhatsAppHref()`.
- **Address (`address`)**: Optional string (max 250 characters). Displayed on the digital storefront card.
- **Google Maps URL (`googleMapsUrl`)**: Optional safe URL (`http://` or `https://`). Powers the "Directions" navigation button.
- **Google Review URL (`googleReviewUrl`)**: Optional safe URL (`http://` or `https://`). Sets the destination URL for the review handoff after customer drafts a review with the AI assistant.
- **Opening Hours (`openingHours`)**: Structured JSON array of `{ days: string, hours: string }`.
  - Supports multiple custom schedule rows (e.g. "Monday - Saturday", "8:00 AM - 11:00 PM").
  - Supports explicit closed days (e.g. "Sunday", "Closed") without forcing fake times.
- **Emergency Availability (`isEmergencyOpen`)**: Boolean toggle. When enabled, displays an emergency counter availability badge on the digital customer card. Clearly restrained: does not claim 24/7 hospital emergency services.

### Safe URL Validation
Both `googleMapsUrl` and `googleReviewUrl` are validated using `isValidExternalUrl()`:
- Only `http:` and `https:` protocols are accepted.
- Unsafe protocols (`javascript:`, `data:`, `file:`, `vbscript:`) are rejected.

---

## 5. Customer Card Integration & Cache Revalidation

When the pharmacy owner saves changes in `/admin/settings` or `/admin/offers`, Next.js on-demand cache revalidation (`revalidatePath`) updates the affected routes:
- `/` (Pharmacy Landing Page)
- `/customer/card` (Digital Customer Card)
- `/customer/review` (Customer Review Experience)
- `/admin` (Owner Overview Dashboard)
- `/admin/offers` (Offers Management List)
- `/admin/settings` (Settings Management Form)

Customers visiting `/customer/card` immediately receive the updated pharmacy name, contact numbers, hours, emergency badge, and active promotional deals.

---

## 6. Automated Testing & Verification

The Phase 10 implementation is tested in `tests/offers-and-settings.test.ts` across 25 automated tests:

1. **Offers Repository & CRUD**:
   - Creates valid offer with all supported fields.
   - Retrieves offer by ID.
   - Updates target offer fields without overwriting unmodified fields.
   - Toggles `isActive` state accurately.
   - Handles nonexistent offer updates safely by returning null.
   - Deletes offer permanently.
   - Handles nonexistent offer deletion safely by returning false.
2. **Offers Validation & Schema Rules**:
   - Enforces required title length (2–100 characters).
   - Preprocesses empty strings to null for description and badge.
   - Handles `YYYY-MM-DD` date parsing to end-of-day UTC.
   - Coerces `sortOrder` and defaults to 0.
3. **Offer Visibility Rules**:
   - `listAllOffers()` includes active, inactive, and expired offers for owner admin view.
   - `listActiveOffers()` strictly filters out expired and inactive offers from customer card view.
   - Sorts active offers by `sortOrder ASC`, then `createdAt DESC`.
4. **Offers Server Actions & Auth**:
   - Rejects unauthenticated offer creation attempts with redirect to `/admin/login`.
   - Allows authenticated admin to perform complete offer lifecycle via Server Actions.
5. **Shop Settings Management**:
   - Retrieves singleton shop settings record.
   - Updates contact and location details.
   - Allows clearing optional fields to null.
6. **Settings Validation & URL Security**:
   - Enforces required shop name.
   - Accepts safe HTTP and HTTPS URLs for Maps and Google Review links.
   - Rejects unsafe protocols (`javascript:`, `data:`, `file:`).
   - Validates structured opening hour slots.
7. **Settings Server Actions & Auth**:
   - Rejects unauthenticated settings updates with redirect to `/admin/login`.
   - Allows authenticated admin to save settings via Server Action.
