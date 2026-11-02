import { describe, it, expect } from 'vitest';
import {
  TRANSLATIONS,
  FASHION_TAG_TRANSLATIONS,
  LANGUAGE_OPTIONS,
} from '@/lib/i18n/translations';
import type { SupportedLanguage } from '@/lib/i18n/translations';

describe('Multilingual i18n System (Exact 3 Languages: English, Gujlish, Hinglish)', () => {
  const supportedLanguages: SupportedLanguage[] = ['en', 'gujlish', 'hinglish'];

  it('supports exactly three languages: en, gujlish, hinglish and no more', () => {
    expect(LANGUAGE_OPTIONS.map((o) => o.code)).toEqual(['en', 'gujlish', 'hinglish']);
    expect(LANGUAGE_OPTIONS).toHaveLength(3);

    for (const lang of supportedLanguages) {
      expect(TRANSLATIONS[lang]).toBeDefined();
      expect(TRANSLATIONS[lang].ratingHeading).toBeDefined();
      expect(TRANSLATIONS[lang].ratingLabel).toBeDefined();
      expect(TRANSLATIONS[lang].generateReview).toBeDefined();
      expect(TRANSLATIONS[lang].copyToGoogleCta).toBeDefined();
    }
  });

  it('renders exact language selector labels required by the specification', () => {
    const labels = LANGUAGE_OPTIONS.map((o) => o.nativeLabel);
    expect(labels).toContain('English');
    expect(labels).toContain('ગુજરાતી + English (Gujlish)');
    expect(labels).toContain('हिंदी + English (Hinglish)');
  });

  it('uses natural code-mixed Gujarati-English phrasing in Gujlish', () => {
    const gujlishDict = TRANSLATIONS.gujlish;

    // Gujlish mixes conversational English terms with Gujarati script
    expect(gujlishDict.ratingHeading).toBe('તમારો shopping experience કેવો રહ્યો?');
    expect(gujlishDict.ratingLabel).toBe('તમારું rating પસંદ કરો');
    expect(gujlishDict.generateReview).toBe('Review બનાવો');
    expect(gujlishDict.copyToGoogleCta).toContain('Google Reviews');
    expect(/[\u0A80-\u0AFF]/.test(gujlishDict.ratingHeading)).toBe(true);
    expect(gujlishDict.ratingHeading.toLowerCase()).toContain('shopping experience');
  });

  it('uses natural conversational Hindi-English phrasing in Hinglish', () => {
    const hinglishDict = TRANSLATIONS.hinglish;

    // Hinglish mixes conversational Hindi with common English words
    expect(hinglishDict.ratingHeading).toBe('Aapka shopping experience kaisa raha?');
    expect(hinglishDict.ratingLabel).toBe('Apna rating choose karein');
    expect(hinglishDict.generateReview).toBe('Review generate karein');
    expect(hinglishDict.ratingHeading.toLowerCase()).toContain('shopping experience');
    expect(hinglishDict.ratingHeading.toLowerCase()).toContain('aapka');
  });

  it('provides translations for all 11 clothing-specific review tags in en, gujlish, and hinglish', () => {
    expect(FASHION_TAG_TRANSLATIONS).toHaveLength(11);

    for (const tag of FASHION_TAG_TRANSLATIONS) {
      expect(tag.id).toBeTruthy();
      expect(tag.en).toBeTruthy();
      expect(tag.gujlish).toBeTruthy();
      expect(tag.hinglish).toBeTruthy();
    }
  });

  it('renders accurate Gujlish and Hinglish translations for key clothing tags', () => {
    const tagMap = new Map(FASHION_TAG_TRANSLATIONS.map((t) => [t.id, t]));

    expect(tagMap.get('Clothing Quality')?.gujlish).toBe('Clothing ની Quality');
    expect(tagMap.get('Clothing Quality')?.hinglish).toBe('Clothes ki Quality');
    expect(tagMap.get('Fabric Quality')?.gujlish).toBe('Fabric & Material');
    expect(tagMap.get('Fabric Quality')?.hinglish).toBe('Fabric & Kapda Quality');
    expect(tagMap.get('Fitting & Sizing')?.gujlish).toBe('Fitting & Size Options');
    expect(tagMap.get('Fitting & Sizing')?.hinglish).toBe('Fitting aur Sizing');
    expect(tagMap.get('Shopping Experience')?.gujlish).toBe('Great Shopping Experience');
    expect(tagMap.get('Shopping Experience')?.hinglish).toBe('Smooth Shopping Experience');
  });
});
