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

  constructor(apiKey: string, model?: string) {
    if (!apiKey) {
      throw new AIProviderError('AI_CONFIGURATION_ERROR', 'Gemini API key is missing.');
    }
    this.apiKey = apiKey;
    this.model = model || process.env.AI_MODEL || 'gemini-3.8-flash';
  }

  private async fetchWithRetry(
    endpoint: string,
    payload: object,
    maxRetries = 1
  ): Promise<Response> {
    let lastError: unknown = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': this.apiKey,
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        // If server responded with 503/502/504 and we have retries left, wait and retry
        if (attempt < maxRetries && [502, 503, 504].includes(response.status)) {
          clearTimeout(timeout);
          console.warn(`[GeminiProvider] Transient HTTP ${response.status}, retrying in 500ms...`);
          await new Promise((resolve) => setTimeout(resolve, 500));
          continue;
        }

        clearTimeout(timeout);
        return response;
      } catch (err: unknown) {
        clearTimeout(timeout);
        lastError = err;

        // If transient connection reset / socket drop and we have retries left, wait and retry
        const isAbort = err instanceof Error && err.name === 'AbortError';
        if (attempt < maxRetries && !isAbort) {
          console.warn('[GeminiProvider] Network connection reset or dropped, retrying in 500ms...', {
            attempt: attempt + 1,
            error: err instanceof Error ? err.message : String(err),
          });
          await new Promise((resolve) => setTimeout(resolve, 500));
          continue;
        }

        throw err;
      }
    }

    throw lastError;
  }

  async generateReviewDrafts(input: GenerateReviewDraftsInput): Promise<ReviewDraft[]> {
    const userPrompt = buildUserPrompt(input);
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const requestPayload = {
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
    };

    try {
      const response = await this.fetchWithRetry(endpoint, requestPayload);

      if (!response.ok) {
        let errorData: { error?: { code?: number; message?: string; status?: string } } | null = null;
        try {
          errorData = await response.json();
        } catch {
          // Non-JSON error body
        }

        const providerStatus = errorData?.error?.status;
        const providerMessage = errorData?.error?.message || response.statusText;

        // Check for rate limiting or quota exhaustion (HTTP 429 or RESOURCE_EXHAUSTED status)
        if (response.status === 429 || providerStatus === 'RESOURCE_EXHAUSTED') {
          const retryHeader = response.headers?.get ? response.headers.get('retry-after') : null;
          let retryAfterSeconds = retryHeader ? parseInt(retryHeader, 10) : 15;
          if (isNaN(retryAfterSeconds) || retryAfterSeconds <= 0) {
            retryAfterSeconds = 15;
          }

          console.warn('[GeminiProvider] Upstream Gemini rate limit or quota exceeded', {
            status: response.status,
            providerStatus,
            retryAfterSeconds,
          });

          throw new AIProviderError(
            'AI_RATE_LIMITED',
            'AI generation rate limit exceeded.',
            retryAfterSeconds,
            true
          );
        }

        // Check for authentication / permission / bad request issues
        if (response.status === 401 || response.status === 403) {
          console.warn('[GeminiProvider] Gemini API credentials or permission error', {
            status: response.status,
            providerStatus,
          });
          throw new AIProviderError(
            'AI_CONFIGURATION_ERROR',
            `Gemini API authorization failed with status ${response.status}`
          );
        }

        if (response.status === 404) {
          console.warn('[GeminiProvider] Gemini model endpoint not found (404)', {
            model: this.model,
          });
          throw new AIProviderError(
            'AI_SERVICE_UNAVAILABLE',
            `Gemini API responded with status 404: Model '${this.model}' not found.`
          );
        }

        console.warn('[GeminiProvider] Upstream Gemini non-OK response', {
          status: response.status,
          providerStatus,
          message: providerMessage,
        });

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

      // Strip potential markdown code fences (e.g. ```json ... ```)
      const cleanJson = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(cleanJson);
      } catch {
        throw new AIProviderError('AI_INVALID_RESPONSE', 'Failed to parse Gemini JSON output.');
      }

      try {
        return validateAndSanitizeAIDrafts(parsedJson, input.language);
      } catch (validationErr: unknown) {
        throw new AIProviderError(
          'AI_INVALID_RESPONSE',
          validationErr instanceof Error ? validationErr.message : 'Invalid draft schema.'
        );
      }
    } catch (err: unknown) {
      if (err instanceof AIProviderError) throw err;
      if (err instanceof Error && err.name === 'AbortError') {
        throw new AIProviderError('AI_SERVICE_UNAVAILABLE', 'AI request timed out.');
      }
      throw new AIProviderError(
        'AI_SERVICE_UNAVAILABLE',
        `Failed to generate review drafts with Gemini: ${err instanceof Error ? err.message : 'Unknown network failure'}`
      );
    }
  }
}
