import type { AIServiceProvider, GenerateReviewDraftsInput, ReviewDraft } from './types';
import { AIProviderError } from './types';
import { AI_REVIEW_SYSTEM_PROMPT, buildUserPrompt } from './prompt';
import { validateAndSanitizeAIDrafts } from '@/lib/validation/ai-schema';

/**
 * Ollama Cloud Provider implementation using OpenAI-compatible Chat Completions REST API.
 * Uses structured JSON mode and lightweight native fetch without heavy vendor SDKs.
 */
export class OllamaProvider implements AIServiceProvider {
  readonly name = 'ollama';
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;

  constructor(apiKey: string, model?: string, baseUrl?: string) {
    if (!apiKey) {
      throw new AIProviderError('AI_CONFIGURATION_ERROR', 'Ollama API key is missing.');
    }
    const resolvedModel = (model !== undefined ? model : process.env.OLLAMA_MODEL || 'gemma4:31b').trim();
    if (!resolvedModel) {
      throw new AIProviderError('AI_CONFIGURATION_ERROR', 'Ollama model is missing.');
    }

    this.apiKey = apiKey;
    this.model = resolvedModel;
    const rawBaseUrl = baseUrl || process.env.OLLAMA_BASE_URL || 'https://ollama.com/v1';
    this.baseUrl = rawBaseUrl.replace(/\/+$/, '');
  }

