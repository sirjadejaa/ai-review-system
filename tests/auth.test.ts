import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/db';
import {
  hashPassword,
  verifyPassword,
  createAdminSession,
  validateSessionToken,
  destroyAdminSession,
  isRateLimited,
  recordFailedAttempt,
  resetFailedAttempts,
  clearRateLimitRecords,
  sanitizeReturnUrl,
} from '@/lib/auth';

describe('Phase 3: Admin Authentication & Security Tests', () => {
  beforeEach(() => {
    clearRateLimitRecords();
  });

  describe('1. Password Hashing & Verification', () => {
    it('verifies correct password against bcrypt hash', async () => {
      const password = 'securePassword123!';
      const hash = await hashPassword(password);

      expect(hash).not.toBe(password);
      expect(hash.startsWith('$2')).toBe(true);

      const isMatch = await verifyPassword(password, hash);
      expect(isMatch).toBe(true);
    });

    it('rejects incorrect password with false', async () => {
      const hash = await hashPassword('correctPassword');
      const isMatch = await verifyPassword('wrongPassword', hash);
      expect(isMatch).toBe(false);
    });

    it('handles empty or malformed input gracefully without crashing', async () => {
      const isMatch = await verifyPassword('', '');
      expect(isMatch).toBe(false);
    });
  });

  describe('2. Session Token Generation & Database Lifecycle', () => {
    let adminUserId: string;

    beforeEach(async () => {
      const admin = await prisma.adminUser.findUnique({
        where: { username: 'admin' },
      });
      if (!admin) {
        throw new Error('Seeded admin user not found. Ensure db:seed was executed.');
      }
      adminUserId = admin.id;
    });

    it('creates a cryptographically random session and stores only SHA-256 hash', async () => {
      const { rawToken, expiresAt } = await createAdminSession(adminUserId);

      expect(rawToken).toBeDefined();
      expect(rawToken.length).toBe(64); // 32 bytes in hex = 64 chars
      expect(expiresAt.getTime()).toBeGreaterThan(Date.now());

      // Raw token must NOT exist directly in the database
      const rawInDb = await prisma.adminSession.findFirst({
        where: { tokenHash: rawToken },
      });
      expect(rawInDb).toBeNull();
    });

    it('validates a valid session token and returns the admin user', async () => {
      const { rawToken } = await createAdminSession(adminUserId);
      const validatedAdmin = await validateSessionToken(rawToken);

      expect(validatedAdmin).not.toBeNull();
      expect(validatedAdmin?.username).toBe('admin');
      // Password hash must NEVER be attached to safe domain user
      expect((validatedAdmin as unknown as Record<string, unknown>).passwordHash).toBeUndefined();
    });

    it('rejects an invalid or tampered session token', async () => {
      const invalidAdmin = await validateSessionToken('completely_fake_token_1234567890');
      expect(invalidAdmin).toBeNull();
    });

    it('rejects an expired session and deletes it', async () => {
      const { rawToken } = await createAdminSession(adminUserId);

      // Artificially expire the session in the database
      await prisma.adminSession.updateMany({
        where: { adminUserId },
        data: { expiresAt: new Date(Date.now() - 10000) },
      });

      const validatedAdmin = await validateSessionToken(rawToken);
      expect(validatedAdmin).toBeNull();
    });

    it('destroys session on logout', async () => {
      const { rawToken } = await createAdminSession(adminUserId);

      const isValidBefore = await validateSessionToken(rawToken);
      expect(isValidBefore).not.toBeNull();

      const destroyed = await destroyAdminSession(rawToken);
      expect(destroyed).toBe(true);

      const isValidAfter = await validateSessionToken(rawToken);
      expect(isValidAfter).toBeNull();
    });

    it('prevents session fixation by invalidating prior sessions on new login', async () => {
      const session1 = await createAdminSession(adminUserId);
      const session2 = await createAdminSession(adminUserId);

      // Old session1 must be invalidated
      const oldCheck = await validateSessionToken(session1.rawToken);
      expect(oldCheck).toBeNull();

      // New session2 must be valid
      const newCheck = await validateSessionToken(session2.rawToken);
      expect(newCheck).not.toBeNull();
    });
  });

  describe('3. Brute Force Protection & Rate Limiting', () => {
    const testKey = 'test_owner_key';

    it('allows attempts below the 5-attempt threshold', () => {
      for (let i = 1; i <= 4; i++) {
        const result = recordFailedAttempt(testKey);
        expect(result.isBlocked).toBe(false);
      }

      const status = isRateLimited(testKey);
      expect(status.isBlocked).toBe(false);
    });

    it('locks out after 5 consecutive failed attempts', () => {
      for (let i = 1; i <= 4; i++) {
        recordFailedAttempt(testKey);
      }

      const fifthAttempt = recordFailedAttempt(testKey);
      expect(fifthAttempt.isBlocked).toBe(true);
      expect(fifthAttempt.retryAfterSeconds).toBeGreaterThan(0);

      const status = isRateLimited(testKey);
      expect(status.isBlocked).toBe(true);
    });

    it('clears failed attempts upon successful login reset', () => {
      for (let i = 1; i <= 3; i++) {
        recordFailedAttempt(testKey);
      }

      resetFailedAttempts(testKey);
      const status = isRateLimited(testKey);
      expect(status.isBlocked).toBe(false);
    });
  });

  describe('4. Open Redirect Protection', () => {
    it('accepts safe internal admin paths', () => {
      expect(sanitizeReturnUrl('/admin')).toBe('/admin');
      expect(sanitizeReturnUrl('/admin/reviews')).toBe('/admin/reviews');
      expect(sanitizeReturnUrl('/admin/settings')).toBe('/admin/settings');
    });

    it('neutralizes malicious external redirect attempts', () => {
      expect(sanitizeReturnUrl('https://evil-phishing.com')).toBe('/admin');
      expect(sanitizeReturnUrl('http://attacker.com')).toBe('/admin');
      expect(sanitizeReturnUrl('//evil.com/admin')).toBe('/admin');
      expect(sanitizeReturnUrl('/customer/card')).toBe('/admin');
      expect(sanitizeReturnUrl('')).toBe('/admin');
      expect(sanitizeReturnUrl(null)).toBe('/admin');
    });
  });

  describe('5. Edge Middleware Redirect Loop Prevention', () => {
    it('redirects unauthenticated /admin requests to /admin/login', async () => {
      const { middleware } = await import('@/middleware');
      const { NextRequest } = await import('next/server');

      const req = new NextRequest('http://localhost:3000/admin');
      const res = middleware(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/admin/login?returnUrl=%2Fadmin');
    });

    it('does NOT blindly redirect from /admin/login back to /admin when cookie is present', async () => {
      const { middleware } = await import('@/middleware');
      const { NextRequest } = await import('next/server');

      const req = new NextRequest('http://localhost:3000/admin/login', {
        headers: { cookie: 'admin_session=stale_or_expired_token' },
      });
      const res = middleware(req);

      // Must NOT redirect (307/302/308) to /admin, which would cause an infinite ping-pong loop
      expect(res.status).not.toBe(307);
      expect(res.status).not.toBe(308);
      expect(res.headers.get('location')).toBeNull();
    });

    it('clears stale session cookie on /admin/login when returnUrl is present', async () => {
      const { middleware } = await import('@/middleware');
      const { NextRequest } = await import('next/server');

      const req = new NextRequest('http://localhost:3000/admin/login?returnUrl=%2Fadmin', {
        headers: { cookie: 'admin_session=stale_or_expired_token' },
      });
      const res = middleware(req);

      const setCookie = res.headers.get('set-cookie');
      expect(setCookie).toBeTruthy();
      expect(setCookie).toContain('admin_session=;');
    });
  });
});

