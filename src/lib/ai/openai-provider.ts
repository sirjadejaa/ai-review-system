import type { AIServiceProvider, GenerateReviewDraftsInput, ReviewDraft } from './types';
import { AIProviderError } from './types';
import { AI_REVIEW_SYSTEM_PROMPT, buildUserPrompt } from './prompt';
import { validateAndSanitizeAIDrafts } from '@/lib/validation/ai-schema';

/**
 * OpenAI Provider implementation using Chat Completions REST API.
 * Uses structured JSON mode with native fetch.
 */
export class OpenAIProvider implements AIServiceProvider {
  readonly name = 'openai';
  private readonly apiKey: string;
  private readonly model: string;

  constructor(apiKey: string, model = 'gpt-4o-mini') {
    if (!apiKey) {
      throw new AIProviderError('AI_CONFIGURATION_ERROR', 'OpenAI API key is missing.');
    }
    this.apiKey = apiKey;
    this.model = model;
  }

  async generateReviewDrafts(input: GenerateReviewDraftsInput): Promise<ReviewDraft[]> {
    const userPrompt = buildUserPrompt(input);
    const endpoint = 'https://api.openai.com/v1/chat/completions';

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: AI_REVIEW_SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.7,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new AIProviderError('AI_RATE_LIMITED', 'OpenAI rate limit exceeded.');
        }
        throw new AIProviderError(
          'AI_SERVICE_UNAVAILABLE',
          `OpenAI API responded with status ${response.status}`
        );
      }

      const data = await response.json();
      const rawText = data?.choices?.[0]?.message?.content;

      if (!rawText) {
        throw new AIProviderError('AI_INVALID_RESPONSE', 'OpenAI returned an empty response.');
      }

      const parsedJson = JSON.parse(rawText);
      return validateAndSanitizeAIDrafts(parsedJson, input.language);
    } catch (err: unknown) {
      if (err instanceof AIProviderError) throw err;
      if (err instanceof Error && err.name === 'AbortError') {
        throw new AIProviderError('AI_SERVICE_UNAVAILABLE', 'OpenAI request timed out.');
      }
      throw new AIProviderError(
        'AI_SERVICE_UNAVAILABLE',
        'Failed to generate review drafts with OpenAI.'
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}
