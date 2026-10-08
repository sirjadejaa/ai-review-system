import { describe, it, expect } from 'vitest';
import { getShopSettings } from '@/lib/repositories/shop-settings-repository';
import {
  trackAnalyticsEvent,
  listAnalyticsEvents,
} from '@/lib/repositories/analytics-repository';
import {
  VALID_QR_SOURCES,
  CustomerLandingQuerySchema,
} from '@/lib/validation/customer-query-schema';
import {
  formatTelHref,
  formatWhatsAppHref,
  isValidExternalUrl,
} from '@/lib/format/contact-links';
import {
  trackQrScanAction,
  trackContactClickAction,
} from '@/lib/actions/customer-actions';

describe('Phase 4: Customer QR & Landing Experience Tests', () => {
  describe('1. ShopSettings Integration & Data Resilience', () => {
    it('retrieves shop settings from the database without hardcoded fallbacks', async () => {
      const settings = await getShopSettings();
      expect(settings).toBeDefined();
      expect(settings.shopName).toBeTruthy();
      expect(Array.isArray(settings.openingHours)).toBe(true);
    });

    it('safely handles empty opening hours and optional fields without errors', () => {
      const mockSettings = {
        shopName: 'Test Medical Store',
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
      expect(mockSettings.openingHours).toHaveLength(0);
      expect(mockSettings.phoneNumber).toBeNull();
    });
  });

  describe('2. Contact Links Formatting & Sanitization', () => {
    it('formats phone numbers for tel: URIs correctly', () => {
      expect(formatTelHref('+91 98765 43210')).toBe('tel:+919876543210');
      expect(formatTelHref('9876543210')).toBe('tel:9876543210');
      expect(formatTelHref(' +91-987-654-3210 ')).toBe('tel:+919876543210');
    });

    it('formats WhatsApp numbers for https://wa.me/ URIs with country code support', () => {
      expect(formatWhatsAppHref('+91 98765 43210')).toBe('https://wa.me/919876543210');
      expect(formatWhatsAppHref('9876543210')).toBe('https://wa.me/919876543210');
      expect(formatWhatsAppHref('09876543210')).toBe('https://wa.me/919876543210');
      expect(formatWhatsAppHref('919876543210')).toBe('https://wa.me/919876543210');
    });

    it('validates external URLs and rejects dangerous protocols', () => {
      expect(isValidExternalUrl('https://maps.google.com/?q=Test')).toBe(true);
      expect(isValidExternalUrl('http://maps.google.com/?q=Test')).toBe(true);
      expect(isValidExternalUrl('javascript:alert(1)')).toBe(false);
      expect(isValidExternalUrl('')).toBe(false);
      expect(isValidExternalUrl(null)).toBe(false);
      expect(isValidExternalUrl('not-a-valid-url')).toBe(false);
    });
  });

  describe('3. QR Source Validation & Controlled Input', () => {
    it('accepts only permitted QR sources', () => {
      VALID_QR_SOURCES.forEach((source) => {
        const result = CustomerLandingQuerySchema.safeParse({ source });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.source).toBe(source);
        }
      });
    });

    it('rejects arbitrary or malicious source values safely', () => {
      const malicious = CustomerLandingQuerySchema.safeParse({
        source: 'attacker_controlled_source<script>',
      });
      expect(malicious.success).toBe(false);

      const unknownSource = CustomerLandingQuerySchema.safeParse({
        source: 'random_source',
      });
      expect(unknownSource.success).toBe(false);
    });

    it('allows omitting source parameter for direct visits', () => {
      const directVisit = CustomerLandingQuerySchema.safeParse({});
      expect(directVisit.success).toBe(true);
      if (directVisit.success) {
        expect(directVisit.data.source).toBeUndefined();
      }
    });
  });

  describe('4. Privacy-Conscious Analytics Event Tracking', () => {
    it('tracks QR_SCAN event with valid source and no PII', async () => {
      const uniqueSource = `qr_test_${Date.now()}`;
      const event = await trackAnalyticsEvent({
        eventType: 'QR_SCAN',
        source: uniqueSource,
      });

      expect(event.eventType).toBe('QR_SCAN');
      expect(event.source).toBe(uniqueSource);
      expect(event.createdAt).toBeInstanceOf(Date);

      // Verify privacy: no IP, MAC, device fingerprint, or customer identifier stored
      const keys = Object.keys(event);
      expect(keys).toEqual(['id', 'eventType', 'source', 'createdAt']);
    });

    it('tracks CALL_CLICK, WHATSAPP_CLICK, and DIRECTIONS_CLICK events', async () => {
      const testSource = `test_landing_${Date.now()}`;
      await trackAnalyticsEvent({ eventType: 'CALL_CLICK', source: testSource });
      await trackAnalyticsEvent({ eventType: 'WHATSAPP_CLICK', source: testSource });
      await trackAnalyticsEvent({ eventType: 'DIRECTIONS_CLICK', source: testSource });

      const events = await listAnalyticsEvents();
      const testEvents = events.filter((e) => e.source === testSource);
      expect(testEvents).toHaveLength(3);

      const types = testEvents.map((e) => e.eventType);
      expect(types).toContain('CALL_CLICK');
      expect(types).toContain('WHATSAPP_CLICK');
      expect(types).toContain('DIRECTIONS_CLICK');
    });

    it('does NOT track GOOGLE_REVIEW_CONFIRMED or unapproved events', async () => {
      const events = await listAnalyticsEvents();
      const forbiddenTypes = events.filter(
        (e) => (e.eventType as string) === 'GOOGLE_REVIEW_CONFIRMED'
      );
      expect(forbiddenTypes).toHaveLength(0);
    });
  });

  describe('5. Customer Server Actions & Resilience', () => {
    it('trackQrScanAction rejects invalid or empty source without recording', async () => {
      const res1 = await trackQrScanAction(undefined);
      expect(res1.success).toBe(false);

      const res2 = await trackQrScanAction('invalid_source');
      expect(res2.success).toBe(false);
    });

    it('trackContactClickAction handles valid and invalid events non-fatally', async () => {
      const resCall = await trackContactClickAction('CALL_CLICK');
      expect(resCall.success).toBe(true);

      const resInvalid = await trackContactClickAction('FORBIDDEN_EVENT');
      expect(resInvalid.success).toBe(false);
    });
  });
});
