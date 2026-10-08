import type { AIServiceProvider, GenerateReviewDraftsInput, ReviewDraft } from './types';
import { AIProviderError } from './types';
import { AI_REVIEW_SYSTEM_PROMPT, buildUserPrompt } from './prompt';
import { validateAndSanitizeAIDrafts } from '@/lib/validation/ai-schema';

/**
 * Google Gemini Provider implementation using standard REST API.
 * Uses structured JSON mode and lightweight native fetch without heavy vendor SDKs.
 */
export class GeminiProvider implements AIServiceProvider {
  readonly name = 'gemini';
  private readonly apiKey: string;
  private readonly model: string;

  constructor(apiKey: string, model = 'gemini-3.8-flash') {
    if (!apiKey) {
      throw new AIProviderError('AI_CONFIGURATION_ERROR', 'Gemini API key is missing.');
    }
    this.apiKey = apiKey;
    this.model = model;
  }

  async generateReviewDrafts(input: GenerateReviewDraftsInput): Promise<ReviewDraft[]> {
    const userPrompt = buildUserPrompt(input);
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: AI_REVIEW_SYSTEM_PROMPT }],
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: userPrompt }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            responseMimeType: 'application/json',
          },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        if (response.status === 429) {
          const retryHeader = response.headers.get('retry-after');
          let retryAfterSeconds = retryHeader ? parseInt(retryHeader, 10) : 15;
          if (isNaN(retryAfterSeconds) || retryAfterSeconds <= 0) {
            retryAfterSeconds = 15;
          }

          console.warn('[GeminiProvider] Upstream Gemini 429 rate limit or quota exceeded', {
            retryAfterSeconds,
          });

          throw new AIProviderError(
            'AI_RATE_LIMITED',
            'AI generation rate limit exceeded.',
            retryAfterSeconds,
            true
          );
        }
        throw new AIProviderError(
          'AI_SERVICE_UNAVAILABLE',
          `Gemini API responded with status ${response.status}`
        );
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        throw new AIProviderError('AI_INVALID_RESPONSE', 'Gemini returned an empty response.');
      }

      const parsedJson = JSON.parse(rawText);
      return validateAndSanitizeAIDrafts(parsedJson, input.language);
    } catch (err: unknown) {
      if (err instanceof AIProviderError) throw err;
      if (err instanceof Error && err.name === 'AbortError') {
        throw new AIProviderError('AI_SERVICE_UNAVAILABLE', 'AI request timed out.');
      }
      throw new AIProviderError(
        'AI_SERVICE_UNAVAILABLE',
        'Failed to generate review drafts with Gemini.'
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}
