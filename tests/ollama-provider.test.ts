import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OllamaProvider } from '@/lib/ai/ollama-provider';
import { AIProviderError } from '@/lib/ai/types';
import { getAIProvider, setAIProvider } from '@/lib/ai/provider-factory';
import { generateReviewDraftsAction, clearAIDraftsCache } from '@/lib/actions/ai-review-actions';
import { clearAIRateLimits } from '@/lib/ai/rate-limiter';

describe('Ollama Cloud Provider (OpenAI-compatible Chat Completions)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    clearAIRateLimits();
    setAIProvider(null);
  });

  describe('1. Configuration & Initialization', () => {
    it('throws AI_CONFIGURATION_ERROR when API key is missing', () => {
      expect(() => new OllamaProvider('', 'gemma4:31b')).toThrowError(AIProviderError);
      try {
        new OllamaProvider('', 'gemma4:31b');
      } catch (err) {
        expect((err as AIProviderError).code).toBe('AI_CONFIGURATION_ERROR');
        expect((err as AIProviderError).message).toContain('Ollama API key is missing');
      }
    });

    it('throws AI_CONFIGURATION_ERROR when model identifier is empty', () => {
      const originalModel = process.env.OLLAMA_MODEL;
      delete process.env.OLLAMA_MODEL;
      try {
        expect(() => new OllamaProvider('test-key', '')).toThrowError(AIProviderError);
      } finally {
        if (originalModel) process.env.OLLAMA_MODEL = originalModel;
      }
    });

    it('normalizes base URL and trims trailing slashes', async () => {
      let requestedUrl = '';
      globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
        requestedUrl = url;
        return {
          ok: true,
          json: async () => ({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    drafts: [
                      { id: 'draft-1', text: 'Quick and helpful service.' },
                      { id: 'draft-2', text: 'Clean pharmacy and polite team.' },
                      { id: 'draft-3', text: 'Got all necessary medicines on time.' },
                    ],
                  }),
                },
              },
            ],
          }),
        };
      });

      const provider = new OllamaProvider('test-key', 'gemma4:31b', 'https://ollama.com/v1///');
      await provider.generateReviewDrafts({
        rating: 5,
        selectedTags: ['Quick Service'],
        language: 'en',
      });

      expect(requestedUrl).toBe('https://ollama.com/v1/chat/completions');
    });
  });

  describe('2. Request Formatting & Successful Generation', () => {
    it('sends correct Authorization header, stream: false, response_format, and max_tokens', async () => {
      let capturedInit: RequestInit | undefined;
      globalThis.fetch = vi.fn().mockImplementation(async (_url: string, init: RequestInit) => {
        capturedInit = init;
        return {
          ok: true,
          json: async () => ({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    drafts: [
                      { id: 'draft-1', text: 'Quick and courteous staff.' },
                      { id: 'draft-2', text: 'Medicines were in stock.' },
                      { id: 'draft-3', text: 'Smooth experience at this store.' },
                    ],
                  }),
                },
              },
            ],
          }),
        };
      });

      const provider = new OllamaProvider('test-secret-key-123', 'gemma4:31b', 'https://ollama.com/v1');
      const drafts = await provider.generateReviewDrafts({
        rating: 5,
        selectedTags: ['Quick Service', 'Polite Staff'],
        customerNote: 'Very satisfied with visit',
        language: 'en',
      });

      expect(drafts).toHaveLength(3);
      expect(drafts[0].id).toBe('draft-1');
      expect(drafts[0].language).toBe('en');

      expect(capturedInit?.method).toBe('POST');
      const headers = capturedInit?.headers as Record<string, string>;
      expect(headers['Authorization']).toBe('Bearer test-secret-key-123');
      expect(headers['Content-Type']).toBe('application/json');

      const body = JSON.parse(capturedInit?.body as string);
      expect(body.model).toBe('gemma4:31b');
      expect(body.stream).toBe(false);
      expect(body.max_tokens).toBe(350);
      expect(body.response_format).toEqual({ type: 'json_object' });
      expect(body.messages).toHaveLength(2);
      expect(body.messages[0].role).toBe('system');
      expect(body.messages[1].role).toBe('user');
    });

    it('strips markdown code fences from JSON output', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content:
                  '```json\n' +
                  JSON.stringify({
                    drafts: [
                      { id: 'draft-1', text: 'Helpful and polite staff.' },
                      { id: 'draft-2', text: 'All medicines were readily available.' },
                      { id: 'draft-3', text: 'Fast checkout and courteous pharmacists.' },
                    ],
                  }) +
                  '\n```',
              },
            },
          ],
        }),
      });

      const provider = new OllamaProvider('test-key', 'gemma4:31b');
      const drafts = await provider.generateReviewDrafts({
        rating: 5,
        selectedTags: ['Polite Staff'],
        language: 'en',
      });

      expect(drafts).toHaveLength(3);
      expect(drafts[0].text).toBe('Helpful and polite staff.');
    });
  });

  describe('3. Multi-Language Support (English, Hindi, Hinglish)', () => {
    it('generates Hindi drafts in Devanagari script', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  drafts: [
                    { id: 'draft-1', text: 'सेवा काफी अच्छी थी और स्टाफ भी मददगार था।' },
                    { id: 'draft-2', text: 'यहाँ पर सभी जरूरी दवाइयां आसानी से मिल गईं।' },
                    { id: 'draft-3', text: 'बहुत बढ़िया मेडिकल स्टोर, तुरंत सहायता मिली।' },
                  ],
                }),
              },
            },
          ],
        }),
      });

      const provider = new OllamaProvider('test-key', 'gemma4:31b');
      const drafts = await provider.generateReviewDrafts({
        rating: 5,
        selectedTags: ['Medicines in Stock'],
        language: 'hi',
      });

      expect(drafts).toHaveLength(3);
      expect(drafts[0].language).toBe('hi');
      const hasDevanagari = drafts.some((d) => /[\u0900-\u097F]/.test(d.text));
      expect(hasDevanagari).toBe(true);
    });

    it('generates Hinglish drafts in Latin script without Devanagari', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  drafts: [
                    { id: 'draft-1', text: 'Service kaafi quick tha aur staff helpful tha.' },
                    { id: 'draft-2', text: 'Saari medicines easily mil gayi bina kisi wait ke.' },
                    { id: 'draft-3', text: 'Good experience, pharmacists polite the.' },
                  ],
                }),
              },
            },
          ],
        }),
      });

      const provider = new OllamaProvider('test-key', 'gemma4:31b');
      const drafts = await provider.generateReviewDrafts({
        rating: 5,
        selectedTags: ['Quick Service'],
        language: 'hinglish',
      });

      expect(drafts).toHaveLength(3);
      drafts.forEach((d) => {
        expect(d.language).toBe('hinglish');
        expect(/[\u0900-\u097F]/.test(d.text)).toBe(false);
      });
    });
  });

  describe('4. Error Mapping & Bounded Retries', () => {
    it('maps HTTP 401 and 403 to AI_CONFIGURATION_ERROR without retrying', async () => {
      let callCount = 0;
      globalThis.fetch = vi.fn().mockImplementation(async () => {
        callCount++;
        return {
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          json: async () => ({ error: { message: 'Invalid API key' } }),
        };
      });

      const provider = new OllamaProvider('bad-key', 'gemma4:31b');
      try {
        await provider.generateReviewDrafts({
          rating: 5,
          selectedTags: ['Quick Service'],
          language: 'en',
        });
        expect.fail('Should throw configuration error');
      } catch (err) {
        expect(err).toBeInstanceOf(AIProviderError);
        expect((err as AIProviderError).code).toBe('AI_CONFIGURATION_ERROR');
        expect(callCount).toBe(1); // Permanent error must not retry
      }
    });

    it('maps HTTP 404 to AI_SERVICE_UNAVAILABLE (model or endpoint not found)', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: { message: 'model not found' } }),
      });

      const provider = new OllamaProvider('test-key', 'non-existent-model');
      try {
        await provider.generateReviewDrafts({
          rating: 5,
          selectedTags: ['Quick Service'],
          language: 'en',
        });
        expect.fail('Should throw service unavailable');
      } catch (err) {
        expect(err).toBeInstanceOf(AIProviderError);
        expect((err as AIProviderError).code).toBe('AI_SERVICE_UNAVAILABLE');
        expect((err as AIProviderError).message).toContain('404');
      }
    });

    it('maps HTTP 429 to AI_RATE_LIMITED with retryAfterSeconds', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        headers: new Headers({ 'retry-after': '25' }),
        json: async () => ({ error: { message: 'Rate limit exceeded' } }),
      });

      const provider = new OllamaProvider('test-key', 'gemma4:31b');
      try {
        await provider.generateReviewDrafts({
          rating: 5,
          selectedTags: ['Quick Service'],
          language: 'en',
        });
        expect.fail('Should throw rate limit');
      } catch (err) {
        expect(err).toBeInstanceOf(AIProviderError);
        expect((err as AIProviderError).code).toBe('AI_RATE_LIMITED');
        expect((err as AIProviderError).retryAfterSeconds).toBe(25);
      }
    });

    it('retries on HTTP 503 and succeeds on retry', async () => {
      let callCount = 0;
      globalThis.fetch = vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return {
            ok: false,
            status: 503,
            statusText: 'Service Unavailable',
            json: async () => ({ error: { message: 'Engine overloaded' } }),
          };
        }
        return {
          ok: true,
          json: async () => ({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    drafts: [
                      { id: 'draft-1', text: 'Quick service.' },
                      { id: 'draft-2', text: 'Helpful team.' },
                      { id: 'draft-3', text: 'Good store.' },
                    ],
                  }),
                },
              },
            ],
          }),
        };
      });

      const provider = new OllamaProvider('test-key', 'gemma4:31b');
      const drafts = await provider.generateReviewDrafts({
        rating: 5,
        selectedTags: ['Quick Service'],
        language: 'en',
      });

      expect(callCount).toBe(2);
      expect(drafts).toHaveLength(3);
    });

    it('retries on HTTP 408 Request Timeout and succeeds on retry', async () => {
      let callCount = 0;
      globalThis.fetch = vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return {
            ok: false,
            status: 408,
            statusText: 'Request Timeout',
            json: async () => ({ error: { message: 'Request timeout' } }),
          };
        }
        return {
          ok: true,
          json: async () => ({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    drafts: [
                      { id: 'draft-1', text: 'Quick service.' },
                      { id: 'draft-2', text: 'Helpful team.' },
                      { id: 'draft-3', text: 'Good store.' },
                    ],
                  }),
                },
              },
            ],
          }),
        };
      });

      const provider = new OllamaProvider('test-key', 'gemma4:31b');
      const drafts = await provider.generateReviewDrafts({
        rating: 5,
        selectedTags: ['Quick Service'],
        language: 'en',
      });

      expect(callCount).toBe(2);
      expect(drafts).toHaveLength(3);
    });

    it('handles request timeout and reports PROVIDER_ATTEMPT_TIMEOUT with 408 status', async () => {
      globalThis.fetch = vi.fn().mockImplementation(async () => {
        const err = new Error('The operation was aborted');
        err.name = 'AbortError';
        throw err;
      });

      const provider = new OllamaProvider('test-key', 'gemma4:31b');
      try {
        await provider.generateReviewDrafts({
          rating: 5,
          selectedTags: ['Quick Service'],
          language: 'en',
        });
        expect.fail('Should throw timeout error');
      } catch (err) {
        expect(err).toBeInstanceOf(AIProviderError);
        const providerErr = err as AIProviderError;
        expect(providerErr.code).toBe('AI_SERVICE_UNAVAILABLE');
        expect(providerErr.message).toContain('timed out');
        expect(providerErr.timeoutLayer).toBe('PROVIDER_ATTEMPT_TIMEOUT');
        expect(providerErr.httpStatus).toBe(408);
      }
    });

    it('maps empty or invalid JSON response to AI_INVALID_RESPONSE', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'not-valid-json' } }],
        }),
      });

      const provider = new OllamaProvider('test-key', 'gemma4:31b');
      await expect(
        provider.generateReviewDrafts({
          rating: 5,
          selectedTags: ['Quick Service'],
          language: 'en',
        })
      ).rejects.toThrowError(AIProviderError);
    });
  });

  describe('5. Provider Factory & Fallback Guard', () => {
    it('throws AI_CONFIGURATION_ERROR when AI_PROVIDER=ollama and API key is missing without falling back to Gemini', () => {
      const origProvider = process.env.AI_PROVIDER;
      const origKey = process.env.OLLAMA_API_KEY;
      const origNodeEnv = process.env.NODE_ENV;

      try {
        process.env.AI_PROVIDER = 'ollama';
        delete process.env.OLLAMA_API_KEY;
        // Temporarily set NODE_ENV to production to test factory live resolution
        // @ts-expect-error - overriding NODE_ENV for test
        process.env.NODE_ENV = 'production';

        expect(() => getAIProvider()).toThrowError(AIProviderError);
        try {
          getAIProvider();
        } catch (err) {
          expect((err as AIProviderError).code).toBe('AI_CONFIGURATION_ERROR');
          expect((err as AIProviderError).message).toContain('Ollama API key is missing');
        }
      } finally {
        if (origProvider) process.env.AI_PROVIDER = origProvider;
        if (origKey) process.env.OLLAMA_API_KEY = origKey;
        // @ts-expect-error - restoring NODE_ENV
        process.env.NODE_ENV = origNodeEnv;
      }
    });

    it('returns OllamaProvider when AI_PROVIDER=ollama and credentials are present', () => {
      const origProvider = process.env.AI_PROVIDER;
      const origKey = process.env.OLLAMA_API_KEY;
      const origNodeEnv = process.env.NODE_ENV;

      try {
        process.env.AI_PROVIDER = 'ollama';
        process.env.OLLAMA_API_KEY = 'test-valid-key';
        // @ts-expect-error - overriding NODE_ENV for test
        process.env.NODE_ENV = 'production';

        const provider = getAIProvider();
        expect(provider.name).toBe('ollama');
      } finally {
        if (origProvider) process.env.AI_PROVIDER = origProvider;
        if (origKey) process.env.OLLAMA_API_KEY = origKey;
        // @ts-expect-error - restoring NODE_ENV
        process.env.NODE_ENV = origNodeEnv;
      }
    });
  });

  describe('6. Integration with Cache and Deduplication', () => {
    it('serves cached drafts on identical input when Ollama is configured', async () => {
      await clearAIDraftsCache();
      const mockGenerate = vi.fn().mockResolvedValue([
        { id: 'draft-1', text: 'Ollama test 1', language: 'en' },
        { id: 'draft-2', text: 'Ollama test 2', language: 'en' },
        { id: 'draft-3', text: 'Ollama test 3', language: 'en' },
      ]);

      const ollamaMock = {
        name: 'ollama',
        generateReviewDrafts: mockGenerate,
      };
      setAIProvider(ollamaMock);

      const input = {
        rating: 5,
        selectedTags: ['Quick Service'] as ('Quick Service')[],
        language: 'en' as const,
      };

      const res1 = await generateReviewDraftsAction(input);
      expect(res1.success).toBe(true);
      expect(mockGenerate).toHaveBeenCalledTimes(1);

      const res2 = await generateReviewDraftsAction(input);
      expect(res2.success).toBe(true);
      expect(mockGenerate).toHaveBeenCalledTimes(1); // Served from cache
      expect(res2.drafts).toEqual(res1.drafts);
    });

    it('removes failed request from in-flight map and permits successful retry', async () => {
      await clearAIDraftsCache();
      let callCount = 0;
      const mockGenerate = vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          throw new AIProviderError('AI_SERVICE_UNAVAILABLE', 'Temporary Ollama glitch');
        }
        return [
          { id: 'draft-1', text: 'Retry draft 1', language: 'en' },
          { id: 'draft-2', text: 'Retry draft 2', language: 'en' },
          { id: 'draft-3', text: 'Retry draft 3', language: 'en' },
        ];
      });

      setAIProvider({
        name: 'ollama',
        generateReviewDrafts: mockGenerate,
      });

      const input = {
        rating: 5,
        selectedTags: ['Polite Staff'] as ('Polite Staff')[],
        customerNote: 'Specific retry note',
        language: 'en' as const,
      };

      const res1 = await generateReviewDraftsAction(input);
      expect(res1.success).toBe(false);

      const res2 = await generateReviewDraftsAction(input);
      expect(res2.success).toBe(true);
      expect(res2.drafts).toHaveLength(3);
      expect(callCount).toBe(2);
    });
  });
});
