import { describe, it, expect } from 'vitest';
import {
  TRANSLATIONS,
  FASHION_TAG_TRANSLATIONS,
  LANGUAGE_OPTIONS,
} from '@/lib/i18n/translations';
import type { SupportedLanguage } from '@/lib/i18n/translations';

describe('Multilingual i18n System (English, Gujarati, Gujlish)', () => {
  const supportedLanguages: SupportedLanguage[] = ['en', 'gu', 'gujlish'];

  it('supports all required language options: en, gu, gujlish', () => {
    expect(LANGUAGE_OPTIONS.map((o) => o.code)).toEqual(['en', 'gu', 'gujlish']);

    for (const lang of supportedLanguages) {
      expect(TRANSLATIONS[lang]).toBeDefined();
      expect(TRANSLATIONS[lang].ratingHeading).toBeDefined();
      expect(TRANSLATIONS[lang].ratingLabel).toBeDefined();
      expect(TRANSLATIONS[lang].generateReview).toBeDefined();
    }
  });

  it('uses authentic Gujarati Unicode characters (U+0A80 to U+0AFF) in Gujarati (gu)', () => {
    const gujDict = TRANSLATIONS.gu;
    const gujRegex = /[\u0A80-\u0AFF]/;

    expect(gujRegex.test(gujDict.ratingHeading)).toBe(true);
    expect(gujRegex.test(gujDict.ratingLabel)).toBe(true);
    expect(gujRegex.test(gujDict.generateReview)).toBe(true);
    expect(gujRegex.test(gujDict.copyToGoogleCta)).toBe(true);
    expect(gujRegex.test(gujDict.notesLabel)).toBe(true);

    // Exact matches with specification
    expect(gujDict.ratingHeading).toBe('તમારો ખરીદીનો અનુભવ કેવો રહ્યો?');
    expect(gujDict.ratingLabel).toBe('તમારું રેટિંગ પસંદ કરો');
    expect(gujDict.generateReview).toBe('રિવ્યૂ બનાવો');
  });

  it('uses natural code-mixed Gujarati-English phrasing in Gujlish', () => {
    const gujlishDict = TRANSLATIONS.gujlish;

    // Gujlish mixes conversational English terms with Gujarati
    expect(gujlishDict.ratingHeading).toBe('તમારો shopping experience કેવો રહ્યો?');
    expect(gujlishDict.ratingLabel).toBe('તમારું rating પસંદ કરો');
    expect(gujlishDict.generateReview).toBe('Review બનાવો');
    expect(gujlishDict.copyToGoogleCta).toContain('Copy');
  });

  it('provides translations for all 11 clothing-specific review tags in en, gu, and gujlish', () => {
    expect(FASHION_TAG_TRANSLATIONS).toHaveLength(11);

    const gujRegex = /[\u0A80-\u0AFF]/;
    for (const tag of FASHION_TAG_TRANSLATIONS) {
      expect(tag.id).toBeTruthy();
      expect(tag.en).toBeTruthy();
      expect(tag.gu).toBeTruthy();
      expect(tag.gujlish).toBeTruthy();

      // Gujarati tag must contain proper Gujarati script
      expect(gujRegex.test(tag.gu)).toBe(true);
    }
  });

  it('renders accurate Gujarati translations for key clothing tags matching the specification', () => {
    const tagMap = new Map(FASHION_TAG_TRANSLATIONS.map((t) => [t.id, t]));

    expect(tagMap.get('Clothing Quality')?.gu).toBe('કપડાંની ગુણવત્તા');
    expect(tagMap.get('Fabric Quality')?.gu).toBe('ફેબ્રિક');
    expect(tagMap.get('Fitting & Sizing')?.gu).toBe('ફિટિંગ અને સાઇઝ');
    expect(tagMap.get('Design & Collection')?.gu).toBe('ડિઝાઇન');
    expect(tagMap.get('Comfort')?.gu).toBe('આરામ');
    expect(tagMap.get('Pricing & Value')?.gu).toBe('કિંમત');
    expect(tagMap.get('Staff Behaviour')?.gu).toBe('સ્ટાફનો વ્યવહાર');
    expect(tagMap.get('Collection')?.gu).toBe('કલેક્શન');
    expect(tagMap.get('Shopping Experience')?.gu).toBe('ખરીદીનો અનુભવ');
  });
});
