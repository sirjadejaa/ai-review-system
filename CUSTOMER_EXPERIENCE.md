# Customer QR & Landing Experience

This document describes the customer-facing QR entry flow, landing experience, rating & feedback engine, and AI Review Assistant architecture for the single-pharmacy web application.

---

## 1. Overview & Customer Flow

The customer experience is mobile-first, lightweight, and QR-driven. Customers typically scan a printed QR standee or card at the billing counter or pharmacy desk.

```text
CUSTOMER SCANS QR CODE (/?source=qr)
               ↓
     PUBLIC LANDING PAGE (/)
               ↓
┌───────────────────────────────────────────────┐
│              Pharmacy Identity                │
│    Shop Name • Tagline • Emergency Status     │
│                                               │
│        "How can we help you today?"           │
│                                               │
│  ⭐ Give a Google Review                      │
│     (30-sec flow -> /customer/review)         │
│                                               │
│  💳 Digital Customer Card                     │
│     (Contacts, hours, offers -> /customer/card)
│                                               │
│  📞 Call  |  💬 WhatsApp  |  📍 Directions    │
│                                               │
│  🕒 Pharmacy Operating Hours                  │
│  📍 Store Physical Address                    │
└───────────────────────────────────────────────┘
```

---

## 2. Public Customer Routes

| Route | Purpose | State | Access Boundary |
|---|---|---|---|
| `/` | Customer Landing & QR Entry | **Functional** (DB-backed, tracked) | Public (no auth) |
| `/customer/review` | Rating, Feedback Engine & AI Assistant | **Functional** (Stars, Tags, AI Drafts) | Public (no auth) |
| `/customer/card` | Digital Pharmacy Card Entry Point | **Functional** (Contacts, Hours, Offers, Review) | Public (no auth) |

*Admin authentication is strictly isolated under `/admin/*` and never intercepts customer routes.*

---

## 3. QR Source Convention & Validation

QR codes are provisioned with standardized source query parameters:
- `/?source=qr` (Primary QR code standee)
- `/?source=counter` (Billing counter QR)
- `/?source=table` (Display table QR)
- `/?source=card` (Printed pocket card QR)

### Controlled Input Validation
Incoming sources are strictly validated via `CustomerLandingQuerySchema`:
```typescript
export const VALID_QR_SOURCES = ['qr', 'counter', 'table', 'card'] as const;
```
- Arbitrary query values (e.g., `?source=hack123` or script tags) are rejected and ignored.
- Direct visits without a source query parameter load the landing page without recording a `QR_SCAN`.

---

## 4. Analytics & Duplicate Prevention

### Supported Customer Events
| Event Type | Trigger | Source |
|---|---|---|
| `QR_SCAN` | Landing page entry via valid QR code | `qr` / `counter` / `table` / `card` |
| `CALL_CLICK` | Customer clicks "Call Shop" button | `customer_landing` |
| `WHATSAPP_CLICK` | Customer clicks "WhatsApp" button | `customer_landing` |
| `DIRECTIONS_CLICK` | Customer clicks "Directions" button | `customer_landing` |

### Duplicate Prevention Architecture
To ensure page refreshes, browser reloads, or React re-renders do not generate inflated scan counts:
1. **Client Guard**: `sessionStorage.getItem('pharmacy_qr_scan_' + source)` prevents repeat invocations within the same browser tab session.
2. **Server Guard**: An HTTP-only session cookie (`qr_scanned_session`) is set upon the first tracked scan, preventing duplicate database writes if called again within 1 hour.
3. **Non-Blocking Resilience**: All analytics calls use fire-and-forget server actions wrapped in `try/catch`. Analytics issues **never** block or delay customer navigation.

---

## 5. ShopSettings Integration & Resilience

All customer-facing information is dynamically retrieved from the database via `getShopSettings()`:
- **Shop Name**: Displayed in branding header, welcome badge, and page titles.
- **Tagline**: Rendered as a supportive subtitle if present; cleanly hidden if omitted.
- **Emergency Status**: If `isEmergencyOpen === true`, displays a status indicator in the header and an emergency support notification banner.
- **Operating Hours**: The JSON `openingHours` array is converted into human-readable daily schedules.
- **Address**: Displayed in a physical location card if configured.

