import { describe, it, expect } from 'vitest';
import { MockAIProvider } from '@/lib/ai/mock-provider';
import { buildUserPrompt, AI_REVIEW_SYSTEM_PROMPT } from '@/lib/ai/prompt';

describe('AI Review Generation for Gujarati and Gujlish', () => {
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

  it('generates 3 natural Gujlish review drafts with colloquial conversational mix', async () => {
    const drafts = await provider.generateReviewDrafts({
      rating: 5,
      selectedTags: ['Fitting and Sizing', 'Fabric Quality'],
      language: 'gujlish',
    });

    expect(drafts).toHaveLength(3);
    for (const draft of drafts) {
      expect(draft.language).toBe('gujlish');
      expect(draft.text.length).toBeGreaterThan(15);
    }

    const combined = drafts.map((d) => d.text).join(' ');
    // Gujlish should contain English words with Gujarati conjunctions/auxiliaries
    expect(
      combined.includes('collection') ||
        combined.includes('quality') ||
        combined.includes('fitting') ||
        combined.includes('service')
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

  it('constructs AI prompt with strict non-hallucination and Gujarati/Gujlish rules', () => {
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

    const promptGujlish = buildUserPrompt({
      rating: 4,
      selectedTags: ['Fabric Quality'],
      customerNote: '',
      shopName: 'Maison & Thread',
      language: 'gujlish',
    });

    expect(promptGujlish).toContain('Gujlish');
    expect(promptGujlish).toContain('Maison & Thread');

    // Verify system prompt safety constraints
    expect(AI_REVIEW_SYSTEM_PROMPT).toContain('CRITICAL NON-FABRICATION CONSTRAINTS');
    expect(AI_REVIEW_SYSTEM_PROMPT).toContain('NEVER write robotic, corporate, or artificial marketing reviews');
    expect(AI_REVIEW_SYSTEM_PROMPT).toContain('Authentic, natural Gujarati written strictly in proper Gujarati Unicode script');
    expect(AI_REVIEW_SYSTEM_PROMPT).toContain('Natural colloquial Gujlish');
  });
});
