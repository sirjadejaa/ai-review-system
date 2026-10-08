import { describe, it, expect, beforeEach } from 'vitest';
import {
  formatTelHref,
  formatWhatsAppHref,
  isValidExternalUrl,
} from '@/lib/format/contact-links';
import {
  isFeedbackRateLimited,
  recordFeedbackSubmission,
  clearFeedbackRateLimits,
} from '@/lib/feedback/rate-limiter';
import {
  isAIRateLimited,
  recordAIRequest,
} from '@/lib/ai/rate-limiter';
import {
  CustomerLandingQuerySchema,
  VALID_QR_SOURCES,
} from '@/lib/validation/customer-query-schema';
import {
  UpdateFeedbackStatusSchema,
  CustomerFeedbackSubmissionSchema,
} from '@/lib/validation/feedback-schema';
import { updateFeedbackStatusAction } from '@/lib/actions/feedback-actions';
import nextConfig from '../next.config';

describe('Phase 11: Final Quality & Security Hardening Tests', () => {
  describe('1. Contact Links & URL Sanitization Hardening', () => {
    it('safely handles empty, whitespace, and non-numeric strings in formatTelHref', () => {
      expect(formatTelHref('')).toBe('');
      expect(formatTelHref('   ')).toBe('');
      expect(formatTelHref(null)).toBe('');
      expect(formatTelHref(undefined)).toBe('');
      expect(formatTelHref('abc-def')).toBe('');
      expect(formatTelHref('+91 98765-43210')).toBe('tel:+919876543210');
      expect(formatTelHref('9876543210')).toBe('tel:9876543210');
    });

    it('safely handles empty, whitespace, and non-numeric strings in formatWhatsAppHref', () => {
      expect(formatWhatsAppHref('')).toBe('');
      expect(formatWhatsAppHref('   ')).toBe('');
      expect(formatWhatsAppHref(null)).toBe('');
      expect(formatWhatsAppHref(undefined)).toBe('');
      expect(formatWhatsAppHref('xyz')).toBe('');
      expect(formatWhatsAppHref('9876543210')).toBe('https://wa.me/919876543210');
      expect(formatWhatsAppHref('09876543210')).toBe('https://wa.me/919876543210');
      expect(formatWhatsAppHref('919876543210')).toBe('https://wa.me/919876543210');
    });

    it('strictly rejects non-HTTP(S) URLs including javascript:, data:, and empty strings', () => {
      expect(isValidExternalUrl('')).toBe(false);
      expect(isValidExternalUrl('   ')).toBe(false);
      expect(isValidExternalUrl(null)).toBe(false);
      expect(isValidExternalUrl(undefined)).toBe(false);
      expect(isValidExternalUrl('javascript:alert(1)')).toBe(false);
      expect(isValidExternalUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
      expect(isValidExternalUrl('vbscript:msgbox(1)')).toBe(false);
      expect(isValidExternalUrl('ftp://example.com')).toBe(false);
      expect(isValidExternalUrl('file:///etc/passwd')).toBe(false);
      expect(isValidExternalUrl('https://maps.google.com')).toBe(true);
      expect(isValidExternalUrl('http://maps.google.com')).toBe(true);
      expect(isValidExternalUrl('  https://g.page/r/example  ')).toBe(true);
    });
  });

  describe('2. Rate Limiter Zero-PII SHA-256 Hashing', () => {
    beforeEach(() => {
      clearFeedbackRateLimits();
    });

    it('rate limits feedback requests deterministically using hashed client keys', () => {
      const client = '192.168.1.50:Mozilla/5.0';
      expect(isFeedbackRateLimited(client).isBlocked).toBe(false);

      for (let i = 0; i < 5; i++) {
        recordFeedbackSubmission(client);
      }

      const blockedCheck = isFeedbackRateLimited(client);
      expect(blockedCheck.isBlocked).toBe(true);
      expect(blockedCheck.retryAfterSeconds).toBeGreaterThan(0);

      // Different client is not blocked
      expect(isFeedbackRateLimited('10.0.0.1:Chrome/120').isBlocked).toBe(false);
    });

    it('rate limits AI requests deterministically using hashed keys', () => {
      const client = 'client-ai-test-key';
      expect(isAIRateLimited(client).isBlocked).toBe(false);

      for (let i = 0; i < 10; i++) {
        recordAIRequest(client);
      }

      const blockedCheck = isAIRateLimited(client);
      expect(blockedCheck.isBlocked).toBe(true);
      expect(blockedCheck.retryAfterSeconds).toBeGreaterThan(0);
    });
  });

  describe('3. QR Source Whitelist & Query Validation', () => {
    it('accepts only allowed QR source tags and rejects unrecognized values', () => {
      for (const validSource of VALID_QR_SOURCES) {
        const parsed = CustomerLandingQuerySchema.safeParse({ source: validSource });
        expect(parsed.success).toBe(true);
        if (parsed.success) {
          expect(parsed.data.source).toBe(validSource);
        }
      }

      // Invalid sources fail safeParse
      const invalid = CustomerLandingQuerySchema.safeParse({ source: 'malicious_campaign' });
      expect(invalid.success).toBe(false);

      // Empty object passes with undefined source
      const empty = CustomerLandingQuerySchema.safeParse({});
      expect(empty.success).toBe(true);
      if (empty.success) {
        expect(empty.data.source).toBeUndefined();
      }
    });
  });

  describe('4. Server-Side Feedback Authorization & Validation', () => {
    it('validates feedback status transitions strictly against enum', () => {
      expect(UpdateFeedbackStatusSchema.safeParse({ status: 'NEW' }).success).toBe(true);
      expect(UpdateFeedbackStatusSchema.safeParse({ status: 'REVIEWED' }).success).toBe(true);
      expect(UpdateFeedbackStatusSchema.safeParse({ status: 'RESOLVED' }).success).toBe(true);
      expect(UpdateFeedbackStatusSchema.safeParse({ status: 'DELETED' }).success).toBe(false);
      expect(UpdateFeedbackStatusSchema.safeParse({ status: 'ARCHIVED' }).success).toBe(false);
    });

    it('requires authenticated admin for updateFeedbackStatusAction and redirects/fails if unauthenticated', async () => {
      // In unauthenticated context, updateFeedbackStatusAction rejects or catches auth error
      try {
        const result = await updateFeedbackStatusAction('test-id', 'REVIEWED');
        expect(result.success).toBe(false);
      } catch (error) {
        // NEXT_REDIRECT to /admin/login is expected when unauthenticated
        expect((error as Error).message).toContain('NEXT_REDIRECT');
      }
    });

    it('rejects feedback notes exceeding length limits or containing invalid rating', () => {
      const invalidRating = CustomerFeedbackSubmissionSchema.safeParse({
        rating: 6,
        tags: ['Quick Service'],
      });
      expect(invalidRating.success).toBe(false);

      const invalidLength = CustomerFeedbackSubmissionSchema.safeParse({
        rating: 5,
        tags: ['Quick Service'],
        notes: 'a'.repeat(1001),
      });
      expect(invalidLength.success).toBe(false);
    });
  });

  describe('5. Production Security Headers', () => {
    it('configures essential security headers including HSTS and anti-clickjacking', async () => {
      const headersConfig = await nextConfig.headers?.();
      expect(headersConfig).toBeDefined();
      expect(headersConfig!.length).toBeGreaterThan(0);

      const globalHeaders = headersConfig![0].headers;
      const headerMap = new Map(globalHeaders.map((h: { key: string; value: string }) => [h.key, h.value]));

      expect(headerMap.get('X-Frame-Options')).toBe('DENY');
      expect(headerMap.get('X-Content-Type-Options')).toBe('nosniff');
      expect(headerMap.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
      expect(headerMap.get('Strict-Transport-Security')).toContain('max-age=63072000');
    });
  });
});