### Missing Field Resilience
- If `phoneNumber` is null: Call button is omitted without placeholder artifacts.
- If `whatsappNumber` is null: WhatsApp button is omitted.
- If `googleMapsUrl` is null: Directions button is omitted.
- If `openingHours` is empty: Hours section is omitted cleanly.

---

## 6. Privacy & Security Rules

1. **Zero Customer PII**: The system does **not** collect IP addresses, GPS coordinates, device fingerprints, MAC addresses, customer phone numbers, or customer identities.
2. **Safe Link Generation**:
   - `tel:` links are sanitized to standard RFC 3966 numeric strings.
   - WhatsApp URLs are formatted to `https://wa.me/91<digits>` with Indian country code normalization.
   - Google Maps URLs are validated against `http:` / `https:` protocols to prevent script injection.
3. **No Administrative Exposure**: Customer layouts contain zero admin portal links, developer details, or internal debug routes.

---

## 7. Rating & Customer Feedback Engine (`/customer/review`)

### Customer Feedback Flow
```text
Customer Landing -> Give a Review -> /customer/review
  ↓
1–5 Star Rating (Mandatory, unselected by default)
  ↓
Experience Tags (Optional multi-select whitelist)
  ↓
Customer Note (Optional plain text, max 1000 chars)
  ↓
Customer Contact (Optional phone, max 100 chars)
  ↓
Submit Feedback -> Thank-You State
```

### Key Specifications
- **Accepted Rating Range**: Strictly 1 to 5 integer stars. Unselected (`null`) on initial load; submit button remains disabled until chosen.
- **Zero Review Gating**: All ratings (1 to 5) are treated respectfully without hiding feedback options or creating deceptive hurdles.
- **Predefined Tags Whitelist**:
  - `Quick Service`
  - `Medicines in Stock`
  - `Polite Staff`
  - `Helpful Service`
  - `Clean Store`
  - `Good Prices`
  *(Arbitrary or user-submitted tag strings are rejected by the server schema).*
- **Customer Note**: Max 1000 characters plain text. Explicit medical privacy callout reminds customers not to share prescription or health history.
- **Customer Contact**: Optional phone string (max 100 characters) for voluntary owner follow-up.
- **Status Lifecycle**: Initialized strictly to `'NEW'`. Customer cannot submit or modify status.
- **Abuse Prevention**: In-memory rate limiting throttles requests exceeding 5 submissions per 10 minutes per request context without persisting IP addresses.

---

## 8. AI Review Assistant Architecture (`/customer/review`)

The AI Review Assistant helps customers turn their genuine rating, tags, and notes into natural, polished review drafts ready to copy.

### Provider Abstraction
```text
Customer UI (AIReviewAssistant)
         ↓
Server Action (generateReviewDraftsAction)
         ↓
AI Provider Interface (AIServiceProvider)
         ↓
┌───────────────────────┬───────────────────────┬───────────────────────┐
│ GeminiProvider (REST) │ OpenAIProvider (REST) │ MockAIProvider (Test) │
└───────────────────────┴───────────────────────┴───────────────────────┘
```
- **Configured via Server Environment**: `AI_PROVIDER` (`'gemini'` | `'openai'` | `'mock'`), `AI_API_KEY`.
- **Lightweight Implementation**: Uses native `fetch` with structured JSON output modes without heavy vendor SDK dependencies.
- **Deterministic Mock Fallback**: `MockAIProvider` activates in test and development modes when live API keys are omitted.

### Supported Languages
1. **English (`en`)**: Natural, first-person conversational English.
2. **Hindi (`hi`)**: Natural Hindi strictly in Devanagari script (e.g., *यहाँ सेवा बहुत तेज़ थी और सभी दवाइयाँ आसानी से मिल गईं।*).
3. **Hinglish (`hinglish`)**: Colloquial Hindi-English strictly in Latin/English alphabet (e.g., *Experience kaafi achha tha, service quick thi aur staff polite tha.*).

