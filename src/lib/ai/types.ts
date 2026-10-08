import type { LanguageCode } from '@/types';

export type { LanguageCode };

export interface ReviewDraft {
  id: string;
  text: string;
  language: LanguageCode;
}

export interface GenerateReviewDraftsInput {
  rating: number; // 1 to 5
  selectedTags: string[]; // Controlled whitelist tags
  customerNote?: string; // Optional user note (max 1000 characters)
  language: LanguageCode; // 'en' | 'hi' | 'hinglish'
  shopName?: string; // Single pharmacy branding
}

/**
 * Standard AI Service Provider interface.
 * Decouples the application layer from vendor SDKs (Gemini, OpenAI, Mock).
 */
export interface AIServiceProvider {
  readonly name: string;
  generateReviewDrafts(input: GenerateReviewDraftsInput): Promise<ReviewDraft[]>;
}

export type AIErrorCode =
  | 'AI_SERVICE_UNAVAILABLE'
  | 'AI_RATE_LIMITED'
  | 'AI_INVALID_RESPONSE'
  | 'AI_CONFIGURATION_ERROR';

export class AIProviderError extends Error {
  constructor(
    public readonly code: AIErrorCode,
    message: string,
    public readonly retryAfterSeconds?: number,
    public readonly isProviderQuota?: boolean
  ) {
    super(message);
    this.name = 'AIProviderError';
  }
}
