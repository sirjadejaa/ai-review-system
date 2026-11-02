import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  BOUTIQUE_COLOR_PRESETS,
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
  uploadBoutiqueLogoAction,
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

describe('Custom Boutique Branding & Store Configuration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Boutique Color Palettes & Dynamic Theme Generator', () => {
    it('provides all 4 curated fashion boutique color presets with valid hex values', () => {
      expect(BOUTIQUE_COLOR_PRESETS).toHaveLength(4);

      const hexRegex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
      for (const preset of BOUTIQUE_COLOR_PRESETS) {
        expect(preset.id).toBeTruthy();
        expect(preset.name).toBeTruthy();
        expect(preset.description).toBeTruthy();
        expect(hexRegex.test(preset.primary)).toBe(true);
        expect(hexRegex.test(preset.secondary)).toBe(true);
        expect(hexRegex.test(preset.accent)).toBe(true);
      }
    });

    it('correctly converts valid hex strings to RGB components', () => {
      expect(hexToRgb('#171717')).toEqual({ r: 23, g: 23, b: 23 });
      expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 });
      expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
      expect(hexToRgb('invalid')).toBeNull();
      expect(hexToRgb('')).toBeNull();
    });

    it('adjusts color brightness up and down with saturation clamping', () => {
      const original = '#171717';
      const brightened = adjustBrightness(original, 20);
      const darkened = adjustBrightness(original, -20);

      expect(brightened).not.toBe(original);
      expect(darkened).not.toBe(original);
      expect(brightened.startsWith('#')).toBe(true);
      expect(darkened.startsWith('#')).toBe(true);
    });

    it('generates complete :root CSS variables injecting brand colors and derived tints', () => {
      const css = generateThemeCss({
        primaryColor: '#171717',
        secondaryColor: '#3a3a3a',
        accentColor: '#a88b64',
      });

      expect(css).toContain(':root');
      expect(css).toContain('--color-primary: #171717;');
      expect(css).toContain('--color-secondary: #3a3a3a;');
      expect(css).toContain('--color-accent: #a88b64;');
      expect(css).toContain('--color-primary-rgb: 23, 23, 23;');
      expect(css).toContain('--color-primary-hover:');
      expect(css).toContain('--color-primary-subtle:');
    });

    it('falls back to default boutique colors when custom colors are omitted', () => {
      const css = generateThemeCss({});

      expect(css).toContain(`--color-primary: ${DEFAULT_PRIMARY_COLOR};`);
      expect(css).toContain(`--color-secondary: ${DEFAULT_SECONDARY_COLOR};`);
      expect(css).toContain(`--color-accent: ${DEFAULT_ACCENT_COLOR};`);
    });
  });

  describe('2. Shop Settings Validation Schema for Branding & Contact Info', () => {
    it('accepts valid 6-character and 3-character hex colors', () => {
      const result = ShopSettingsInputSchema.safeParse({
        shopName: 'Maison & Thread',
        primaryColor: '#171717',
        secondaryColor: '#3a3a3a',
        accentColor: '#a88b64',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.primaryColor).toBe('#171717');
        expect(result.data.secondaryColor).toBe('#3a3a3a');
        expect(result.data.accentColor).toBe('#a88b64');
      }
    });

    it('rejects invalid hex codes (missing hash, invalid chars, bad length)', () => {
      expect(
        ShopSettingsInputSchema.safeParse({
          shopName: 'Test Boutique',
          primaryColor: '171717', // missing hash
        }).success
      ).toBe(false);

      expect(
        ShopSettingsInputSchema.safeParse({
          shopName: 'Test Boutique',
          primaryColor: '#zzzzzz', // invalid hex digits
        }).success
      ).toBe(false);

      expect(
        ShopSettingsInputSchema.safeParse({
          shopName: 'Test Boutique',
          primaryColor: '#12', // too short
        }).success
      ).toBe(false);
    });

    it('validates websiteUrl and social links array', () => {
      const valid = ShopSettingsInputSchema.safeParse({
        shopName: 'Atelier Mode',
        websiteUrl: 'https://maisonthread.com',
        socialLinks: ['https://instagram.com/maisonthread', 'https://facebook.com/maisonthread'],
      });
      expect(valid.success).toBe(true);

      const invalidProtocol = ShopSettingsInputSchema.safeParse({
        shopName: 'Atelier Mode',
        websiteUrl: 'javascript:alert(1)',
      });
      expect(invalidProtocol.success).toBe(false);
    });
  });

  describe('3. Server Action Authorization & Logo Security', () => {
    it('rejects unauthenticated requests to update branding settings', async () => {
      const { cookies } = await import('next/headers');
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue(undefined),
      } as unknown as Awaited<ReturnType<typeof cookies>>);

      await expect(
        updateShopSettingsAction({
          shopName: 'Unauthorized Update',
          primaryColor: '#171717',
        })
      ).rejects.toThrow('NEXT_REDIRECT:/admin/login?returnUrl=%2Fadmin%2Fsettings');
    });

    it('rejects unauthenticated requests to upload boutique logo', async () => {
      const { cookies } = await import('next/headers');
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue(undefined),
      } as unknown as Awaited<ReturnType<typeof cookies>>);

      const formData = new FormData();
      formData.append('logo', new Blob(['fake image data'], { type: 'image/png' }));

      await expect(uploadBoutiqueLogoAction(formData)).rejects.toThrow(
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

      const result = await uploadBoutiqueLogoAction(formData);
      expect(result.success).toBe(false);
      expect(result.message).toMatch(/3\s*MB/i);
    });

    it('rejects non-image MIME types for boutique logo', async () => {
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

      const result = await uploadBoutiqueLogoAction(formData);
      expect(result.success).toBe(false);
      expect(result.message).toMatch(/PNG,\s*JPEG/i);
    });
  });
});
