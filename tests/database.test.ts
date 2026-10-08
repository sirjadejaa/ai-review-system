import { describe, it, expect, beforeAll } from 'vitest';
import {
  getShopSettings,
  updateShopSettings,
  createFeedback,
  listFeedback,
  updateFeedbackStatus,
  createOffer,
  listActiveOffers,
  listAllOffers,
  deleteOffer,
  trackAnalyticsEvent,
  getAnalyticsSummary,
  getAdminUserByUsername,
  createAdminUser,
} from '@/lib/repositories';
import {
  ShopSettingsInputSchema,
  CreateFeedbackInputSchema,
  CreateOfferInputSchema,
  TrackAnalyticsEventSchema,
  CreateAdminUserInputSchema,
} from '@/lib/validation';

describe('Phase 2: Database & Core Architecture Tests', () => {
  describe('1. ShopSettings Repository & Singleton Constraint', () => {
    it('retrieves singleton shop settings without throwing', async () => {
      const settings = await getShopSettings();
      expect(settings).toBeDefined();
      expect(settings.id).toBe('default_shop');
      expect(settings.shopName).toBeTruthy();
      expect(Array.isArray(settings.openingHours)).toBe(true);
    });

    it('updates shop settings successfully', async () => {
      const updated = await updateShopSettings({
        shopName: 'Updated Sanjivani Pharmacy',
        tagline: 'Trusted neighborhood medical shop',
        phoneNumber: '+91 99999 88888',
        whatsappNumber: '+91 99999 88888',
        address: 'Main Market Road',
        googleMapsUrl: 'https://maps.google.com/?q=pharmacy',
        googleReviewUrl: 'https://g.page/r/example/review',
        openingHours: [{ days: 'All Days', hours: '8:00 AM - 10:00 PM' }],
        isEmergencyOpen: true,
      });

      expect(updated.shopName).toBe('Updated Sanjivani Pharmacy');
      expect(updated.isEmergencyOpen).toBe(true);
      expect(updated.openingHours[0].days).toBe('All Days');
    });

    it('rejects invalid empty shop name via validation schema', () => {
      expect(() =>
        ShopSettingsInputSchema.parse({
          shopName: '',
          openingHours: [],
          isEmergencyOpen: false,
        })
      ).toThrow();
    });
  });

  describe('2. Customer Feedback Repository & Privacy Boundary', () => {
    it('creates feedback with valid rating (1-5) and tags', async () => {
      const fb = await createFeedback({
        rating: 5,
        tags: ['Quick Service', 'Medicines in Stock'],
        notes: 'Great customer care and quick billing.',
        customerContact: 'voluntary@example.com',
      });

      expect(fb.id).toBeDefined();
      expect(fb.rating).toBe(5);
      expect(fb.status).toBe('NEW');
      expect(fb.tags).toContain('Quick Service');
      expect(fb.notes).toBe('Great customer care and quick billing.');
    });

    it('supports voluntary nullable customerContact and notes', async () => {
      const fb = await createFeedback({
        rating: 4,
        tags: ['Helpful Staff'],
      });

      expect(fb.notes).toBeNull();
      expect(fb.customerContact).toBeNull();
    });

    it('updates feedback status through controlled lifecycle', async () => {
      const fb = await createFeedback({
        rating: 2,
        tags: ['Waiting Time'],
        notes: 'Crowded on Sunday evening.',
      });

      const reviewed = await updateFeedbackStatus(fb.id, 'REVIEWED');
      expect(reviewed?.status).toBe('REVIEWED');

      const resolved = await updateFeedbackStatus(fb.id, 'RESOLVED');
      expect(resolved?.status).toBe('RESOLVED');
    });

    it('rejects ratings below 1 or above 5', () => {
      expect(() =>
        CreateFeedbackInputSchema.parse({
          rating: 0,
          tags: [],
        })
      ).toThrow();

      expect(() =>
        CreateFeedbackInputSchema.parse({
          rating: 6,
          tags: [],
        })
      ).toThrow();
    });
  });

  describe('3. Promotional Offers Repository', () => {
    let createdOfferId: string;

    it('creates and lists active offers in sort order', async () => {
      const offer1 = await createOffer({
        title: 'Senior Citizen Discount Special',
        description: '10% discount on all regular medicines',
        badge: 'SPECIAL',
        isActive: true,
        sortOrder: 1,
      });
      createdOfferId = offer1.id;

      const offer2 = await createOffer({
        title: 'Expired Clearance Offer',
        description: 'Old seasonal batch',
        validUntil: new Date('2020-01-01'), // past date
        isActive: true,
        sortOrder: 2,
      });

      const activeOffers = await listActiveOffers();
      const activeTitles = activeOffers.map((o) => o.title);

      // Active offer with no expiry must be included
      expect(activeTitles).toContain('Senior Citizen Discount Special');
      // Expired offer must be filtered out of active customer list
      expect(activeTitles).not.toContain('Expired Clearance Offer');

      // Cleanup
      await deleteOffer(offer2.id);
    });

    it('deletes an offer cleanly', async () => {
      const deleted = await deleteOffer(createdOfferId);
      expect(deleted).toBe(true);
    });

    it('rejects empty title via schema', () => {
      expect(() =>
        CreateOfferInputSchema.parse({
          title: '',
        })
      ).toThrow();
    });
  });

  describe('4. Analytics Event Repository & Privacy Principle', () => {
    it('tracks allowed event types without storing invasive data', async () => {
      const event = await trackAnalyticsEvent({
        eventType: 'GOOGLE_REVIEW_CLICK',
        source: 'QR',
      });

      expect(event.id).toBeDefined();
      expect(event.eventType).toBe('GOOGLE_REVIEW_CLICK');
      expect(event.source).toBe('QR');
    });

    it('aggregates summary metrics accurately', async () => {
      await trackAnalyticsEvent({ eventType: 'QR_SCAN', source: 'COUNTER_CARD' });
      await trackAnalyticsEvent({ eventType: 'CALL_CLICK', source: 'DIGITAL_CARD' });

      const summary = await getAnalyticsSummary();
      expect(summary.totalScans).toBeGreaterThanOrEqual(1);
      expect(summary.callClicks).toBeGreaterThanOrEqual(1);
    });

    it('rejects unsupported speculative analytics event types', () => {
      expect(() =>
        TrackAnalyticsEventSchema.parse({
          eventType: 'UNAUTHORIZED_SPY_EVENT',
        })
      ).toThrow();
    });
  });

  describe('5. AdminUser Repository Foundation', () => {
    it('retrieves seeded admin user and checks password hash', async () => {
      const admin = await getAdminUserByUsername('admin');
      expect(admin).toBeDefined();
      expect(admin?.username).toBe('admin');
      expect(admin?.passwordHash).toBeDefined();
      // Verifies password hash is NOT plaintext
      expect(admin?.passwordHash.startsWith('$2')).toBe(true);
    });

    it('enforces username uniqueness constraint', async () => {
      await expect(
        createAdminUser({
          username: 'admin', // already exists
          passwordHash: '$2a$10$anotherhash1234567890123456789012',
        })
      ).rejects.toThrow();
    });

    it('validates username formatting rules', () => {
      expect(() =>
        CreateAdminUserInputSchema.parse({
          username: 'ab', // too short (< 3)
          passwordHash: 'valid_hash_string_here_123',
        })
      ).toThrow();

      expect(() =>
        CreateAdminUserInputSchema.parse({
          username: 'invalid user with spaces',
          passwordHash: 'valid_hash_string_here_123',
        })
      ).toThrow();
    });
  });
});
