import { describe, it, expect, vi } from 'vitest';
import { trackGoogleReviewClickAction } from '@/lib/actions/customer-actions';
import {
  listAnalyticsEvents,
  trackAnalyticsEvent,
} from '@/lib/repositories/analytics-repository';
import {
  VALID_QR_SOURCES,
  CustomerLandingQuerySchema,
} from '@/lib/validation/customer-query-schema';
import { isValidExternalUrl } from '@/lib/format/contact-links';
import { prisma } from '@/lib/db';

describe('Phase 7: Google Review Redirection & Tracking Tests', () => {
  describe('1. Google Review URL Validation & Security', () => {
    it('accepts valid absolute HTTP and HTTPS URLs', () => {
      expect(isValidExternalUrl('https://g.page/r/example/review')).toBe(true);
      expect(isValidExternalUrl('https://search.google.com/local/writereview?placeid=ChIJ12345')).toBe(true);
      expect(isValidExternalUrl('http://maps.google.com/?cid=12345')).toBe(true);
    });

    it('rejects unsafe protocols (javascript:, data:, file:)', () => {
      expect(isValidExternalUrl('javascript:alert(1)')).toBe(false);
      expect(isValidExternalUrl('javascript:void(0)')).toBe(false);
      expect(isValidExternalUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
      expect(isValidExternalUrl('file:///etc/passwd')).toBe(false);
    });

    it('rejects malformed or empty URLs', () => {
      expect(isValidExternalUrl('')).toBe(false);
      expect(isValidExternalUrl('   ')).toBe(false);
      expect(isValidExternalUrl(null)).toBe(false);
      expect(isValidExternalUrl(undefined)).toBe(false);
      expect(isValidExternalUrl('not-a-valid-url')).toBe(false);
      expect(isValidExternalUrl('undefined')).toBe(false);
      expect(isValidExternalUrl('#')).toBe(false);
    });
  });

  describe('2. Source Context & Validation', () => {
    it('records GOOGLE_REVIEW_CLICK with valid source attribution (qr, counter, table, card)', async () => {
      for (const validSource of VALID_QR_SOURCES) {
        const res = await trackGoogleReviewClickAction(validSource);
        expect(res.success).toBe(true);

        const events = await listAnalyticsEvents({ eventType: 'GOOGLE_REVIEW_CLICK', limit: 1 });
        expect(events[0]).toBeDefined();
        expect(events[0].eventType).toBe('GOOGLE_REVIEW_CLICK');
        expect(events[0].source).toBe(validSource);
      }
    });

    it('sanitizes invalid or malicious sources and defaults to null source without persisting exploit strings', async () => {
      const maliciousSources = [
        'evil',
        'attacker<script>alert(1)</script>',
        'unknown_source',
        'sql_injection\' OR 1=1--',
      ];

      for (const badSource of maliciousSources) {
        const res = await trackGoogleReviewClickAction(badSource);
        expect(res.success).toBe(true);

        const events = await listAnalyticsEvents({ eventType: 'GOOGLE_REVIEW_CLICK', limit: 1 });
        expect(events[0]).toBeDefined();
        // Malicious source must NOT be stored
        expect(events[0].source).toBeNull();
      }
    });

    it('handles direct/missing source safely as null source', async () => {
      const res = await trackGoogleReviewClickAction(undefined);
      expect(res.success).toBe(true);

      const events = await listAnalyticsEvents({ eventType: 'GOOGLE_REVIEW_CLICK', limit: 1 });
      expect(events[0]).toBeDefined();
      expect(events[0].source).toBeNull();
    });

    it('validates URL query params using CustomerLandingQuerySchema', () => {
      VALID_QR_SOURCES.forEach((s) => {
        const parsed = CustomerLandingQuerySchema.safeParse({ source: s });
        expect(parsed.success).toBe(true);
      });

      expect(CustomerLandingQuerySchema.safeParse({ source: 'evil' }).success).toBe(false);
      expect(CustomerLandingQuerySchema.safeParse({}).success).toBe(true);
    });
  });

  describe('3. Submission Accuracy & Review Verification Boundaries', () => {
    it('only records GOOGLE_REVIEW_CLICK and NEVER GOOGLE_REVIEW_SUBMITTED', async () => {
      await trackGoogleReviewClickAction('qr');

      const allEvents = await listAnalyticsEvents();
      const forbiddenSubmittedEvents = allEvents.filter(
        (e) =>
          (e.eventType as string) === 'GOOGLE_REVIEW_SUBMITTED' ||
          (e.eventType as string) === 'GOOGLE_REVIEW_COMPLETED' ||
          (e.eventType as string) === 'REVIEW_POSTED'
      );

      expect(forbiddenSubmittedEvents).toHaveLength(0);
    });

    it('explicitly records that click represents handoff, not verified Google review submission', async () => {
      const event = await trackAnalyticsEvent({
        eventType: 'GOOGLE_REVIEW_CLICK',
        source: 'qr',
      });

      expect(event.eventType).toBe('GOOGLE_REVIEW_CLICK');
      expect(event.eventType).not.toBe('GOOGLE_REVIEW_SUBMITTED');
    });
  });

  describe('4. Privacy & Zero-Retention of Customer Review Data', () => {
    it('ensures analytics payload contains NO review text, customer identity, or phone number', async () => {
      await trackGoogleReviewClickAction('counter');

      const events = await listAnalyticsEvents({ eventType: 'GOOGLE_REVIEW_CLICK', limit: 1 });
      const record = events[0];

      // Domain fields check
      const keys = Object.keys(record);
      expect(keys).toEqual(['id', 'eventType', 'source', 'createdAt']);

      // Raw database columns check
      const rawDbRecord = await prisma.analyticsEvent.findUnique({
        where: { id: record.id },
      });
      expect(rawDbRecord).toBeDefined();
      const dbKeys = Object.keys(rawDbRecord!);
      expect(dbKeys).toEqual(['id', 'eventType', 'source', 'createdAt']);
    });
  });

  describe('5. Resilience: Analytics Failure Must Not Block Navigation', () => {
    it('catches and handles analytics database failure non-fatally without throwing', async () => {
      // Temporarily mock prisma.analyticsEvent.create to simulate temporary DB outage
      const spy = vi.spyOn(prisma.analyticsEvent, 'create').mockRejectedValueOnce(
        new Error('Prisma connection pool exhausted')
      );

      // Must resolve without throwing to prevent trapping the customer
      const result = await trackGoogleReviewClickAction('table');
      expect(result).toEqual({ success: false });

      spy.mockRestore();
    });
  });
});
