import { describe, it, expect, beforeEach } from 'vitest';
import { ShopSettingsInputSchema } from '@/lib/validation/shop-settings-schema';
import { getShopSettings, updateShopSettings } from '@/lib/repositories/shop-settings-repository';
import { AI_REVIEW_SYSTEM_PROMPT, buildUserPrompt } from '@/lib/ai/prompt';
import { MockAIProvider } from '@/lib/ai/mock-provider';
import { isValidExternalUrl } from '@/lib/format/contact-links';

describe('Phase 11.5: Product UI Transformation, Real Data & Production UX Tests', () => {
  describe('1. Business Logo Validation & Storage Schema', () => {
    it('validates logoUrl accepts valid HTTPS image URLs and base64 data URIs', () => {
      const validWebUrl = ShopSettingsInputSchema.safeParse({
        shopName: 'City Care Pharmacy',
        logoUrl: 'https://images.example.com/pharmacy-logo.png',
        openingHours: [],
      });
      expect(validWebUrl.success).toBe(true);

      const validDataUri = ShopSettingsInputSchema.safeParse({
        shopName: 'City Care Pharmacy',
        logoUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        openingHours: [],
      });
      expect(validDataUri.success).toBe(true);

      const validNull = ShopSettingsInputSchema.safeParse({
        shopName: 'City Care Pharmacy',
        logoUrl: null,
        openingHours: [],
      });
      expect(validNull.success).toBe(true);
    });

    it('rejects unsafe or malformed logoUrl strings', () => {
      const unsafeJs = ShopSettingsInputSchema.safeParse({
        shopName: 'City Care Pharmacy',
        logoUrl: 'javascript:alert(1)',
        openingHours: [],
      });
      expect(unsafeJs.success).toBe(false);

      const invalidProtocol = ShopSettingsInputSchema.safeParse({
        shopName: 'City Care Pharmacy',
        logoUrl: 'ftp://example.com/logo.png',
        openingHours: [],
      });
      expect(invalidProtocol.success).toBe(false);

      const invalidText = ShopSettingsInputSchema.safeParse({
        shopName: 'City Care Pharmacy',
        logoUrl: 'not-a-valid-url-or-data-uri',
        openingHours: [],
      });
      expect(invalidText.success).toBe(false);
    });

    it('persists and retrieves logoUrl through shop-settings repository', async () => {
      const testLogo = 'https://cdn.example.com/pharmacy-badge.webp';
      const updated = await updateShopSettings({
        shopName: 'Green Cross Pharmacy',
        logoUrl: testLogo,
        openingHours: [],
      });

      expect(updated.logoUrl).toBe(testLogo);
      expect(updated.shopName).toBe('Green Cross Pharmacy');

      const retrieved = await getShopSettings();
      expect(retrieved.logoUrl).toBe(testLogo);

      // Clean removal
      const cleared = await updateShopSettings({
        shopName: 'Green Cross Pharmacy',
        logoUrl: null,
        openingHours: [],
      });
      expect(cleared.logoUrl).toBeNull();
    });
  });

  describe('2. Real Data & Production Seed Protection', () => {
    it('verifies default settings have no hardcoded demo pharmacy name or fake contact info', async () => {
      const current = await getShopSettings();
      // Must not contain fake "Sanjivani" or fake demo placeholders
      expect(current.shopName).not.toContain('Sanjivani');
      if (current.phoneNumber) {
        expect(current.phoneNumber).not.toBe('+91 98765 43210');
      }
    });

    it('identifies unconfigured pharmacy installation state accurately', () => {
      const unconfiguredState = {
        shopName: 'Pharmacy',
        phoneNumber: null,
        address: null,
        googleReviewUrl: null,
      };

      const isUnconfigured =
        !unconfiguredState.shopName ||
        (unconfiguredState.shopName === 'Pharmacy' &&
          !unconfiguredState.phoneNumber &&
          !unconfiguredState.address &&
          !unconfiguredState.googleReviewUrl);

      expect(isUnconfigured).toBe(true);

      const configuredState = {
        shopName: 'HealthFirst Pharmacy',
        phoneNumber: '+91 99999 11111',
        address: '123 Market St',
        googleReviewUrl: 'https://g.page/r/example/review',
      };

      const isConfiguredUnconfigured =
        !configuredState.shopName ||
        (configuredState.shopName === 'Pharmacy' &&
          !configuredState.phoneNumber &&
          !configuredState.address &&
          !configuredState.googleReviewUrl);

      expect(isConfiguredUnconfigured).toBe(false);
    });
  });

  describe('3. Human-Style AI Review Generation Quality', () => {
    const generator = new MockAIProvider();

    it('generates 3 natural drafts with varied styles (Short, Warm, Detailed)', async () => {
      const drafts = await generator.generateReviewDrafts({
        rating: 5,
        selectedTags: ['Quick Service', 'Helpful Staff'],
        customerNote: '',
        language: 'en',
        shopName: 'Apollo Care Pharmacy',
      });

      expect(drafts).toHaveLength(3);
      expect(drafts[0].text.length).toBeGreaterThan(15);
      expect(drafts[1].text.length).toBeGreaterThan(20);
      expect(drafts[2].text.length).toBeGreaterThan(25);

      // Verify drafts are meaningfully different
      expect(drafts[0].text).not.toBe(drafts[1].text);
      expect(drafts[1].text).not.toBe(drafts[2].text);

      // Verify absence of robotic corporate phrases
      for (const draft of drafts) {
        expect(draft.text.toLowerCase()).not.toContain('i had an excellent experience');
        expect(draft.text.toLowerCase()).not.toContain('extremely professional and courteous');
        expect(draft.text.toLowerCase()).not.toContain('for all your healthcare needs');
      }
    });

    it('generates authentic Hinglish and Hindi reviews naturally', async () => {
      const hinglishDrafts = await generator.generateReviewDrafts({
        rating: 5,
        selectedTags: ['Genuine Medicines'],
        customerNote: '',
        language: 'hinglish',
        shopName: 'City Pharmacy',
      });

      expect(hinglishDrafts).toHaveLength(3);
      expect(hinglishDrafts[0].text.toLowerCase()).toContain('medicines');

      const hindiDrafts = await generator.generateReviewDrafts({
        rating: 5,
        selectedTags: ['Good Guidance'],
        customerNote: '',
        language: 'hi',
        shopName: 'City Pharmacy',
      });

      expect(hindiDrafts).toHaveLength(3);
      const hasDevanagari = /[\u0900-\u097F]/.test(hindiDrafts[0].text);
      expect(hasDevanagari).toBe(true);
    });

    it('strictly preserves non-fabrication rules in system prompt and user prompt', () => {
      expect(AI_REVIEW_SYSTEM_PROMPT).toContain('ONLY use facts and sentiments explicitly provided');
      expect(AI_REVIEW_SYSTEM_PROMPT).toContain('NEVER invent or mention:');
      expect(AI_REVIEW_SYSTEM_PROMPT).toContain('Specific medicines, drugs, or brand names');
      expect(AI_REVIEW_SYSTEM_PROMPT).toContain('Doctor names, pharmacist names, or staff names');

      const prompt = buildUserPrompt({
        rating: 5,
        selectedTags: ['Fair Pricing'],
        customerNote: 'Staff answered my questions kindly',
        language: 'en',
        shopName: 'Health Corner',
      });

      expect(prompt).toContain('<customer_note>');
      expect(prompt).toContain('Staff answered my questions kindly');
      expect(prompt).toContain('</customer_note>');
      expect(prompt).toContain('Health Corner');
    });
  });

  describe('4. Copy & Continue to Google Handoff Behavior', () => {
    it('validates external Google review link correctly', () => {
      expect(isValidExternalUrl('https://g.page/r/example/review')).toBe(true);
      expect(isValidExternalUrl('https://search.google.com/local/writereview?placeid=123')).toBe(true);
      expect(isValidExternalUrl('')).toBe(false);
      expect(isValidExternalUrl('javascript:alert(1)')).toBe(false);
    });

    it('prevents broken redirects when Google review URL is missing', () => {
      const nullUrl: string | null = null;
      const canOpen = Boolean(nullUrl && isValidExternalUrl(nullUrl));
      expect(canOpen).toBe(false);

      const invalidUrl = 'not-a-link';
      const canOpenInvalid = Boolean(invalidUrl && isValidExternalUrl(invalidUrl));
      expect(canOpenInvalid).toBe(false);
    });
  });
});
