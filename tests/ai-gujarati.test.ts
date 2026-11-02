import { describe, it, expect } from 'vitest';
import { MockAIProvider } from '@/lib/ai/mock-provider';
import { buildUserPrompt, AI_REVIEW_SYSTEM_PROMPT } from '@/lib/ai/prompt';

describe('AI Review Generation for Gujlish and Hinglish', () => {
  const provider = new MockAIProvider();

  describe('1. Gujlish Customer Review Drafts', () => {
    it('generates 3 authentic positive Gujlish review drafts with natural Gujarati-English mix', async () => {
      const drafts = await provider.generateReviewDrafts({
        rating: 5,
        selectedTags: ['Clothing Quality', 'Staff Behaviour'],
        customerNote: 'Super festive collection',
        language: 'gujlish',
      });

      expect(drafts).toHaveLength(3);
      for (const draft of drafts) {
        expect(draft.language).toBe('gujlish');
        expect(draft.text.length).toBeGreaterThan(15);
      }

      const combined = drafts.map((d) => d.text).join(' ');
      // Must contain Gujarati characters and English terms
      expect(/[\u0A80-\u0AFF]/.test(combined)).toBe(true);
      expect(
        combined.toLowerCase().includes('collection') ||
          combined.toLowerCase().includes('quality') ||
          combined.toLowerCase().includes('experience') ||
          combined.toLowerCase().includes('staff')
      ).toBe(true);
    });

    it('generates neutral (3-star) Gujlish review drafts', async () => {
      const drafts = await provider.generateReviewDrafts({
        rating: 3,
        selectedTags: ['Fitting & Sizing'],
        customerNote: '',
        language: 'gujlish',
      });

      expect(drafts).toHaveLength(3);
      const combined = drafts.map((d) => d.text).join(' ');
      expect(combined.toLowerCase()).toContain('average');
    });

    it('generates constructive negative (1-2 star) Gujlish review drafts', async () => {
      const drafts = await provider.generateReviewDrafts({
        rating: 2,
        selectedTags: ['Pricing & Value'],
        customerNote: 'Expensive fabric',
        language: 'gujlish',
      });

      expect(drafts).toHaveLength(3);
      for (const draft of drafts) {
        expect(draft.language).toBe('gujlish');
        expect(/[\u0A80-\u0AFF]/.test(draft.text)).toBe(true);
      }
    });
  });

  describe('2. Hinglish Customer Review Drafts', () => {
    it('generates 3 authentic positive Hinglish review drafts in natural Roman script', async () => {
      const drafts = await provider.generateReviewDrafts({
        rating: 5,
        selectedTags: ['Clothing Quality', 'Fabric Quality'],
        language: 'hinglish',
      });

      expect(drafts).toHaveLength(3);
      for (const draft of drafts) {
        expect(draft.language).toBe('hinglish');
        expect(draft.text.length).toBeGreaterThan(15);
      }

      const combined = drafts.map((d) => d.text).join(' ');
      expect(
        combined.toLowerCase().includes('collection') ||
          combined.toLowerCase().includes('quality') ||
          combined.toLowerCase().includes('shopping')
      ).toBe(true);
    });

    it('generates neutral (3-star) Hinglish review drafts', async () => {
      const drafts = await provider.generateReviewDrafts({
        rating: 3,
        selectedTags: ['Fitting & Sizing'],
        language: 'hinglish',
      });

      expect(drafts).toHaveLength(3);
      const combined = drafts.map((d) => d.text).join(' ');
      expect(
        combined.toLowerCase().includes('theek') ||
          combined.toLowerCase().includes('average')
      ).toBe(true);
    });

    it('generates constructive negative (1-2 star) Hinglish review drafts', async () => {
      const drafts = await provider.generateReviewDrafts({
        rating: 1,
        selectedTags: ['Staff Behaviour'],
        customerNote: 'Staff was busy',
        language: 'hinglish',
      });

      expect(drafts).toHaveLength(3);
      const combined = drafts.map((d) => d.text).join(' ');
      expect(combined.toLowerCase()).toContain('disappointing');
    });
  });

  describe('3. AI Owner Reply Drafts in English, Gujlish, and Hinglish', () => {
    it('generates AI owner review reply drafts in en, gujlish, and hinglish', async () => {
      const replyEn = await provider.generateOwnerReplyDraft({
        reviewerName: 'Priya Sharma',
        rating: 5,
        reviewText: 'Loved the silk saree collection and friendly staff!',
        language: 'en',
        shopName: 'Aura Boutique',
      });

      expect(replyEn).toContain('Priya');
      expect(replyEn.length).toBeGreaterThan(20);

      const replyHinglish = await provider.generateOwnerReplyDraft({
        reviewerName: 'Rahul Patel',
        rating: 5,
        reviewText: 'Great kurtas and fitting was perfect.',
        language: 'hinglish',
        shopName: 'Aura Boutique',
      });

      expect(replyHinglish).toContain('Rahul');
      expect(replyHinglish.toLowerCase()).toContain('collection');
      expect(replyHinglish.toLowerCase()).toContain('shukriya');

      const replyGujlish = await provider.generateOwnerReplyDraft({
        reviewerName: 'Dharmesh Bhai',
        rating: 1,
        reviewText: 'Size was not available.',
        language: 'gujlish',
        shopName: 'Aura Boutique',
      });

      expect(replyGujlish).toContain('Dharmesh');
      expect(/[\u0A80-\u0AFF]/.test(replyGujlish)).toBe(true);
      expect(replyGujlish.toLowerCase()).toContain('sorry');
    });
  });

  describe('4. Prompt Construction & System Rules', () => {
    it('constructs AI prompt with strict non-hallucination and Gujlish/Hinglish rules', () => {
      const promptGujlish = buildUserPrompt({
        rating: 5,
        selectedTags: ['Clothing Quality', 'Comfort'],
        customerNote: 'Great fitting kurta',
        shopName: 'Heritage Silk Boutique',
        language: 'gujlish',
      });

      expect(promptGujlish).toContain('Heritage Silk Boutique');
      expect(promptGujlish).toContain('Gujlish');
      expect(promptGujlish).toContain('strictly no unstated facts or fabricated item purchases');

      const promptHinglish = buildUserPrompt({
        rating: 4,
        selectedTags: ['Fabric Quality'],
        customerNote: '',
        shopName: 'Maison & Thread',
        language: 'hinglish',
      });

      expect(promptHinglish).toContain('Hinglish');
      expect(promptHinglish).toContain('Maison & Thread');

      // Verify system prompt safety constraints
      expect(AI_REVIEW_SYSTEM_PROMPT).toContain('CRITICAL NON-FABRICATION CONSTRAINTS');
      expect(AI_REVIEW_SYSTEM_PROMPT).toContain('NEVER write robotic, corporate, or artificial marketing reviews');
      expect(AI_REVIEW_SYSTEM_PROMPT).toContain('Gujlish');
      expect(AI_REVIEW_SYSTEM_PROMPT).toContain('Hinglish');
    });
  });
});
