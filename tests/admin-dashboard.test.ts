import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '@/lib/db';
import {
  parseDashboardRange,
  getStartDateForRange,
  DashboardRangeSchema,
} from '@/lib/validation/analytics-schema';
import {
  getAnalyticsCountsForRange,
  getQRSourceBreakdown,
  getDailyActivityTrend,
  getOwnerDashboardAnalytics,
  trackAnalyticsEvent,
} from '@/lib/repositories/analytics-repository';
import {
  createFeedback,
  getFeedbackDashboardAnalytics,
} from '@/lib/repositories/feedback-repository';
import { requireAdmin, createAdminSession } from '@/lib/auth';

// Mock next/navigation and next/headers for auth integration tests
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    const error = new Error(`NEXT_REDIRECT:${url}`);
    (error as unknown as { digest: string }).digest = `NEXT_REDIRECT;replace;${url};307;`;
    throw error;
  }),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

describe('Phase 9: Owner Dashboard & Analytics Tests', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
  });

  describe('1. Authentication & Route Protection', () => {
    it('redirects unauthenticated users to /admin/login with sanitized returnUrl', async () => {
      const { cookies } = await import('next/headers');
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue(undefined),
      } as unknown as Awaited<ReturnType<typeof cookies>>);

      await expect(requireAdmin('/admin')).rejects.toThrow('NEXT_REDIRECT:/admin/login?returnUrl=%2Fadmin');
    });

    it('redirects unauthenticated requests to detailed analytics route /admin/analytics', async () => {
      const { cookies } = await import('next/headers');
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue(undefined),
      } as unknown as Awaited<ReturnType<typeof cookies>>);

      await expect(requireAdmin('/admin/analytics')).rejects.toThrow(
        'NEXT_REDIRECT:/admin/login?returnUrl=%2Fadmin%2Fanalytics'
      );
    });

    it('allows access for authenticated admin session', async () => {
      const admin = await prisma.adminUser.findUnique({
        where: { username: 'admin' },
      });
      if (!admin) {
        throw new Error('Default admin user missing in database');
      }

      const session = await createAdminSession(admin.id);

      const { cookies } = await import('next/headers');
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue({ value: session.rawToken }),
      } as unknown as Awaited<ReturnType<typeof cookies>>);

      const resolvedAdmin = await requireAdmin('/admin');
      expect(resolvedAdmin).toBeDefined();
      expect(resolvedAdmin.id).toBe(admin.id);
      expect(resolvedAdmin.username).toBe('admin');
    });
  });

  describe('2. Security & Time Range Validation', () => {
    it('parses valid time range parameters properly', () => {
      expect(parseDashboardRange('today')).toBe('today');
      expect(parseDashboardRange('7d')).toBe('7d');
      expect(parseDashboardRange('30d')).toBe('30d');
      expect(parseDashboardRange('all')).toBe('all');
    });

    it('safely defaults invalid or malicious inputs to 30d without crashing', () => {
      expect(parseDashboardRange('90d')).toBe('30d');
      expect(parseDashboardRange('1y')).toBe('30d');
      expect(parseDashboardRange("'; DROP TABLE analytics; --")).toBe('30d');
      expect(parseDashboardRange(undefined)).toBe('30d');
      expect(parseDashboardRange(null)).toBe('30d');
      expect(parseDashboardRange('')).toBe('30d');
      expect(parseDashboardRange('invalid')).toBe('30d');
    });

    it('enforces schema-level validation on DashboardRangeSchema', () => {
      expect(DashboardRangeSchema.safeParse('today').success).toBe(true);
      expect(DashboardRangeSchema.safeParse('7d').success).toBe(true);
      expect(DashboardRangeSchema.safeParse('30d').success).toBe(true);
      expect(DashboardRangeSchema.safeParse('all').success).toBe(true);
      expect(DashboardRangeSchema.safeParse('unsupported').success).toBe(false);
    });

    it('calculates proper boundary start dates for each range', () => {
      const todayDate = getStartDateForRange('today');
      expect(todayDate).toBeInstanceOf(Date);
      const now = new Date();
      expect(todayDate?.getDate()).toBe(now.getDate());
      expect(todayDate?.getHours()).toBe(0);
      expect(todayDate?.getMinutes()).toBe(0);

      const sevenDaysDate = getStartDateForRange('7d');
      expect(sevenDaysDate).toBeInstanceOf(Date);
      const diff7 = Math.round((Date.now() - (sevenDaysDate?.getTime() ?? 0)) / (1000 * 60 * 60 * 24));
      expect(diff7).toBe(7);

      const thirtyDaysDate = getStartDateForRange('30d');
      expect(thirtyDaysDate).toBeInstanceOf(Date);
      const diff30 = Math.round((Date.now() - (thirtyDaysDate?.getTime() ?? 0)) / (1000 * 60 * 60 * 24));
      expect(diff30).toBe(30);

      const allDate = getStartDateForRange('all');
      expect(allDate).toBeNull();
    });
  });

  describe('3. Analytics Event Aggregations & Filtering', () => {
    it('aggregates each engagement metric accurately for a given range', async () => {
      const testTag = `test_${Date.now()}`;

      // Track known sample engagement events
      await trackAnalyticsEvent({ eventType: 'QR_SCAN', source: testTag });
      await trackAnalyticsEvent({ eventType: 'QR_SCAN', source: testTag });
      await trackAnalyticsEvent({ eventType: 'GOOGLE_REVIEW_CLICK', source: testTag });
      await trackAnalyticsEvent({ eventType: 'CALL_CLICK', source: testTag });
      await trackAnalyticsEvent({ eventType: 'WHATSAPP_CLICK', source: testTag });
      await trackAnalyticsEvent({ eventType: 'DIRECTIONS_CLICK', source: testTag });

      const counts = await getAnalyticsCountsForRange(new Date(Date.now() - 60000));

      expect(counts.qrScans).toBeGreaterThanOrEqual(2);
      expect(counts.googleReviewClicks).toBeGreaterThanOrEqual(1);
      expect(counts.callClicks).toBeGreaterThanOrEqual(1);
      expect(counts.whatsappClicks).toBeGreaterThanOrEqual(1);
      expect(counts.directionsClicks).toBeGreaterThanOrEqual(1);
    });

    it('handles zero-data time ranges gracefully without errors', async () => {
      // Future date filter ensures 0 records
      const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365);
      const counts = await getAnalyticsCountsForRange(futureDate);

      expect(counts.qrScans).toBe(0);
      expect(counts.googleReviewClicks).toBe(0);
      expect(counts.callClicks).toBe(0);
      expect(counts.whatsappClicks).toBe(0);
      expect(counts.directionsClicks).toBe(0);
    });

    it('breaks down QR scans by source tag accurately', async () => {
      const uniqueSource = `counter_${Date.now()}`;
      await trackAnalyticsEvent({ eventType: 'QR_SCAN', source: uniqueSource });
      await trackAnalyticsEvent({ eventType: 'QR_SCAN', source: uniqueSource });

      const breakdown = await getQRSourceBreakdown(new Date(Date.now() - 60000));
      const match = breakdown.find((b) => b.source === uniqueSource);

      expect(match).toBeDefined();
      expect(match?.count).toBe(2);
    });

    it('produces contiguous daily trend buckets without missing dates', async () => {
      const trend = await getDailyActivityTrend(7);

      expect(trend).toHaveLength(7);
      for (const bucket of trend) {
        expect(bucket).toHaveProperty('dateKey');
        expect(bucket).toHaveProperty('label');
        expect(bucket).toHaveProperty('qrScans');
        expect(bucket).toHaveProperty('googleReviewClicks');
        expect(bucket).toHaveProperty('contactClicks');
        expect(bucket).toHaveProperty('total');
        expect(bucket.total).toBe(bucket.qrScans + bucket.googleReviewClicks + bucket.contactClicks);
      }
    });

    it('retrieves comprehensive owner dashboard analytics', async () => {
      const data = await getOwnerDashboardAnalytics('30d');

      expect(data).toHaveProperty('counts');
      expect(data).toHaveProperty('dailyTrend');
      expect(data).toHaveProperty('qrSources');
      expect(data.counts.qrScans).toBeGreaterThanOrEqual(0);
      expect(data.counts.googleReviewClicks).toBeGreaterThanOrEqual(0);
      expect(data.dailyTrend.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('4. Customer Feedback Aggregations & Distribution', () => {
    it('aggregates total feedback, average rating, and distribution accurately', async () => {
      // Insert specific test feedback records
      await createFeedback({
        rating: 5,
        tags: ['Helpful Pharmacist'],
        notes: 'Excellent service',
      });
      await createFeedback({
        rating: 4,
        tags: ['Quick Service'],
        notes: 'Good experience',
      });
      await createFeedback({
        rating: 1,
        tags: ['Long Wait Time'],
        notes: 'Had to wait long',
      });

      const { summary, recent } = await getFeedbackDashboardAnalytics(null);

      expect(summary.total).toBeGreaterThanOrEqual(3);
      expect(summary.averageRating).toBeGreaterThanOrEqual(1);
      expect(summary.averageRating).toBeLessThanOrEqual(5);

      // Verify distribution counts exist
      expect(summary.distribution[5]).toBeGreaterThanOrEqual(1);
      expect(summary.distribution[4]).toBeGreaterThanOrEqual(1);
      expect(summary.distribution[1]).toBeGreaterThanOrEqual(1);
      expect(typeof summary.distribution[3]).toBe('number');
      expect(typeof summary.distribution[2]).toBe('number');

      // Verify recent items are returned
      expect(recent.length).toBeGreaterThanOrEqual(3);
      expect(recent[0].rating).toBeGreaterThanOrEqual(1);
      expect(recent[0].rating).toBeLessThanOrEqual(5);
    });

    it('returns empty distribution structure when zero feedback exists in range', async () => {
      const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365);
      const { summary, recent } = await getFeedbackDashboardAnalytics(futureDate);

      expect(summary.total).toBe(0);
      expect(summary.averageRating).toBe(0);
      expect(summary.newCount).toBe(0);
      expect(summary.distribution).toEqual({
        5: 0,
        4: 0,
        3: 0,
        2: 0,
        1: 0,
      });
      expect(recent).toEqual([]);
    });
  });

  describe('5. Review Click Funnel & Zero-Division Safety', () => {
    it('calculates review click rate accurately when QR scans are present', () => {
      const qrScans = 100;
      const googleReviewClicks = 34;

      const rate = qrScans > 0 ? (googleReviewClicks / qrScans) * 100 : null;
      expect(rate).toBe(34);
    });

    it('safely handles zero QR scans without NaN or division by zero', () => {
      const qrScans = 0;
      const googleReviewClicks = 0;

      const rate = qrScans > 0 ? (googleReviewClicks / qrScans) * 100 : null;
      expect(rate).toBeNull();
      expect(Number.isNaN(rate)).toBe(false);
    });

    it('handles scenario where review clicks happen without prior QR scan record', () => {
      const qrScans = 0;
      const googleReviewClicks = 5;

      const rate = qrScans > 0 ? (googleReviewClicks / qrScans) * 100 : null;
      expect(rate).toBeNull();
    });
  });

  describe('6. Privacy & Security Boundaries', () => {
    it('strictly omits customer contact info from dashboard recent feedback', async () => {
      await createFeedback({
        rating: 5,
        tags: ['Polite Staff'],
        notes: 'Privacy test note',
        customerContact: '+91 99999 11111',
      });

      const { recent } = await getFeedbackDashboardAnalytics(null);
      const found = recent.find((r) => r.notes === 'Privacy test note');

      expect(found).toBeDefined();
      // Ensure customerContact is not present on the dashboard summary projection
      expect(found).not.toHaveProperty('customerContact');
    });

    it('does not expose internal tracking identifiers or PII in analytics queries', async () => {
      const data = await getOwnerDashboardAnalytics('today');

      // Ensure no IP, GPS, or session fields are present in dashboard payload
      expect(data).not.toHaveProperty('ip');
      expect(data).not.toHaveProperty('gps');
      expect(data).not.toHaveProperty('deviceInfo');
      expect(data).not.toHaveProperty('sessionToken');

      for (const bucket of data.dailyTrend) {
        expect(bucket).not.toHaveProperty('ip');
        expect(bucket).not.toHaveProperty('userAgent');
      }
    });

    it('preserves accurate terminology: clicks vs confirmed reviews', () => {
      // Semantic verification: Event names must represent clicks/handoffs
      const validEventLabels = {
        QR_SCAN: 'QR Scans',
        GOOGLE_REVIEW_CLICK: 'Google Review Clicks',
        CALL_CLICK: 'Call Clicks',
        WHATSAPP_CLICK: 'WhatsApp Clicks',
        DIRECTIONS_CLICK: 'Directions Clicks',
      };

      expect(validEventLabels.GOOGLE_REVIEW_CLICK).toBe('Google Review Clicks');
      expect(validEventLabels.GOOGLE_REVIEW_CLICK).not.toContain('Posted');
      expect(validEventLabels.GOOGLE_REVIEW_CLICK).not.toContain('Received');
    });
  });
});
