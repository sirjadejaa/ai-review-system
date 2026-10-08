# Owner Dashboard & Analytics Architecture

This document describes the design, implementation, semantics, security, and privacy boundaries for the **Phase 9 Owner Dashboard & Analytics** system for the single independent pharmacy web application.

---

## 1. Purpose & Core Philosophy

The Owner Dashboard empowers the independent pharmacy owner to quickly answer one fundamental business question:

> **"Is this system actually generating customer engagement for my pharmacy?"**

It provides actionable clarity into:
- How many physical QR code scans occurred
- How many customers clicked through toward Google Reviews
- How many customers initiated direct contact actions (Calls, WhatsApp, Directions)
- Customer satisfaction sentiment through internal feedback submissions and rating distribution
- Daily engagement activity trends over selectable time periods

### What This Dashboard Is NOT:
- **NOT** an enterprise business intelligence platform or complex funnel builder.
- **NOT** a customer relationship management (CRM) database with customer tracking or profiling.
- **NOT** proof of verified Google reviews posted (it tracks clicks/handoffs only).
- **NOT** a third-party tracking system (zero external pixels, scripts, cookies, or device fingerprinting).

---

## 2. Admin Routes & Access Control

Access is strictly protected by the Phase 3 server-side authentication system.

| Route | Purpose | Access Control |
|---|---|---|
| `/admin` | Primary Owner Overview Dashboard (KPIs, Funnel, Daily Activity Trend, Feedback Summary, Recent Feedback) | `requireAdmin('/admin')` |
| `/admin/analytics` | Detailed Analytics & QR Placement Breakdown | `requireAdmin('/admin/analytics')` |
| `/admin/reviews` | Complete Customer Feedback Submissions List | `requireAdmin('/admin/reviews')` |
| `/admin/login` | Secure Admin Authentication Entry Point | Public with Rate Limiting |

### Server-Side Authorization
All analytics pages are implemented as React Server Components (RSC) that invoke `requireAdmin()` before rendering:
- Unauthenticated requests are immediately redirected via HTTP 307 to `/admin/login?returnUrl=<sanitized_path>`.
- Open redirect attempts via `returnUrl` are strictly sanitized to allow only relative `/admin*` paths.
- No analytics data or database endpoints are accessible to public or client-side fetch calls.

---

## 3. Engagement Metrics & Strict Semantics

All analytics events represent **explicit user-initiated customer actions**. They are engagement indicators, not physical confirmations or external platform verifications.

| Metric | Event Identifier | Exact Semantics & Boundaries |
|---|---|---|
| **QR Scans** | `QR_SCAN` | Customer scanned a physical QR code (or accessed via a tracked source tag such as `counter`, `table`, `card`). |
| **Google Review Clicks** | `GOOGLE_REVIEW_CLICK` | Customer clicked the "Post on Google" or "Leave a Review" handoff button. **Never labeled as verified Google reviews posted**. |
| **Call Clicks** | `CALL_CLICK` | Customer clicked the pharmacy telephone action link. Represents handoff to phone dialer. |
| **WhatsApp Clicks** | `WHATSAPP_CLICK` | Customer clicked the WhatsApp chat action link. Represents handoff to WhatsApp. |
| **Directions Clicks** | `DIRECTIONS_CLICK` | Customer clicked the Google Maps directions link. Represents handoff to navigation. |
| **Customer Feedback** | `Feedback` record | Customer submitted private rating, tags, and optional notes via the internal feedback engine. |

### Critical Google Review Funnel Distinction
The Google Review Click Funnel displays:
$$\text{Review Click-Through Rate} = \frac{\text{Google Review Clicks}}{\text{QR Scans}} \times 100$$

- **Accurate Labeling**: Labeled strictly as **Review Click Rate** or **Google Review Clicks**.
- **Zero-Division Protection**: If QR Scans $= 0$, the calculation safely returns `null` and displays `"No QR scan data available"` to prevent `NaN`, `Infinity`, or misleading percentages.
- **Zero Misleading Claims**: The system explicitly disclaims that review clicks represent handoffs, not confirmed reviews on Google's public platform.

---

## 4. Time Range Filtering

The dashboard supports 4 clean time range presets:

| Parameter Value | Filter Boundary | Purpose |
|---|---|---|
| `today` | Current calendar day from `00:00:00.000` | Real-time daily monitoring |
| `7d` | Past 7 rolling days ($7 \times 24\text{ hours}$) | Short-term weekly velocity |
| `30d` (Default) | Past 30 rolling days ($30 \times 24\text{ hours}$) | Standard monthly overview |
| `all` | `null` (entire historical database) | Lifetime totals |

