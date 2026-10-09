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
    maxRetries = 2
  ): Promise<Response> {
    const overallStartTime = Date.now();
    const overallTimeoutMs = 20000; // 20s overall timeout across all attempts

    let lastError: unknown = null;
    let lastResponse: Response | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const remainingTime = overallTimeoutMs - (Date.now() - overallStartTime);
      if (remainingTime <= 1000) {
        throw new AIProviderError('AI_SERVICE_UNAVAILABLE', 'AI request timed out.');
      }

      const attemptTimeoutMs = Math.min(8000, remainingTime);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), attemptTimeoutMs);

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

        clearTimeout(timeout);
        lastResponse = response;

        // Success - return immediately
        if (response.ok) {
          return response;
        }

        // Check if status is a retryable transient error: 500, 502, 503, 504, or short 429
        const isTransient = [429, 500, 502, 503, 504].includes(response.status);

        if (attempt < maxRetries && isTransient) {
          const retryHeader = response.headers?.get ? response.headers.get('retry-after') : null;
          const parsedRetryAfter = retryHeader ? parseInt(retryHeader, 10) : NaN;

          // If Retry-After is > 3s, do not stall the current server action; surface rate limit immediately
          if (!isNaN(parsedRetryAfter) && parsedRetryAfter > 3) {
            return response;
          }

          let delayMs: number;
          if (!isNaN(parsedRetryAfter) && parsedRetryAfter > 0 && parsedRetryAfter <= 3) {
            delayMs = parsedRetryAfter * 1000;
          } else {
            // Exponential backoff with jitter: 300ms * 2^attempt + jitter (0-150ms)
            const baseMs = 300 * Math.pow(2, attempt);
            const jitterMs = Math.floor(Math.random() * 150);
            delayMs = baseMs + jitterMs;
          }

          console.warn(
            `[GeminiProvider] Transient HTTP ${response.status} on attempt ${attempt + 1}/${maxRetries + 1}, retrying in ${delayMs}ms...`
          );
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }

        // Non-transient error (e.g. 400, 401, 403, 404) or retries exhausted: return response
        return response;
      } catch (err: unknown) {
        clearTimeout(timeout);
        lastError = err;

        const isAbort = err instanceof Error && err.name === 'AbortError';
        const isOverallTimeout = Date.now() - overallStartTime >= overallTimeoutMs;

        if (attempt < maxRetries && !isAbort && !isOverallTimeout) {
          const baseMs = 300 * Math.pow(2, attempt);
          const jitterMs = Math.floor(Math.random() * 150);
          const delayMs = baseMs + jitterMs;

          console.warn(
            `[GeminiProvider] Network failure on attempt ${attempt + 1}/${maxRetries + 1}, retrying in ${delayMs}ms...`,
            { error: err instanceof Error ? err.message : String(err) }
          );
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }

        if (isAbort) {
          throw new AIProviderError('AI_SERVICE_UNAVAILABLE', 'AI request timed out.');
        }

        throw err;
      }
    }

    if (lastResponse) {
      return lastResponse;
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

        if (response.status === 503) {
          console.warn('[GeminiProvider] Gemini 503 Service Unavailable after retries', {
            status: 503,
            providerStatus,
            message: providerMessage,
          });
          throw new AIProviderError(
            'AI_SERVICE_UNAVAILABLE',
            `Gemini API responded with status 503 (Service Unavailable): ${providerMessage || 'Upstream service busy'}`
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
