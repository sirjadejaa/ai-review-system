import { describe, it, expect } from 'vitest';
import { MockAIProvider } from '@/lib/ai/mock-provider';
import { buildUserPrompt, AI_REVIEW_SYSTEM_PROMPT } from '@/lib/ai/prompt';

describe('AI Review Generation for Gujarati (gu) and Hindi (hi)', () => {
  const provider = new MockAIProvider();

  it('generates 3 authentic Gujarati (gu) review drafts using Gujarati Unicode characters', async () => {
    const drafts = await provider.generateReviewDrafts({
      rating: 5,
      selectedTags: ['Clothing Quality', 'Staff Behaviour'],
      customerNote: 'Super collection',
      language: 'gu',
    });

    expect(drafts).toHaveLength(3);
    const gujRegex = /[\u0A80-\u0AFF]/;

    for (const draft of drafts) {
      expect(draft.language).toBe('gu');
      expect(gujRegex.test(draft.text)).toBe(true);
      expect(draft.text.length).toBeGreaterThan(15);
    }

    // High rating drafts should contain positive Gujarati sentiment words
    const combined = drafts.map((d) => d.text).join(' ');
    expect(
      combined.includes('સરસ') ||
        combined.includes('ઉત્તમ') ||
        combined.includes('કલેક્શન') ||
        combined.includes('અનુભવ')
    ).toBe(true);
  });

  it('generates 3 authentic Hindi (hi) review drafts in Devanagari script', async () => {
    const drafts = await provider.generateReviewDrafts({
      rating: 5,
      selectedTags: ['Clothing Quality', 'Fabric Quality'],
      language: 'hi',
    });

    expect(drafts).toHaveLength(3);
    const hiRegex = /[\u0900-\u097F]/;

    for (const draft of drafts) {
      expect(draft.language).toBe('hi');
      expect(hiRegex.test(draft.text)).toBe(true);
      expect(draft.text.length).toBeGreaterThan(15);
    }

    const combined = drafts.map((d) => d.text).join(' ');
    expect(
      combined.includes('क्वालिटी') ||
        combined.includes('कलेक्शन') ||
        combined.includes('अनुभव') ||
        combined.includes('बढ़िया')
    ).toBe(true);
  });

  it('generates constructive Gujarati drafts for lower ratings (1-2 stars)', async () => {
    const drafts = await provider.generateReviewDrafts({
      rating: 2,
      selectedTags: ['Pricing & Value'],
      customerNote: 'Too expensive for fabric',
      language: 'gu',
    });

    expect(drafts).toHaveLength(3);
    for (const draft of drafts) {
      expect(draft.language).toBe('gu');
      // Should mention notes and improvement
      expect(/[\u0A80-\u0AFF]/.test(draft.text)).toBe(true);
    }
  });

  it('generates AI owner review reply drafts in en, hi, and gu', async () => {
    const replyEn = await provider.generateOwnerReplyDraft({
      reviewerName: 'Priya Sharma',
      rating: 5,
      reviewText: 'Loved the silk saree collection and friendly staff!',
      language: 'en',
      shopName: 'Aura Boutique',
    });

    expect(replyEn).toContain('Priya');
    expect(replyEn.length).toBeGreaterThan(20);

    const replyHi = await provider.generateOwnerReplyDraft({
      reviewerName: 'Rahul Patel',
      rating: 5,
      reviewText: 'Great kurtas and fitting was perfect.',
      language: 'hi',
      shopName: 'Aura Boutique',
    });

    expect(/[\u0900-\u097F]/.test(replyHi)).toBe(true);

    const replyGu = await provider.generateOwnerReplyDraft({
      reviewerName: 'Dharmesh Bhai',
      rating: 1,
      reviewText: 'Size was not available.',
      language: 'gu',
      shopName: 'Aura Boutique',
    });

    expect(/[\u0A80-\u0AFF]/.test(replyGu)).toBe(true);
  });

  it('constructs AI prompt with strict non-hallucination and Gujarati/Hindi rules', () => {
    const promptGu = buildUserPrompt({
      rating: 5,
      selectedTags: ['Clothing Quality', 'Comfort'],
      customerNote: 'Great fitting kurta',
      shopName: 'Heritage Silk Boutique',
      language: 'gu',
    });

    expect(promptGu).toContain('Heritage Silk Boutique');
    expect(promptGu).toContain('Gujarati');
    expect(promptGu).toContain('strictly no unstated facts or fabricated item purchases');

    const promptHi = buildUserPrompt({
      rating: 4,
      selectedTags: ['Fabric Quality'],
      customerNote: '',
      shopName: 'Maison & Thread',
      language: 'hi',
    });

    expect(promptHi).toContain('Hindi');
    expect(promptHi).toContain('Maison & Thread');

    // Verify system prompt safety constraints
    expect(AI_REVIEW_SYSTEM_PROMPT).toContain('CRITICAL NON-FABRICATION CONSTRAINTS');
    expect(AI_REVIEW_SYSTEM_PROMPT).toContain('NEVER write robotic, corporate, or artificial marketing reviews');
    expect(AI_REVIEW_SYSTEM_PROMPT).toContain('Authentic, natural Gujarati written strictly in proper Gujarati Unicode script');
    expect(AI_REVIEW_SYSTEM_PROMPT).toContain('Genuine Hindi in proper Devanagari script');
  });
});