### Security & Input Whitelisting
- URL parameter `?range=...` is validated server-side using `DashboardRangeSchema` (Zod).
- Any unrecognized, null, or malicious values (e.g. SQL injection attempts, arbitrary dates) are neutralized and safely defaulted to `'30d'`.
- Query parameter manipulation cannot alter database column selections or injection surfaces.

---

## 5. Daily Activity Trend Visualization

To avoid heavy external charting libraries (e.g. Chart.js, Recharts, D3) that bloat bundle sizes:
- A custom, lightweight SVG/CSS responsive chart (`ActivityTrendChart`) renders daily engagement activity.
- Contiguous date buckets are computed server-side for each calendar day in the selected range, guaranteeing continuous visual flow even on zero-activity days.
- **Responsive & Accessible**:
  - Dynamically resizes to fit 360px mobile viewports up to 1440px desktop displays with zero horizontal overflow.
  - Interactive tooltips display precise event breakdowns per day.
  - Full ARIA semantics (`role="region"`, `aria-label`, semantic color keys) ensure accessibility compliance without relying on color alone.

---

## 6. Customer Feedback & Sentiment Summary

The dashboard integrates with the `Feedback` model:

- **Total Feedback**: Count of feedback entries submitted during the selected period.
- **Average Rating**: Calculated directly via Prisma aggregation (`_avg.rating`), formatted to one decimal place (e.g. `4.8 / 5`).
- **Rating Distribution**: Exact count breakdown for each star level ($5\bigstar$, $4\bigstar$, $3\bigstar$, $2\bigstar$, $1\bigstar$) with proportional visual progress bars and count labels.
- **Recent Feedback List**: Shows the 5 latest feedback entries with star rating, selected tags, note snippet, status, and formatted submission date.
- **Full Feedback Access**: Quick link to `/admin/reviews` for complete feedback management.

---

## 7. Privacy & Security Boundaries

Privacy remains paramount. The Owner Dashboard enforces strict data isolation:

1. **Zero Customer PII on Dashboard Summary**:
   - `getFeedbackDashboardAnalytics()` explicitly selects only non-PII fields (`id`, `rating`, `tags`, `notes`, `status`, `createdAt`).
   - Customer contact numbers (`customerContact`) are deliberately omitted from dashboard summary queries and components.
2. **No Tracking Hardware / Network Identifiers**:
   - The analytics system does not collect, store, or display IP addresses, GPS coordinates, MAC addresses, device fingerprints, or browser identifiers.
3. **No External Trackers**:
   - Zero third-party analytics scripts (Google Analytics, Meta Pixel, Mixpanel, etc.).
4. **Single-Tenant Isolation**:
   - All queries operate directly on the single pharmacy database without multi-tenant complexity or leaking cross-organization state.

---

## 8. Graceful Zero-Data & Error Handling

Every dashboard card and section handles empty or zero-data states gracefully:
- **KPI Grid**: Displays zero counts (`0`) cleanly without rendering errors or missing fields.
- **Activity Chart**: Renders an accessible `EmptyState` ("No activity recorded in this period") when zero events exist.
- **Review Funnel**: Displays `"No QR scan data available"` when no QR scans have been registered.
- **Feedback Summary**: Displays `"No feedback yet"` and 0-count distribution bars without `NaN`.
- **Recent Feedback**: Displays a friendly `EmptyState` ("No customer feedback received yet for this period").

---

## 9. Verification & Automated Testing

The Phase 9 implementation is tested in `tests/admin-dashboard.test.ts` across 20 automated tests:

1. **Authentication**:
   - Unauthenticated access to `/admin` redirects to `/admin/login`.
   - Unauthenticated access to `/admin/analytics` redirects to `/admin/login`.
   - Authenticated admin session successfully resolves.
2. **Security & Input Validation**:
   - Whitelists valid ranges (`today`, `7d`, `30d`, `all`).
   - Neutralizes arbitrary or malicious values to default `'30d'`.
   - Calculates exact boundary dates.
3. **Analytics Aggregation**:
   - Aggregates each engagement event type accurately.
   - Handles zero-data date ranges safely.
   - Computes QR source tag distribution.
   - Generates contiguous daily trend buckets.
4. **Feedback Sentiment**:
   - Aggregates total, average rating, and 5-to-1 star distribution.
   - Handles zero feedback datasets without calculation errors.
5. **Funnel & Zero Division**:
   - Computes accurate click-through rate when scans exist.
   - Prevents division by zero when QR scans equal 0.
6. **Privacy Boundaries**:
   - Verifies customer contact details are omitted from dashboard payloads.
   - Verifies absence of IP, GPS, or device tracking fields.
   - Confirms strict adherence to engagement click terminology.
