import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { prisma } from '@/lib/db';
import {
  createOffer,
  getOfferById,
  updateOffer,
  deleteOffer,
  listActiveOffers,
  listAllOffers,
} from '@/lib/repositories/offer-repository';
import {
  getShopSettings,
  updateShopSettings,
} from '@/lib/repositories/shop-settings-repository';
import {
  CreateOfferInputSchema,
  UpdateOfferInputSchema,
  parseOfferExpiryDate,
} from '@/lib/validation/offer-schema';
import {
  ShopSettingsInputSchema,
  OpeningHourSlotSchema,
} from '@/lib/validation/shop-settings-schema';
import {
  createOfferAction,
  updateOfferAction,
  toggleOfferActiveAction,
  deleteOfferAction,
} from '@/lib/actions/offer-actions';
import { updateShopSettingsAction } from '@/lib/actions/settings-actions';
import { createAdminSession } from '@/lib/auth';

// Mock next/navigation and next/headers for server action auth tests
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

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Phase 10: Offers & Pharmacy Information Management Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Offers Management & Repository Layer', () => {
    let testOfferId: string;

    it('creates a valid offer with all supported fields', async () => {
      const offer = await createOffer({
        title: 'Phase 10 First Aid Kit Promotion',
        description: '15% discount on travel and home first aid essentials.',
        badge: '15% OFF',
        validUntil: new Date('2027-12-31T23:59:59.999Z'),
        isActive: true,
        sortOrder: 1,
      });

      testOfferId = offer.id;
      expect(offer).toBeDefined();
      expect(offer.title).toBe('Phase 10 First Aid Kit Promotion');
      expect(offer.badge).toBe('15% OFF');
      expect(offer.isActive).toBe(true);
      expect(offer.sortOrder).toBe(1);
      expect(offer.validUntil).toBeInstanceOf(Date);
    });

    it('retrieves an existing offer by ID', async () => {
      const found = await getOfferById(testOfferId);
      expect(found).not.toBeNull();
      expect(found?.id).toBe(testOfferId);
      expect(found?.title).toBe('Phase 10 First Aid Kit Promotion');
    });

    it('updates an existing offer without affecting other fields', async () => {
      const updated = await updateOffer(testOfferId, {
        title: 'Updated First Aid Promotion',
        badge: '20% OFF',
      });

      expect(updated).not.toBeNull();
      expect(updated?.title).toBe('Updated First Aid Promotion');
      expect(updated?.badge).toBe('20% OFF');
      // Description must remain intact from previous creation
      expect(updated?.description).toBe('15% discount on travel and home first aid essentials.');
      expect(updated?.sortOrder).toBe(1);
    });

    it('toggles isActive state accurately', async () => {
      const deactivated = await updateOffer(testOfferId, { isActive: false });
      expect(deactivated?.isActive).toBe(false);

      const reactivated = await updateOffer(testOfferId, { isActive: true });
      expect(reactivated?.isActive).toBe(true);
    });

    it('handles nonexistent offer updates safely by returning null', async () => {
      const result = await updateOffer('nonexistent-id-12345', { title: 'Ghost Offer' });
      expect(result).toBeNull();
    });

    it('deletes an offer permanently', async () => {
      const success = await deleteOffer(testOfferId);
      expect(success).toBe(true);

      const check = await getOfferById(testOfferId);
      expect(check).toBeNull();
    });

    it('returns false when deleting a nonexistent offer', async () => {
      const success = await deleteOffer('nonexistent-id-99999');
      expect(success).toBe(false);
    });
  });

  describe('2. Offer Validation & Schema Rules', () => {
    it('validates required title with length constraints', () => {
      expect(CreateOfferInputSchema.safeParse({ title: 'A' }).success).toBe(false); // < 2 chars
      expect(CreateOfferInputSchema.safeParse({ title: '' }).success).toBe(false);
      expect(CreateOfferInputSchema.safeParse({ title: '   ' }).success).toBe(false);
      expect(CreateOfferInputSchema.safeParse({ title: 'Valid Offer Title' }).success).toBe(true);
      expect(
        CreateOfferInputSchema.safeParse({
          title: 'x'.repeat(101),
        }).success
      ).toBe(false); // > 100 chars
    });

    it('preprocesses and converts empty strings to null for description and badge', () => {
      const parsed = CreateOfferInputSchema.parse({
        title: 'Wellness Deal',
        description: '',
        badge: '',
      });

      expect(parsed.description).toBeNull();
      expect(parsed.badge).toBeNull();
    });

    it('correctly handles YYYY-MM-DD date parsing to end-of-day UTC', () => {
      const parsedDate = parseOfferExpiryDate('2026-11-20');
      expect(parsedDate).toBeInstanceOf(Date);
      expect(parsedDate?.toISOString()).toBe('2026-11-20T23:59:59.999Z');

      expect(parseOfferExpiryDate('')).toBeNull();
      expect(parseOfferExpiryDate(null)).toBeNull();
      expect(parseOfferExpiryDate(undefined)).toBeUndefined();
    });

    it('coerces sortOrder and defaults to 0', () => {
      const parsed = CreateOfferInputSchema.parse({
        title: 'Priority Offer',
        sortOrder: 5,
      });
      expect(parsed.sortOrder).toBe(5);

      const defaultParsed = CreateOfferInputSchema.parse({
        title: 'Default Sort',
      });
      expect(defaultParsed.sortOrder).toBe(0);
    });
  });

  describe('3. Offer Visibility & Customer-Card Filtering', () => {
    let activeOfferId: string;
    let expiredOfferId: string;
    let inactiveOfferId: string;

    beforeEach(async () => {
      const o1 = await createOffer({
        title: 'Customer Active Valid Offer',
        validUntil: new Date('2029-01-01'),
        isActive: true,
        sortOrder: 1,
      });
      activeOfferId = o1.id;

      const o2 = await createOffer({
        title: 'Customer Expired Offer',
        validUntil: new Date('2020-01-01'), // Expired
        isActive: true,
        sortOrder: 2,
      });
      expiredOfferId = o2.id;

      const o3 = await createOffer({
        title: 'Customer Inactive Offer',
        validUntil: null,
        isActive: false, // Inactive
        sortOrder: 3,
      });
      inactiveOfferId = o3.id;
    });

    it('lists all offers for owner admin view regardless of status or expiration', async () => {
      const allOffers = await listAllOffers();
      const allIds = allOffers.map((o) => o.id);

      expect(allIds).toContain(activeOfferId);
      expect(allIds).toContain(expiredOfferId);
      expect(allIds).toContain(inactiveOfferId);
    });

    it('strictly hides expired and inactive offers from customer card view', async () => {
      const activeOffers = await listActiveOffers();
      const activeIds = activeOffers.map((o) => o.id);

      expect(activeIds).toContain(activeOfferId);
      expect(activeIds).not.toContain(expiredOfferId);
      expect(activeIds).not.toContain(inactiveOfferId);
    });

    it('maintains sort order ascending then createdAt descending for active offers', async () => {
      const activeOffers = await listActiveOffers();
      for (let i = 0; i < activeOffers.length - 1; i++) {
        expect(activeOffers[i].sortOrder).toBeLessThanOrEqual(activeOffers[i + 1].sortOrder);
      }
    });

    // Cleanup
    afterEach(async () => {
      await deleteOffer(activeOfferId);
      await deleteOffer(expiredOfferId);
      await deleteOffer(inactiveOfferId);
    });
  });

  describe('4. Offers Server Actions & Auth Enforcement', () => {
    it('redirects unauthenticated users trying to create an offer', async () => {
      const { cookies } = await import('next/headers');
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue(undefined),
      } as unknown as Awaited<ReturnType<typeof cookies>>);

      await expect(
        createOfferAction({
          title: 'Unauthenticated Offer Attempt',
        })
      ).rejects.toThrow('NEXT_REDIRECT:/admin/login?returnUrl=%2Fadmin%2Foffers');
    });

    it('allows authenticated admin to perform complete offer lifecycle via actions', async () => {
      const admin = await prisma.adminUser.findUnique({
        where: { username: 'admin' },
      });
      if (!admin) throw new Error('Seeded admin missing');

      const session = await createAdminSession(admin.id);

      const { cookies } = await import('next/headers');
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue({ value: session.rawToken }),
      } as unknown as Awaited<ReturnType<typeof cookies>>);

      // 1. Create offer
      const createRes = await createOfferAction({
        title: 'Action Lifecycle Offer',
        badge: 'NEW',
        sortOrder: 0,
      });
      expect(createRes.success).toBe(true);
      expect(createRes.offer).toBeDefined();
      const offerId = createRes.offer!.id;

      // 2. Update offer
      const updateRes = await updateOfferAction(offerId, {
        title: 'Action Lifecycle Offer Updated',
      });
      expect(updateRes.success).toBe(true);
      expect(updateRes.offer?.title).toBe('Action Lifecycle Offer Updated');

      // 3. Toggle status
      const toggleRes = await toggleOfferActiveAction(offerId);
      expect(toggleRes.success).toBe(true);
      expect(toggleRes.offer?.isActive).toBe(false);

      // 4. Delete offer
      const deleteRes = await deleteOfferAction(offerId);
      expect(deleteRes.success).toBe(true);
    });
  });

  describe('5. Pharmacy Information Management (ShopSettings)', () => {
    it('retrieves singleton shop settings without throwing', async () => {
      const settings = await getShopSettings();
      expect(settings).toBeDefined();
      expect(settings.id).toBe('default_shop');
      expect(settings.shopName).toBeTruthy();
    });

    it('updates pharmacy contact and location settings successfully', async () => {
      const updated = await updateShopSettings({
        shopName: 'Sanjivani Super Medical Store',
        tagline: 'Trusted Community Healthcare',
        phoneNumber: '+91 91234 56789',
        whatsappNumber: '+91 91234 56789',
        address: '101 Station Plaza, Hospital Crossing',
        googleMapsUrl: 'https://maps.google.com/?q=Sanjivani+Medical',
        googleReviewUrl: 'https://g.page/r/sanjivani/review',
        openingHours: [
          { days: 'Monday - Saturday', hours: '8:00 AM - 11:00 PM' },
          { days: 'Sunday', hours: 'Closed' },
        ],
        isEmergencyOpen: true,
      });

      expect(updated.shopName).toBe('Sanjivani Super Medical Store');
      expect(updated.tagline).toBe('Trusted Community Healthcare');
      expect(updated.phoneNumber).toBe('+91 91234 56789');
      expect(updated.whatsappNumber).toBe('+91 91234 56789');
      expect(updated.address).toBe('101 Station Plaza, Hospital Crossing');
      expect(updated.isEmergencyOpen).toBe(true);
      expect(updated.openingHours).toHaveLength(2);
      expect(updated.openingHours[1].hours).toBe('Closed');
    });

    it('allows clearing optional fields to null', async () => {
      const cleared = await updateShopSettings({
        shopName: 'Sanjivani Super Medical Store',
        tagline: null,
        phoneNumber: null,
        whatsappNumber: null,
        address: null,
        googleMapsUrl: null,
        googleReviewUrl: null,
        openingHours: [{ days: 'All Days', hours: '24 Hours' }],
        isEmergencyOpen: false,
      });

      expect(cleared.tagline).toBeNull();
      expect(cleared.phoneNumber).toBeNull();
      expect(cleared.whatsappNumber).toBeNull();
      expect(cleared.address).toBeNull();
      expect(cleared.googleMapsUrl).toBeNull();
      expect(cleared.googleReviewUrl).toBeNull();
      expect(cleared.isEmergencyOpen).toBe(false);
    });
  });

  describe('6. Settings Validation & URL Security Rules', () => {
    it('enforces required shop name', () => {
      expect(ShopSettingsInputSchema.safeParse({ shopName: '' }).success).toBe(false);
      expect(ShopSettingsInputSchema.safeParse({ shopName: '   ' }).success).toBe(false);
      expect(ShopSettingsInputSchema.safeParse({ shopName: 'A' }).success).toBe(false);
      expect(ShopSettingsInputSchema.safeParse({ shopName: 'Valid Pharmacy' }).success).toBe(true);
    });

    it('accepts safe HTTP and HTTPS URLs for Maps and Google Review', () => {
      const valid = ShopSettingsInputSchema.safeParse({
        shopName: 'Valid Shop',
        googleMapsUrl: 'https://maps.google.com/?q=pharmacy',
        googleReviewUrl: 'http://g.page/r/example/review',
      });
      expect(valid.success).toBe(true);
    });

    it('rejects unsafe protocols (javascript:, data:, file:) for Maps and Reviews', () => {
      const jsUrl = ShopSettingsInputSchema.safeParse({
        shopName: 'Exploit Shop',
        googleMapsUrl: 'javascript:alert(1)',
      });
      expect(jsUrl.success).toBe(false);

      const dataUrl = ShopSettingsInputSchema.safeParse({
        shopName: 'Exploit Shop',
        googleReviewUrl: 'data:text/html,<script>alert(1)</script>',
      });
      expect(dataUrl.success).toBe(false);

      const fileUrl = ShopSettingsInputSchema.safeParse({
        shopName: 'Exploit Shop',
        googleMapsUrl: 'file:///etc/passwd',
      });
      expect(fileUrl.success).toBe(false);
    });

    it('validates structured opening hour slots', () => {
      expect(
        OpeningHourSlotSchema.safeParse({
          days: 'Monday - Friday',
          hours: '9:00 AM - 9:00 PM',
        }).success
      ).toBe(true);

      expect(
        OpeningHourSlotSchema.safeParse({
          days: '',
          hours: 'Closed',
        }).success
      ).toBe(false);
    });
  });

  describe('7. Settings Server Actions & Authentication', () => {
    it('redirects unauthenticated users trying to update settings', async () => {
      const { cookies } = await import('next/headers');
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue(undefined),
      } as unknown as Awaited<ReturnType<typeof cookies>>);

      await expect(
        updateShopSettingsAction({
          shopName: 'Unauthenticated Update Attempt',
        })
      ).rejects.toThrow('NEXT_REDIRECT:/admin/login?returnUrl=%2Fadmin%2Fsettings');
    });

    it('allows authenticated admin to save settings via action', async () => {
      const admin = await prisma.adminUser.findUnique({
        where: { username: 'admin' },
      });
      if (!admin) throw new Error('Seeded admin missing');

      const session = await createAdminSession(admin.id);

      const { cookies } = await import('next/headers');
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue({ value: session.rawToken }),
      } as unknown as Awaited<ReturnType<typeof cookies>>);

      const res = await updateShopSettingsAction({
        shopName: 'Sanjivani Pharmacy Admin Verified',
        tagline: 'Healthcare You Can Trust',
        phoneNumber: '+91 98765 43210',
        whatsappNumber: '+91 98765 43210',
        address: 'Civil Hospital Road, City Center',
        googleMapsUrl: 'https://maps.google.com/?q=Sanjivani',
        googleReviewUrl: 'https://g.page/r/example/review',
        openingHours: [{ days: 'All Days', hours: '8:00 AM - 11:00 PM' }],
        isEmergencyOpen: true,
      });

      expect(res.success).toBe(true);
      expect(res.settings?.shopName).toBe('Sanjivani Pharmacy Admin Verified');
    });
  });
});
