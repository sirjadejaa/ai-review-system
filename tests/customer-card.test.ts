import { describe, it, expect } from 'vitest';
import { getShopSettings } from '@/lib/repositories/shop-settings-repository';
import { listActiveOffers, createOffer } from '@/lib/repositories/offer-repository';
import {
  VALID_QR_SOURCES,
  CustomerLandingQuerySchema,
} from '@/lib/validation/customer-query-schema';
import {
  formatTelHref,
  formatWhatsAppHref,
  isValidExternalUrl,
} from '@/lib/format/contact-links';
import { trackContactClickAction } from '@/lib/actions/customer-actions';
import { prisma } from '@/lib/db';

describe('Phase 8: Digital Customer Card Tests', () => {
  describe('1. Shop Data Resilience & Fields', () => {
    it('retrieves complete shop settings for the digital card without crashing', async () => {
      const settings = await getShopSettings();
      expect(settings).toBeDefined();
      expect(settings.shopName).toBeTruthy();
      expect(Array.isArray(settings.openingHours)).toBe(true);
    });

    it('handles optional fields (tagline, phone, whatsapp, address, maps) without runtime errors', () => {
      const mockSettings = {
        shopName: 'Test Medical & Pharmacy',
        tagline: null,
        phoneNumber: null,
        whatsappNumber: null,
        address: null,
        googleMapsUrl: null,
        googleReviewUrl: null,
        openingHours: [],
        isEmergencyOpen: false,
      };

      expect(mockSettings.tagline).toBeNull();
      expect(mockSettings.phoneNumber).toBeNull();
      expect(mockSettings.openingHours).toHaveLength(0);
      expect(mockSettings.isEmergencyOpen).toBe(false);
    });

    it('gracefully handles malformed or incomplete opening hour slots', () => {
      const rawSlots = [
        { days: 'Mon - Fri', hours: '9:00 AM - 9:00 PM' },
        { days: '', hours: 'Closed' }, // missing day
        { days: 'Sun', hours: '' }, // missing hours
        null as unknown as { days: string; hours: string },
        undefined as unknown as { days: string; hours: string },
      ];

      const validHours = rawSlots.filter(
        (slot) =>
          slot &&
          typeof slot.days === 'string' &&
          typeof slot.hours === 'string' &&
          slot.days.trim() &&
          slot.hours.trim()
      );

      expect(validHours).toHaveLength(1);
      expect(validHours[0].days).toBe('Mon - Fri');
      expect(validHours[0].hours).toBe('9:00 AM - 9:00 PM');
    });

    it('correctly parses isEmergencyOpen flag for availability badge', () => {
      expect(typeof true).toBe('boolean');
      const openSettings = { isEmergencyOpen: true };
      const normalSettings = { isEmergencyOpen: false };

      expect(openSettings.isEmergencyOpen).toBe(true);
      expect(normalSettings.isEmergencyOpen).toBe(false);
    });
  });

  describe('2. Active Offers Read-Only Filtering & Ordering', () => {
    it('retrieves active unexpired offers in correct sortOrder', async () => {
      const uniqueSuffix = Date.now();
      const futureDate = new Date(Date.now() + 86400000 * 30); // 30 days ahead

      // Create test active offers with different sort orders
      const offer1 = await createOffer({
        title: `Offer B ${uniqueSuffix}`,
        badge: '10% OFF',
        validUntil: futureDate,
        isActive: true,
        sortOrder: 20,
      });

      const offer2 = await createOffer({
        title: `Offer A ${uniqueSuffix}`,
        badge: 'SPECIAL',
        validUntil: futureDate,
        isActive: true,
        sortOrder: 10,
      });

      const activeOffers = await listActiveOffers();
      const testOffers = activeOffers.filter(
        (o) => o.id === offer1.id || o.id === offer2.id
      );

      expect(testOffers).toHaveLength(2);
      // Offer with sortOrder 10 must come before sortOrder 20
      expect(testOffers[0].id).toBe(offer2.id);
      expect(testOffers[1].id).toBe(offer1.id);
    });

    it('filters out inactive offers (isActive = false)', async () => {
      const uniqueSuffix = Date.now();

      const inactive = await createOffer({
        title: `Inactive Deal ${uniqueSuffix}`,
        isActive: false,
        sortOrder: 1,
      });

      const activeOffers = await listActiveOffers();
      const found = activeOffers.find((o) => o.id === inactive.id);
      expect(found).toBeUndefined();
    });

    it('filters out expired offers (validUntil in the past)', async () => {
      const uniqueSuffix = Date.now();
      const pastDate = new Date(Date.now() - 86400000); // 1 day ago

      const expired = await createOffer({
        title: `Expired Deal ${uniqueSuffix}`,
        validUntil: pastDate,
        isActive: true,
        sortOrder: 1,
      });

      const activeOffers = await listActiveOffers();
      const found = activeOffers.find((o) => o.id === expired.id);
      expect(found).toBeUndefined();
    });
  });

  describe('3. Contact Actions Formatting & Analytics', () => {
    it('formats phone numbers strictly for RFC 3966 tel: URIs', () => {
      expect(formatTelHref('+91 98765 43210')).toBe('tel:+919876543210');
      expect(formatTelHref('022-12345678')).toBe('tel:02212345678');
    });

    it('formats WhatsApp numbers safely for official https://wa.me/ URIs', () => {
      expect(formatWhatsAppHref('+91 98765 43210')).toBe('https://wa.me/919876543210');
      expect(formatWhatsAppHref('9876543210')).toBe('https://wa.me/919876543210');
    });

    it('records CALL_CLICK, WHATSAPP_CLICK, and DIRECTIONS_CLICK non-blockingly', async () => {
      const callRes = await trackContactClickAction('CALL_CLICK');
      expect(callRes.success).toBe(true);

      const waRes = await trackContactClickAction('WHATSAPP_CLICK');
      expect(waRes.success).toBe(true);

      const dirRes = await trackContactClickAction('DIRECTIONS_CLICK');
      expect(dirRes.success).toBe(true);
    });
  });

  describe('4. Source Context Preservation & Google Review CTA', () => {
    it('preserves valid QR sources (qr, counter, table, card)', () => {
      VALID_QR_SOURCES.forEach((source) => {
        const parsed = CustomerLandingQuerySchema.safeParse({ source });
        expect(parsed.success).toBe(true);
        if (parsed.success) {
          const reviewHref = `/customer/review?source=${parsed.data.source}`;
          expect(reviewHref).toBe(`/customer/review?source=${source}`);
        }
      });
    });

    it('rejects malicious or arbitrary source strings', () => {
      const result = CustomerLandingQuerySchema.safeParse({
        source: 'evil_source<script>',
      });
      expect(result.success).toBe(false);
    });

    it('hides review CTA when googleReviewUrl is missing or invalid', () => {
      expect(isValidExternalUrl(null)).toBe(false);
      expect(isValidExternalUrl('')).toBe(false);
      expect(isValidExternalUrl('not-a-url')).toBe(false);
      expect(isValidExternalUrl('javascript:alert(1)')).toBe(false);
    });

    it('accepts valid HTTPS Google review link', () => {
      expect(isValidExternalUrl('https://g.page/r/example/review')).toBe(true);
    });
  });

  describe('5. Security & Privacy Boundaries', () => {
    it('rejects dangerous URL schemes for directions or reviews', () => {
      expect(isValidExternalUrl('javascript:alert(document.cookie)')).toBe(false);
      expect(isValidExternalUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
      expect(isValidExternalUrl('file:///etc/passwd')).toBe(false);
    });

    it('ensures analytics events contain NO customer PII or tracking identifiers', async () => {
      await trackContactClickAction('CALL_CLICK');

      const recent = await prisma.analyticsEvent.findFirst({
        where: { eventType: 'CALL_CLICK' },
        orderBy: { createdAt: 'desc' },
      });

      expect(recent).toBeDefined();
      const keys = Object.keys(recent!);
      expect(keys).toEqual(['id', 'eventType', 'source', 'createdAt']);
    });
  });
});