### Non-Fabrication Rules & Prompt Injection Defense
- **Zero Hallucination Policy**: The AI is forbidden from inventing medicines, prices, percentage discounts, doctor/staff names, waiting times, or clinical treatment outcomes.
- **Untrusted User Notes**: Notes are enclosed inside `<customer_note>` tags and treated strictly as data to summarize, never as instructions.
- **Rating-Aware Tone**:
  - 5 Stars: Highly positive, appreciative.
  - 4 Stars: Positive, satisfied, measured.
  - 3 Stars: Neutral, realistic, mixed.
  - 1–2 Stars: Dissatisfied, factual, polite, constructive.
- **Data Minimization**: Customer contact (`customerContact`), IP addresses, and device data are **never** passed to the AI provider.

### Output Validation & Customer Controls
- **3 Meaningfully Different Drafts**: Exactly 3 options produced per generation request (direct, conversational, punchy).
- **Output Sanitization**: Rejected if response contains HTML tags, script injection, or prohibited medical claims.
- **Customer Editing**: Selected draft is loaded into an editable textarea (up to 2000 characters).
- **Copy-First Flow**: One-tap clipboard copy (`Copy Review 📋`) with fallback selection and "Review copied!" feedback before customer continues to Google.

---

## 9. Google Review Redirection & Tracking (Phase 7)

Phase 7 connects the prepared review to the pharmacy's configured Google Review URL via a safe, non-blocking handoff.

```text
Generate Review
      ↓
Select Draft
      ↓
Edit Review
      ↓
Copy Review
      ↓
[ Post on Google ↗ ]
      ↓
Google Review Page (New Tab)
```

### Key Specifications & Architecture

1. **Google Review URL Source**:
   - Strictly derived from server-side `ShopSettings.googleReviewUrl`.
   - Never sourced from user input, query parameters, or client redirects (`?redirect=...`).
   - Validated server-side via `isValidExternalUrl()` ensuring valid absolute HTTP/HTTPS protocols. Unsafe protocols (`javascript:`, `data:`, `file:`) are rejected.

2. **Google Submission Cannot Be Verified**:
   - The application does **not** control Google's review submission interface.
   - The UI **never** claims "Review submitted successfully", "Google review completed", or "Your review has been posted".
   - The CTA label is clearly named **"Post on Google"** (with external indicator `↗`).
   - Helper text explains: *"Your review will open in Google. You can paste your copied review there and submit it."*
   - Handled via `target="_blank" rel="noopener noreferrer"`.

3. **Analytics Event: `GOOGLE_REVIEW_CLICK`**:
   - Tracks that the customer clicked the Google handoff CTA.
   - The event represents a **handoff**, NOT a confirmed or verified review submission.
   - Duplicate prevention: debounced in the client to avoid double-counts on rapid clicks or re-renders; never tracked on component mount.
   - Source context: Preserves valid QR attribution (`qr`, `counter`, `table`, `card`). Unrecognized or invalid sources safely default to `null` and are not persisted as raw exploit strings.

4. **Analytics Failure Must Not Block Navigation**:
   - Handled via non-blocking server action `trackGoogleReviewClickAction(source)`.
   - Native `<a href={googleReviewUrl} target="_blank" rel="noopener noreferrer">` ensures that even if database analytics fails or network is slow, the customer is never trapped or delayed from reaching Google.

5. **Missing/Invalid Google Review URL Resilience**:
   - If `googleReviewUrl` is `null`, empty, or invalid:
     - The Google CTA link is hidden/omitted.
     - A clean, helpful message is displayed: *"Google review link is currently unavailable. You can still copy your review above."*
     - No navigation to `undefined` or `#`.
     - The "Copy Review" button remains 100% functional.

6. **Privacy & Zero-Retention of Review Text**:
   - The application does **not** save or persist the customer's selected AI draft, edited review text, or clipboard content upon clicking Google.
   - No Google profile, Google account info, or customer identity is collected or sent.
   - No Google OAuth or Google APIs are invoked.

7. **Zero Review Gating**:
   - All customer ratings (1 to 5 stars) have equal access to the Google review handoff.
   - The application never blocks, gates, or rewrites negative reviews. The AI merely assists with natural wording.

---

## 10. Digital Customer Card Architecture & Features (`/customer/card`)

The Digital Customer Card acts as a mobile-optimized **digital business card** for the independent pharmacy, providing immediate access to contacts, hours, address, active promotional offers, and review access.

