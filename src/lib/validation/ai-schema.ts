import { z } from 'zod';
import { FeedbackTagSchema, PREDEFINED_FEEDBACK_TAGS } from './feedback-schema';
import type { LanguageCode, ReviewDraft } from '@/lib/ai/types';

export const LanguageCodeSchema = z.enum(['en', 'hi', 'hinglish']);

export const GenerateReviewDraftsInputSchema = z.object({
  rating: z
    .number({ message: 'Please select a rating' })
    .int('Rating must be an integer')
    .min(1, 'Rating must be at least 1 star')
    .max(5, 'Rating cannot exceed 5 stars'),
  selectedTags: z
    .array(FeedbackTagSchema)
    .max(PREDEFINED_FEEDBACK_TAGS.length, 'Too many tags selected')
    .optional()
    .default([]),
  customerNote: z
    .string()
    .trim()
    .max(1000, 'Customer note cannot exceed 1000 characters')
    .optional()
    .transform((val) => (val && val.length > 0 ? val : undefined)),
  language: LanguageCodeSchema.default('en'),
  shopName: z.string().trim().max(100).optional(),
});

export type GenerateReviewDraftsInputData = z.input<typeof GenerateReviewDraftsInputSchema>;

export const RawAIDraftItemSchema = z.object({
  id: z.string().trim().min(1),
  text: z.string().trim().min(5, 'Draft too short').max(600, 'Draft too long'),
});

export const RawAIDraftsOutputSchema = z.object({
  drafts: z.array(RawAIDraftItemSchema).length(3, 'AI must produce exactly 3 review drafts'),
});

const FORBIDDEN_FABRICATIONS = [
  /<[^>]*>/, // HTML tags
  /javascript:/i,
  /cured\s+(my|me)/i,
  /prescribed\s+(me|by)/i,
  /\bdr\.\s+[a-z]+/i,
  /\bdoctor\s+recommended/i,
  /\bdiscount\s+\d+%/i,
  /\bfree\s+(medicines|drugs|consultation)/i,
];

/**
 * Validates and sanitizes drafts produced by an AI provider.
 * Enforces plain-text rules, draft counts, and basic non-fabrication sanity checks.
 */
export function validateAndSanitizeAIDrafts(
  data: unknown,
  expectedLanguage: LanguageCode
): ReviewDraft[] {
  const parsed = RawAIDraftsOutputSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error('AI response format was invalid or did not contain exactly 3 drafts.');
  }

  const drafts: ReviewDraft[] = [];

  for (const item of parsed.data.drafts) {
    // Check forbidden fabrication / HTML injections
    for (const pattern of FORBIDDEN_FABRICATIONS) {
      if (pattern.test(item.text)) {
        throw new Error('AI output contained disallowed promotional or medical claims.');
      }
    }

    drafts.push({
      id: item.id,
      text: item.text.replace(/[\r\n]+/g, ' ').trim(),
      language: expectedLanguage,
    });
  }

  return drafts;
}
