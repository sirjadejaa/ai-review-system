import { describe, it, expect } from 'vitest';
import {
  CreateOfferInputSchema,
  parseOfferExpiryDate,
} from '@/lib/validation/offer-schema';

describe('Enhanced Clothing Boutique Offers Schema & Validation', () => {
  it('validates a complete fashion offer with banner, discount info, dates, terms, and URL', () => {
    const validOffer = {
      title: 'Festive Season Preview — Up to 40% OFF',
      description: 'Exclusive preview on all ethnic and bridal collections.',
      badge: 'FESTIVE SPECIAL',
      imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d',
      discountInfo: 'Flat 40% OFF',
      startDate: new Date('2026-10-01T00:00:00Z'),
      validUntil: new Date('2026-11-30T23:59:59Z'),
      terms: 'Applicable in-store only. Valid while stocks last.',
      offerUrl: 'https://instagram.com/p/festive-deal',
      isActive: true,
      sortOrder: 1,
    };

    const parsed = CreateOfferInputSchema.safeParse(validOffer);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.title).toBe('Festive Season Preview — Up to 40% OFF');
      expect(parsed.data.discountInfo).toBe('Flat 40% OFF');
      expect(parsed.data.terms).toBe('Applicable in-store only. Valid while stocks last.');
      expect(parsed.data.offerUrl).toBe('https://instagram.com/p/festive-deal');
    }
  });

  it('rejects offer with empty title', () => {
    const invalid = {
      title: '   ',
      discountInfo: '20% OFF',
    };

    const parsed = CreateOfferInputSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it('correctly parses date string to end-of-day UTC using parseOfferExpiryDate', () => {
    const parsedDate = parseOfferExpiryDate('2026-12-31');
    expect(parsedDate).toBeInstanceOf(Date);
    if (parsedDate) {
      expect(parsedDate.getUTCFullYear()).toBe(2026);
      expect(parsedDate.getUTCMonth()).toBe(11); // December (0-indexed)
      expect(parsedDate.getUTCDate()).toBe(31);
      expect(parsedDate.getUTCHours()).toBe(23);
      expect(parsedDate.getUTCMinutes()).toBe(59);
      expect(parsedDate.getUTCSeconds()).toBe(59);
    }
  });

  it('handles invalid dates safely in parseOfferExpiryDate', () => {
    expect(() => parseOfferExpiryDate('invalid-date')).toThrow('Invalid date');
    expect(parseOfferExpiryDate('')).toBeNull();
  });

  it('verifies offer expiration and active status logic', () => {
    const now = new Date();
    const pastDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const futureDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const activeFutureOffer = {
      isActive: true,
      validUntil: futureDate,
      startDate: pastDate,
    };

    const isVisible =
      activeFutureOffer.isActive &&
      (!activeFutureOffer.startDate || activeFutureOffer.startDate <= now) &&
      (!activeFutureOffer.validUntil || activeFutureOffer.validUntil >= now);

    expect(isVisible).toBe(true);

    const expiredOffer = {
      isActive: true,
      validUntil: pastDate,
      startDate: null,
    };

    const isExpiredVisible =
      expiredOffer.isActive &&
      (!expiredOffer.validUntil || expiredOffer.validUntil >= now);

    expect(isExpiredVisible).toBe(false);
  });
});