```text
CUSTOMER VISITS /customer/card (or /customer/card?source=qr)
                         ↓
┌────────────────────────────────────────────────────────┐
│  ← Pharmacy Home                        [ Share Card ] │
├────────────────────────────────────────────────────────┤
│               💳 Digital Pharmacy Card                 │
│                 Pharmacy Shop Name                     │
│                Tagline (if available)                  │
│       🚨 Emergency Availability Notice (if active)     │
├────────────────────────────────────────────────────────┤
│                 Pharmacy Quick Actions                 │
│        📞 Call Shop  •  💬 WhatsApp  •  📍 Directions  │
├────────────────────────────────────────────────────────┤
│              Hours & Store Information                 │
│         🕒 Weekly Opening Hours Schedule               │
│         📍 Physical Store Address                      │
│         📞 Contact Details (Phone & WhatsApp)          │
├────────────────────────────────────────────────────────┤
│              Current Pharmacy Offers                   │
│        🏷️ Active, Unexpired Store Deals & Discounts    │
├────────────────────────────────────────────────────────┤
│               ⭐ Give a Google Review                  │
│      (Connects to /customer/review with source intact) │
└────────────────────────────────────────────────────────┘
```

### Key Specifications & Architecture

1. **Single Source of Truth (`ShopSettings`)**:
   - Consumes existing `ShopSettings` fields: `shopName`, `tagline`, `phoneNumber`, `whatsappNumber`, `address`, `googleMapsUrl`, `googleReviewUrl`, `openingHours`, and `isEmergencyOpen`.
   - Zero duplicated tables or schema changes.
   - Server-side parallel fetch using `Promise.allSettled([getShopSettings(), listActiveOffers()])`.

2. **Emergency Availability Status**:
   - Driven by `isEmergencyOpen`.
   - When true, displays a restrained status notice: *"Emergency Availability: Essential medicine support open"*.
   - Never implies 24/7 service, doctor availability, or emergency clinical treatment unless explicitly configured.

3. **Contact Actions & Non-Blocking Analytics**:
   - **Call Shop**: Validated `tel:` URI via `formatTelHref()` with `CALL_CLICK` analytics.
   - **WhatsApp**: Official `https://wa.me/` URI via `formatWhatsAppHref()` with `WHATSAPP_CLICK` analytics, `target="_blank" rel="noopener noreferrer"`.
   - **Directions**: Server-configured `googleMapsUrl` validated via `isValidExternalUrl()` with `DIRECTIONS_CLICK` analytics, `target="_blank" rel="noopener noreferrer"`.
   - Touch targets $\ge 48$px with accessible ARIA labels.
   - Analytics failure never blocks the customer from calling or opening links.

4. **Operating Hours Resilience**:
   - Displays weekly slots in a clean, scannable format.
   - Resilient against malformed JSON or empty slots: invalid slots are filtered out safely without throwing runtime errors.
   - If hours are unavailable, gracefully renders *"Opening hours currently unavailable."* without exposing raw JSON.

5. **Current Offers Display Rules (Read-Only)**:
   - Fetches active offers via `listActiveOffers()`.
   - Strictly read-only: displays only where `isActive === true` and `validUntil` is either null or $\ge$ current date.
   - Sorted by `sortOrder` ascending, then `createdAt` descending.
   - Renders `title`, optional `badge`, optional `description`, and formatted `validUntil` expiration date.
   - If no active offers exist: the section is hidden completely (no empty placeholder boxes).
   - All text rendered safely as plain text (zero `dangerouslySetInnerHTML`).
   - Zero Offers CRUD (creation, editing, deletion belong strictly to Phase 10).

6. **Google Review Integration**:
   - If `googleReviewUrl` is configured and valid, displays a prominent review CTA linking internally to `/customer/review`.
   - **Source Preservation**: Preserves attribution parameter (e.g., `/customer/card?source=qr` $\rightarrow$ `/customer/review?source=qr`).
   - If `googleReviewUrl` is missing or invalid: review CTA is cleanly omitted without broken links or `#` targets.

7. **Privacy & Scope Boundaries**:
   - No customer accounts, registration, login, or OTP.
   - No loyalty points, stamps, cashback, or reward tiers.
   - No NFT, blockchain, crypto, or Apple/Google Wallet passes.
   - No customer identity, GPS coordinates, or IP addresses collected.
   - Publicly accessible without authentication.