  private async fetchWithRetry(
    endpoint: string,
    payload: object,
    maxRetries = 2
  ): Promise<Response> {
    const overallStartTime = Date.now();
    const overallTimeoutMs = 8500; // 8.5s overall timeout across all attempts to stay within Vercel's limit

    let lastError: unknown = null;
    let lastResponse: Response | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const remainingTime = overallTimeoutMs - (Date.now() - overallStartTime);
      if (remainingTime <= 1000) {
        throw new AIProviderError(
          'AI_SERVICE_UNAVAILABLE',
          'AI request timed out.',
          undefined,
          undefined,
          'PROVIDER_OVERALL_TIMEOUT',
          408
        );
      }

      const attemptTimeoutMs = Math.min(5000, remainingTime);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), attemptTimeoutMs);
      const attemptStartTime = Date.now();

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeout);
        lastResponse = response;
        const attemptDurationMs = Date.now() - attemptStartTime;

        // Success - return immediately
        if (response.ok) {
          console.info('[OllamaProvider Timing] Request succeeded', {
            attempt: attempt + 1,
            attemptDurationMs,
            totalDurationMs: Date.now() - overallStartTime,
            status: response.status,
          });
          return response;
        }

        // Check if status is a retryable transient error: 408, 429, 500, 502, 503, 504
        const isTransient = [408, 429, 500, 502, 503, 504].includes(response.status);

        if (attempt < maxRetries && isTransient) {
          const retryHeader = response.headers?.get ? response.headers.get('retry-after') : null;
          const parsedRetryAfter = retryHeader ? parseInt(retryHeader, 10) : NaN;

          // If Retry-After is > 2s, do not stall the current server action; surface rate limit immediately
          if (!isNaN(parsedRetryAfter) && (parsedRetryAfter > 2 || parsedRetryAfter * 1000 >= remainingTime - 1000)) {
            return response;
          }

          let delayMs: number;
          if (!isNaN(parsedRetryAfter) && parsedRetryAfter > 0 && parsedRetryAfter <= 2) {
            delayMs = parsedRetryAfter * 1000;
          } else {
            // Exponential backoff with jitter: 250ms * 2^attempt + jitter (0-100ms)
            const baseMs = 250 * Math.pow(2, attempt);
            const jitterMs = Math.floor(Math.random() * 100);
            delayMs = baseMs + jitterMs;
          }

          // If not enough time left in serverless function budget to wait and retry safely, break
          if (remainingTime - delayMs <= 1500) {
            console.warn(
              `[OllamaProvider] Skipping retry on HTTP ${response.status} due to timeout budget exhaustion (${remainingTime}ms remaining)`
            );
            return response;
          }

          console.warn(
            `[OllamaProvider] Transient HTTP ${response.status} on attempt ${attempt + 1}/${maxRetries + 1}, retrying in ${delayMs}ms...`
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
          const baseMs = 250 * Math.pow(2, attempt);
          const jitterMs = Math.floor(Math.random() * 100);
          const delayMs = baseMs + jitterMs;

          if (remainingTime - delayMs > 1500) {
            console.warn(
              `[OllamaProvider] Network failure on attempt ${attempt + 1}/${maxRetries + 1}, retrying in ${delayMs}ms...`,
              { error: err instanceof Error ? err.message : String(err) }
            );
            await new Promise((resolve) => setTimeout(resolve, delayMs));
            continue;
          }
        }

        if (isAbort) {
          const timeoutLayer =
            isOverallTimeout || remainingTime <= 1000
              ? 'PROVIDER_OVERALL_TIMEOUT'
              : 'PROVIDER_ATTEMPT_TIMEOUT';
          throw new AIProviderError(
            'AI_SERVICE_UNAVAILABLE',
            'AI request timed out.',
            undefined,
            undefined,
            timeoutLayer,
            408
          );
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
    const providerStartTime = Date.now();
    const userPrompt = buildUserPrompt(input);
    const endpoint = `${this.baseUrl}/chat/completions`;

    const requestPayload = {
      model: this.model,
      messages: [
        {
          role: 'system',
          content: AI_REVIEW_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      response_format: { type: 'json_object' },
      stream: false,
      max_tokens: 350,
      temperature: 0.7,
    };

    try {
      const response = await this.fetchWithRetry(endpoint, requestPayload);

      if (!response.ok) {
        let errorData: { error?: { code?: string | number; message?: string; type?: string } } | null = null;
        try {
          errorData = await response.json();
        } catch {
          // Non-JSON error body
        }

        const providerMessage = errorData?.error?.message || response.statusText;

        // Check for rate limiting or quota exhaustion
        if (response.status === 429) {
          const retryHeader = response.headers?.get ? response.headers.get('retry-after') : null;
          let retryAfterSeconds = retryHeader ? parseInt(retryHeader, 10) : 15;
          if (isNaN(retryAfterSeconds) || retryAfterSeconds <= 0) {
            retryAfterSeconds = 15;
          }

          console.warn('[OllamaProvider] Ollama Cloud rate limit or quota exceeded', {
            status: response.status,
            retryAfterSeconds,
          });

          throw new AIProviderError(
            'AI_RATE_LIMITED',
            'AI generation rate limit exceeded.',
            retryAfterSeconds,
            true,
            undefined,
            429
          );
        }

        // Check for authentication / permission issues
        if (response.status === 401 || response.status === 403) {
          console.warn('[OllamaProvider] Ollama API credentials or permission error', {
            status: response.status,
          });
          throw new AIProviderError(
            'AI_CONFIGURATION_ERROR',
            `Ollama API authorization failed with status ${response.status}`,
            undefined,
            undefined,
            undefined,
            response.status
          );
        }

        if (response.status === 404) {
          console.warn('[OllamaProvider] Ollama model or endpoint not found (404)', {
            model: this.model,
          });
          throw new AIProviderError(
            'AI_SERVICE_UNAVAILABLE',
            `Ollama API responded with status 404: Model '${this.model}' not found.`,
            undefined,
            undefined,
            undefined,
            404
          );
        }

        if (response.status === 503) {
          console.warn('[OllamaProvider] Ollama 503 Service Unavailable after retries', {
            status: 503,
            message: providerMessage,
          });
          throw new AIProviderError(
            'AI_SERVICE_UNAVAILABLE',
            `Ollama API responded with status 503 (Service Unavailable): ${providerMessage || 'Upstream service busy'}`,
            undefined,
            undefined,
            undefined,
            503
          );
        }

        console.warn('[OllamaProvider] Upstream Ollama non-OK response', {
          status: response.status,
          message: providerMessage,
        });

        throw new AIProviderError(
          'AI_SERVICE_UNAVAILABLE',
          `Ollama API responded with status ${response.status}`,
          undefined,
          undefined,
          undefined,
          response.status
        );
      }

      const data = await response.json();
      const rawText = data?.choices?.[0]?.message?.content;

      if (!rawText) {
        throw new AIProviderError('AI_INVALID_RESPONSE', 'Ollama returned an empty response.');
      }

      // Strip potential markdown code fences (e.g. ```json ... ```)
      const cleanJson = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(cleanJson);
      } catch {
        throw new AIProviderError('AI_INVALID_RESPONSE', 'Failed to parse Ollama JSON output.');
      }

      let drafts: ReviewDraft[];
      try {
        drafts = validateAndSanitizeAIDrafts(parsedJson, input.language);
      } catch (validationErr: unknown) {
        throw new AIProviderError(
          'AI_INVALID_RESPONSE',
          validationErr instanceof Error ? validationErr.message : 'Invalid draft schema.'
        );
      }

      const providerDurationMs = Date.now() - providerStartTime;
      console.info('[OllamaProvider Timing] Draft generation completed', {
        model: this.model,
        providerDurationMs,
        draftsCount: drafts.length,
      });

      return drafts;
    } catch (err: unknown) {
      if (err instanceof AIProviderError) throw err;
      if (err instanceof Error && err.name === 'AbortError') {
        throw new AIProviderError(
          'AI_SERVICE_UNAVAILABLE',
          'AI request timed out.',
          undefined,
          undefined,
          'PROVIDER_ATTEMPT_TIMEOUT',
          408
        );
      }
      throw new AIProviderError(
        'AI_SERVICE_UNAVAILABLE',
        `Failed to generate review drafts with Ollama: ${err instanceof Error ? err.message : 'Unknown network failure'}`
      );
    }
  }
}
