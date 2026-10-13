import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  HEALTHCARE_COLOR_PRESETS,
  DEFAULT_PRIMARY_COLOR,
  DEFAULT_SECONDARY_COLOR,
  DEFAULT_ACCENT_COLOR,
  hexToRgb,
  adjustBrightness,
  generateThemeCss,
} from '@/lib/branding/theme';
import {
  ShopSettingsInputSchema,
} from '@/lib/validation/shop-settings-schema';
import {
  getShopSettings,
  updateShopSettings,
} from '@/lib/repositories/shop-settings-repository';
import {
  updateShopSettingsAction,
  uploadPharmacyLogoAction,
} from '@/lib/actions/settings-actions';
import { prisma } from '@/lib/db';
import { createAdminSession } from '@/lib/auth';

// Mock next/navigation and next/headers for server action tests
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    const error = new Error(`NEXT_REDIRECT:${url}`);
    (error as unknown as { digest: string }).digest = `NEXT_REDIRECT;replace;${url};307;`;
    throw error;
  }),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
  headers: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Custom Healthcare Branding & Pharmacy Configuration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Healthcare Color Palettes & Dynamic Theme Generator', () => {
    it('provides all 5 clinically vetted healthcare color presets with valid hex values', () => {
      expect(HEALTHCARE_COLOR_PRESETS).toHaveLength(5);

      const hexRegex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
      for (const preset of HEALTHCARE_COLOR_PRESETS) {
        expect(preset.id).toBeTruthy();
        expect(preset.name).toBeTruthy();
        expect(preset.description).toBeTruthy();
        expect(hexRegex.test(preset.primary)).toBe(true);
        expect(hexRegex.test(preset.secondary)).toBe(true);
        expect(hexRegex.test(preset.accent)).toBe(true);
      }
    });

    it('correctly converts valid hex strings to RGB components', () => {
      expect(hexToRgb('#123e35')).toEqual({ r: 18, g: 62, b: 53 });
      expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 });
      expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
      expect(hexToRgb('invalid')).toBeNull();
      expect(hexToRgb('')).toBeNull();
    });

    it('adjusts color brightness up and down with saturation clamping', () => {
      const original = '#123e35';
      const brightened = adjustBrightness(original, 20);
      const darkened = adjustBrightness(original, -20);

      expect(brightened).not.toBe(original);
      expect(darkened).not.toBe(original);
      expect(brightened.startsWith('#')).toBe(true);
      expect(darkened.startsWith('#')).toBe(true);
    });

    it('generates complete :root CSS variables injecting brand colors and derived tints', () => {
      const css = generateThemeCss({
        primaryColor: '#0f4c5c',
        secondaryColor: '#3b7a8c',
        accentColor: '#7bc4c4',
      });

      expect(css).toContain(':root');
      expect(css).toContain('--color-primary: #0f4c5c;');
      expect(css).toContain('--color-secondary: #3b7a8c;');
      expect(css).toContain('--color-accent: #7bc4c4;');
      expect(css).toContain('--color-primary-rgb: 15, 76, 92;');
      expect(css).toContain('--color-primary-hover:');
      expect(css).toContain('--color-primary-subtle:');
    });

    it('falls back to default healthcare colors when custom colors are omitted', () => {
      const css = generateThemeCss({});

      expect(css).toContain(`--color-primary: ${DEFAULT_PRIMARY_COLOR};`);
      expect(css).toContain(`--color-secondary: ${DEFAULT_SECONDARY_COLOR};`);
      expect(css).toContain(`--color-accent: ${DEFAULT_ACCENT_COLOR};`);
    });
  });

  describe('2. Shop Settings Validation Schema for Branding & Contact Info', () => {
    it('accepts valid 6-character and 3-character hex colors', () => {
      const result = ShopSettingsInputSchema.safeParse({
        shopName: 'Arogya Medical Store',
        primaryColor: '#123e35',
        secondaryColor: '#4a6b61',
        accentColor: '#92bfa9',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.primaryColor).toBe('#123e35');
        expect(result.data.secondaryColor).toBe('#4a6b61');
        expect(result.data.accentColor).toBe('#92bfa9');
      }
    });

    it('rejects invalid hex codes (missing hash, invalid chars, bad length)', () => {
      expect(
        ShopSettingsInputSchema.safeParse({
          shopName: 'Test Pharmacy',
          primaryColor: '123e35', // missing hash
        }).success
      ).toBe(false);

      expect(
        ShopSettingsInputSchema.safeParse({
          shopName: 'Test Pharmacy',
          primaryColor: '#zzzzzz', // invalid hex digits
        }).success
      ).toBe(false);

      expect(
        ShopSettingsInputSchema.safeParse({
          shopName: 'Test Pharmacy',
          primaryColor: '#12345678', // 8 digits (too long)
        }).success
      ).toBe(false);
    });

    it('validates optional websiteUrl and emergencyContact fields', () => {
      const valid = ShopSettingsInputSchema.safeParse({
        shopName: 'Test Pharmacy',
        websiteUrl: 'https://arogyapharmacy.in',
        emergencyContact: 'On-call pharmacist: +91 98765 00000',
      });
      expect(valid.success).toBe(true);

      const invalidUrl = ShopSettingsInputSchema.safeParse({
        shopName: 'Test Pharmacy',
        websiteUrl: 'javascript:alert(1)',
      });
      expect(invalidUrl.success).toBe(false);
    });
  });

  describe('3. Database Persistence of Custom Branding Settings', () => {
    it('persists and retrieves custom brand colors, emergency contact, and website', async () => {
      // 1. Read current initial settings to restore afterward
      const initial = await getShopSettings();

      // 2. Update with custom healthcare branding
      const updated = await updateShopSettings({
        shopName: initial.shopName,
        tagline: initial.tagline,
        primaryColor: '#0f4c5c',
        secondaryColor: '#3b7a8c',
        accentColor: '#7bc4c4',
        phoneNumber: initial.phoneNumber,
        whatsappNumber: initial.whatsappNumber,
        emergencyContact: 'Emergency Helpline: +91 99999 88888',
        websiteUrl: 'https://janaushadhi.gov.in',
        address: initial.address,
        googleMapsUrl: initial.googleMapsUrl,
        googleReviewUrl: initial.googleReviewUrl,
        openingHours: initial.openingHours,
        isEmergencyOpen: initial.isEmergencyOpen,
      });

      expect(updated.primaryColor).toBe('#0f4c5c');
      expect(updated.secondaryColor).toBe('#3b7a8c');
      expect(updated.accentColor).toBe('#7bc4c4');
      expect(updated.emergencyContact).toBe('Emergency Helpline: +91 99999 88888');
      expect(updated.websiteUrl).toBe('https://janaushadhi.gov.in');

      // 3. Re-read through getShopSettings to guarantee database persistence
      const reloaded = await getShopSettings();
      expect(reloaded.primaryColor).toBe('#0f4c5c');
      expect(reloaded.secondaryColor).toBe('#3b7a8c');
      expect(reloaded.accentColor).toBe('#7bc4c4');
      expect(reloaded.emergencyContact).toBe('Emergency Helpline: +91 99999 88888');
      expect(reloaded.websiteUrl).toBe('https://janaushadhi.gov.in');

      // 4. Restore original production values to maintain data integrity
      await updateShopSettings({
        shopName: initial.shopName,
        tagline: initial.tagline,
        primaryColor: initial.primaryColor,
        secondaryColor: initial.secondaryColor,
        accentColor: initial.accentColor,
        phoneNumber: initial.phoneNumber,
        whatsappNumber: initial.whatsappNumber,
        emergencyContact: initial.emergencyContact,
        websiteUrl: initial.websiteUrl,
        address: initial.address,
        googleMapsUrl: initial.googleMapsUrl,
        googleReviewUrl: initial.googleReviewUrl,
        openingHours: initial.openingHours,
        isEmergencyOpen: initial.isEmergencyOpen,
      });
    });
  });

  describe('4. Server Action Authorization & Logo Security', () => {
    it('rejects unauthenticated requests to update branding settings', async () => {
      const { cookies } = await import('next/headers');
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue(undefined),
      } as unknown as Awaited<ReturnType<typeof cookies>>);

      await expect(
        updateShopSettingsAction({
          shopName: 'Unauthorized Update',
          primaryColor: '#123e35',
        })
      ).rejects.toThrow('NEXT_REDIRECT:/admin/login?returnUrl=%2Fadmin%2Fsettings');
    });

    it('rejects unauthenticated requests to upload pharmacy logo', async () => {
      const { cookies } = await import('next/headers');
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue(undefined),
      } as unknown as Awaited<ReturnType<typeof cookies>>);

      const formData = new FormData();
      formData.append('logo', new Blob(['fake image data'], { type: 'image/png' }));

      await expect(uploadPharmacyLogoAction(formData)).rejects.toThrow(
        'NEXT_REDIRECT:/admin/login?returnUrl=%2Fadmin%2Fsettings'
      );
    });

    it('rejects logo uploads exceeding 3MB size ceiling', async () => {
      const admin = await prisma.adminUser.findUnique({
        where: { username: 'admin' },
      });
      if (!admin) throw new Error('Seeded admin missing');

      const session = await createAdminSession(admin.id);

      const { cookies } = await import('next/headers');
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue({ value: session.rawToken }),
      } as unknown as Awaited<ReturnType<typeof cookies>>);

      // Create a mocked file exceeding 3MB (3.5MB)
      const largeContent = new Uint8Array(3.5 * 1024 * 1024);
      const file = new File([largeContent], 'oversized-logo.png', { type: 'image/png' });
      const formData = new FormData();
      formData.append('logo', file);

      const result = await uploadPharmacyLogoAction(formData);
      expect(result.success).toBe(false);
      expect(result.message).toMatch(/3\s*MB/i);
    });

    it('rejects non-image MIME types for pharmacy logo', async () => {
      const admin = await prisma.adminUser.findUnique({
        where: { username: 'admin' },
      });
      if (!admin) throw new Error('Seeded admin missing');

      const session = await createAdminSession(admin.id);

      const { cookies } = await import('next/headers');
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue({ value: session.rawToken }),
      } as unknown as Awaited<ReturnType<typeof cookies>>);

      const executable = new File(['echo exploit'], 'script.sh', { type: 'application/x-sh' });
      const formData = new FormData();
      formData.append('logo', executable);

      const result = await uploadPharmacyLogoAction(formData);
      expect(result.success).toBe(false);
      expect(result.message).toMatch(/PNG,\s*JPEG/i);
    });
  });
});
