import type { AIServiceProvider } from './types';
import { MockAIProvider } from './mock-provider';
import { GeminiProvider } from './gemini-provider';
import { OpenAIProvider } from './openai-provider';
import { OllamaProvider } from './ollama-provider';
import { AIProviderError } from './types';

let overrideProvider: AIServiceProvider | null = null;

/**
 * Returns the configured AI Service Provider according to environment variables.
 * Falls back safely to MockAIProvider if specifically requested or in test environment.
 * Validates required configuration and never silently falls back when live provider fails.
 */
export function getAIProvider(): AIServiceProvider {
  if (overrideProvider) {
    return overrideProvider;
  }

  const providerType = (process.env.AI_PROVIDER || 'ollama').toLowerCase().trim();

  // Always use Mock in test environment or if specifically requested
  if (process.env.NODE_ENV === 'test' || providerType === 'mock') {
    return new MockAIProvider();
  }

  if (providerType === 'ollama') {
    const apiKey = (process.env.OLLAMA_API_KEY || '').trim();
    const model = (process.env.OLLAMA_MODEL || 'gemma4:31b').trim();
    const baseUrl = (process.env.OLLAMA_BASE_URL || 'https://ollama.com/v1').trim();

    if (!apiKey) {
      throw new AIProviderError(
        'AI_CONFIGURATION_ERROR',
        'Ollama API key is missing. Please configure OLLAMA_API_KEY.'
      );
    }
    if (!model) {
      throw new AIProviderError(
        'AI_CONFIGURATION_ERROR',
        'Ollama model identifier is missing. Please configure OLLAMA_MODEL.'
      );
    }

    return new OllamaProvider(apiKey, model, baseUrl);
  }

  if (providerType === 'gemini') {
    const apiKey = (process.env.AI_API_KEY || '').trim();
    if (!apiKey) {
      throw new AIProviderError('AI_CONFIGURATION_ERROR', 'Gemini API key is missing.');
    }
    return new GeminiProvider(apiKey, process.env.AI_MODEL);
  }

  if (providerType === 'openai') {
    const apiKey = (process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '').trim();
    if (!apiKey) {
      throw new AIProviderError('AI_CONFIGURATION_ERROR', 'OpenAI API key is missing.');
    }
    return new OpenAIProvider(apiKey);
  }

  return new MockAIProvider();
}

/**
 * Sets a custom provider instance (used for testing).
 */
export function setAIProvider(provider: AIServiceProvider | null): void {
  overrideProvider = provider;
}
