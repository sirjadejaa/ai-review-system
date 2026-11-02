import { getAIProvider } from './provider-factory';
import { MockAIProvider } from './mock-provider';
import {
  type GenerateOwnerReplyInput,
  AI_OWNER_REPLY_SYSTEM_PROMPT,
  buildOwnerReplyUserPrompt,
} from './prompt';

/**
 * Generates an owner reply to a Google review in the chosen language.
 * Connects to active AI provider or deterministic Mock provider.
 */
export async function generateOwnerReply(input: GenerateOwnerReplyInput): Promise<string> {
  const provider = getAIProvider();

  // If Mock provider, use its built-in method directly
  if (provider instanceof MockAIProvider) {
    return provider.generateOwnerReplyDraft(input);
  }

  // Live provider invocation (Ollama / Gemini / OpenAI)
  try {
    const userPrompt = buildOwnerReplyUserPrompt(input);
    const providerName = provider.name.toLowerCase();

    if (providerName === 'ollama') {
      const apiKey = process.env.OLLAMA_API_KEY || '';
      const model = process.env.OLLAMA_MODEL || 'gemma4:31b';
      const baseUrl = (process.env.OLLAMA_BASE_URL || 'https://ollama.com/v1').replace(/\/$/, '');

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: AI_OWNER_REPLY_SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.7,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content?.trim();
        if (content) return content;
      }
    } else if (providerName === 'gemini') {
      const apiKey = process.env.AI_API_KEY || '';
      const model = process.env.AI_MODEL || 'gemini-2.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${AI_OWNER_REPLY_SYSTEM_PROMPT}\n\n${userPrompt}` }],
            },
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text) return text;
      }
    }
  } catch (error) {
    console.warn('Live AI provider failed for owner reply, falling back to mock provider:', error);
  }

  // Graceful fallback to deterministic mock engine
  const fallback = new MockAIProvider();
  return fallback.generateOwnerReplyDraft(input);
}
