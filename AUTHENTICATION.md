# Admin Authentication & Security Architecture

This document describes the authentication and security implementation for the single-pharmacy admin management portal.

---

## 1. Authentication Architecture Overview

The system is designed for **one pharmacy owner/administrator** managing a single independent pharmacy. It adheres to a strict single-tenant model with no multi-tenancy, RBAC, or external identity providers.

### Key Tenets
- **Server-Side Only**: All credential verification, session validation, and authorization checks run strictly server-side in Node.js / React Server Components.
- **Defense in Depth**: Route protection is enforced at both the Edge middleware layer (`src/middleware.ts`) and within every protected server component via `requireAdmin()`.
- **Zero Plaintext Credentials**: Passwords are verified using `bcryptjs` with salted hashes ($2b$10$). Hashes and tokens are never sent to the browser or logged.

---

## 2. Session Architecture

Sessions are **database-backed** using the minimal `AdminSession` Prisma model with **SHA-256 token hashing**:

```prisma
model AdminSession {
  id          String     @id @default(uuid())
  adminUserId String
  adminUser   AdminUser  @relation(fields: [adminUserId], references: [id], onDelete: Cascade)
  tokenHash   String     @unique
  expiresAt   DateTime
  createdAt   DateTime   @default(now())

  @@index([adminUserId])
  @@index([expiresAt])
}
```

### Security Flow
1. **Token Generation**: On login, the server generates a 256-bit cryptographically secure random token (`crypto.randomBytes(32).toString('hex')`).
2. **Token Hashing**: The raw token is hashed via `SHA-256` before persistence (`tokenHash`). The raw token is **never** stored in the database.
3. **Cookie Delivery**: The browser receives only the raw token inside an HTTP-only cookie.
4. **Validation**: Upon incoming requests, the server hashes the cookie value and queries `AdminSession` by `tokenHash`.
5. **Session Fixation Prevention**: Any pre-existing active sessions for the admin user are revoked when a new login occurs.
6. **Opportunistic Cleanup**: Expired sessions are pruned opportunistically during authentication checks without requiring background cron daemons.

---

## 3. Cookie Configuration

Authentication cookies are configured with strict security flags:

| Attribute | Setting | Rationale |
|-----------|---------|-----------|
| **Name** | `admin_session` | Distinct, clear identifier |
| **HttpOnly** | `true` | Prevents client-side scripts / XSS from reading the session token |
| **SameSite** | `Lax` | Provides CSRF mitigation while permitting top-level navigation |
| **Secure** | `NODE_ENV === 'production'` | Requires HTTPS in production environments, permits `localhost` in development |
| **Path** | `/` | Accessible across all admin routes |
| **Max-Age** | 7 days (`604,800` seconds) | Standard session lifetime for single-business owner |

---

## 4. Login Flow

1. Admin visits `/admin/login`. If already authenticated, they are automatically redirected to `/admin`.
2. Form submission triggers `loginAction(prevState, formData)` server action.
3. Server validates input using `LoginInputSchema` (username 3–50 characters, password max 128 characters).
4. **Rate Limiting**: Checks failed attempt count for the client identifier (IP / header fingerprint). If $\ge 5$ failed attempts within 15 minutes, the request is temporarily locked out.
5. Server queries `AdminUser` by username:
   - If not found, a dummy bcrypt comparison is executed to prevent timing-based user enumeration.
   - If found, `verifyPassword(password, user.passwordHash)` is evaluated.
6. On credential failure:
   - Increments failed attempt counter.
   - Returns generic error: `"Invalid username or password."`
7. On credential success:
   - Resets rate limit records for the client.
   - Cleans up existing sessions for the user (session fixation protection).
   - Generates 256-bit token and stores `SHA-256` hash in `AdminSession` (7-day expiry).
   - Sets secure `admin_session` cookie.
   - Updates `AdminUser.lastLoginAt` timestamp.
   - Redirects to sanitized `returnUrl` (default: `/admin`).

---

## 5. Logout Flow

1. Admin clicks "Sign Out" in the Admin navigation bar, triggering `logoutAction()`.
2. The server extracts the `admin_session` cookie.
3. Computes the SHA-256 hash of the token.
4. Deletes the corresponding `AdminSession` record from the database.
5. Deletes the `admin_session` cookie from the browser (`maxAge: 0`).
6. Redirects user to `/admin/login`.

---

## 6. Route Protection Boundary

### Protected Routes
- `/admin`
- `/admin/reviews`
- `/admin/analytics`
- `/admin/offers`
- `/admin/settings`
- Any future `/admin/*` sub-route (except `/admin/login`)

### Two-Tier Enforcement
1. **Edge Middleware (`src/middleware.ts`)**:
   - Intercepts all requests matching `/admin/:path*`.
   - Bypasses `/admin/login` (and redirects authenticated sessions to `/admin`).
   - Checks presence of `admin_session` cookie; redirects unauthenticated visitors to `/admin/login?returnUrl=...`.
2. **Server-Side Boundary (`requireAdmin()`)**:
   - Called inside server components and server actions.
   - Validates the token against the SQLite database, checks expiration, and retrieves the active `AdminUser`.
   - Redirects to `/admin/login` if the session is absent, revoked, or expired.

---

## 7. Brute-Force & Enumeration Protection

- **Failed Attempt Threshold**: 5 failed login attempts per client identity within a 15-minute sliding window.
- **Lockout Duration**: 15 minutes.
- **Constant-Time Timing Safeguard**: When an invalid username is submitted, the server performs a dummy bcrypt comparison using a constant benchmark hash, ensuring consistent execution time.
- **Generic Responses**: All authentication errors return `"Invalid username or password."` without disclosing account existence or specific failure reasons.

---

## 8. Open Redirect Safeguards

The return URL parameter (`?returnUrl=...`) is strictly sanitized by `sanitizeReturnUrl()`:
- Must start with `/`
- Must NOT start with `//` (protocol-relative external redirect attack)
- Must NOT contain `\` or external URLs
- Allowed destination paths are restricted to internal admin paths (`/admin`, `/admin/*`)
- Any malformed or external return URL defaults safely to `/admin`

---

## 9. Security Headers

Configured in `next.config.ts`:
- **`X-Frame-Options: DENY`**: Mitigates clickjacking attacks.
- **`X-Content-Type-Options: nosniff`**: Prevents MIME-type sniffing.
- **`Referrer-Policy: strict-origin-when-cross-origin`**: Limits referrer leakage to external domains.
- **`Permissions-Policy: camera=(), microphone=(), geolocation=()`**: Disables unused browser hardware capabilities.

---

## 10. Development & Production Operations

### Seed Admin Account
Development credentials provisioned by `prisma/seed.ts`:
- **Username**: `admin`
- **Password**: `admin123` *(development only; must be updated for production)*

To seed or reset the development database:
```bash
npm run db:seed
```

### Production Checklist
1. Ensure `NODE_ENV=production` so cookies enforce `Secure=true`.
2. Run database migrations: `npx prisma migrate deploy`.
3. Set a strong password for `AdminUser` via deployment script or CLI.
