import type { AIServiceProvider } from './types';
import { MockAIProvider } from './mock-provider';
import { GeminiProvider } from './gemini-provider';
import { OpenAIProvider } from './openai-provider';

let overrideProvider: AIServiceProvider | null = null;

/**
 * Returns the configured AI Service Provider according to environment variables.
 * Falls back safely to MockAIProvider if no API key is provisioned or during test runs.
 */
export function getAIProvider(): AIServiceProvider {
  if (overrideProvider) {
    return overrideProvider;
  }

  const providerType = (process.env.AI_PROVIDER || 'gemini').toLowerCase().trim();
  const apiKey = (process.env.AI_API_KEY || '').trim();

  // Always use Mock in test environment or if specifically requested
  if (process.env.NODE_ENV === 'test' || providerType === 'mock') {
    return new MockAIProvider();
  }

  // If live provider requested but key is missing, fall back safely to Mock in development
  if (!apiKey) {
    return new MockAIProvider();
  }

  if (providerType === 'gemini') {
    return new GeminiProvider(apiKey, process.env.AI_MODEL);
  }

  if (providerType === 'openai') {
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
