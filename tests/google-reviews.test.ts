import { describe, it, expect } from 'vitest';
import { encryptToken, decryptToken } from '@/lib/security/encryption';
import { generateGoogleAuthUrl } from '@/lib/google/client';
import {
  AI_OWNER_REPLY_SYSTEM_PROMPT,
  buildOwnerReplyUserPrompt,
} from '@/lib/ai/prompt';
import { MockAIProvider } from '@/lib/ai/mock-provider';

describe('Google Business Profile & AI Review Management System', () => {
  describe('1. Security & Token Encryption (AES-256-GCM)', () => {
    it('encrypts and decrypts OAuth tokens accurately using AES-256-GCM', () => {
      const sampleToken = 'ya29.a0AfH6SMD_test_access_token_super_secret_12345';
      const encrypted = encryptToken(sampleToken);

      // Must be formatted as iv:authTag:ciphertext (base64)
      const parts = encrypted.split(':');
      expect(parts).toHaveLength(3);
      expect(parts[0].length).toBeGreaterThan(10); // 12 bytes IV in base64
      expect(parts[1].length).toBeGreaterThan(15); // 16 bytes AuthTag in base64
      expect(parts[2].length).toBeGreaterThan(0); // Ciphertext

      // Must decrypt back to the original token
      const decrypted = decryptToken(encrypted);
      expect(decrypted).toBe(sampleToken);
    });

    it('produces different ciphertexts for the same plaintext due to random IVs', () => {
      const plaintext = 'refresh_token_xyz987654321';
      const enc1 = encryptToken(plaintext);
      const enc2 = encryptToken(plaintext);

      expect(enc1).not.toBe(enc2);
      expect(decryptToken(enc1)).toBe(plaintext);
      expect(decryptToken(enc2)).toBe(plaintext);
    });

    it('returns null safely when tampering with ciphertext or authTag', () => {
      const sample = encryptToken('secret');
      const parts = sample.split(':');
      // Corrupt the ciphertext
      const corrupted = `${parts[0]}:${parts[1]}:badciphertext`;
      expect(decryptToken(corrupted)).toBeNull();
    });
  });

  describe('2. Google OAuth URL Generation', () => {
    it('generates compliant Google OAuth 2.0 URL with business.manage scope', () => {
      const originalClientId = process.env.GOOGLE_CLIENT_ID;
      const originalRedirectUri = process.env.GOOGLE_REDIRECT_URI;

      process.env.GOOGLE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';
      process.env.GOOGLE_REDIRECT_URI = 'https://example.com/api/auth/google/callback';

      const authUrl = generateGoogleAuthUrl('state_test_xyz');
      const url = new URL(authUrl);

      expect(url.origin).toBe('https://accounts.google.com');
      expect(url.pathname).toBe('/o/oauth2/v2/auth');
      expect(url.searchParams.get('client_id')).toBe('test-client-id.apps.googleusercontent.com');
      expect(url.searchParams.get('redirect_uri')).toBe('https://example.com/api/auth/google/callback');
      expect(url.searchParams.get('response_type')).toBe('code');
      expect(url.searchParams.get('access_type')).toBe('offline');
      expect(url.searchParams.get('prompt')).toBe('consent');
      expect(url.searchParams.get('state')).toBe('state_test_xyz');

      const scope = url.searchParams.get('scope') || '';
      expect(scope).toContain('https://www.googleapis.com/auth/business.manage');

      // Cleanup
      process.env.GOOGLE_CLIENT_ID = originalClientId;
      process.env.GOOGLE_REDIRECT_URI = originalRedirectUri;
    });

    it('throws configuration error when Google client ID is unset', () => {
      const originalClientId = process.env.GOOGLE_CLIENT_ID;
      delete process.env.GOOGLE_CLIENT_ID;

      expect(() => generateGoogleAuthUrl('state')).toThrow(/GOOGLE_CLIENT_ID/);

      process.env.GOOGLE_CLIENT_ID = originalClientId;
    });
  });

  describe('3. AI Owner Reply Prompts & System Safety Rules', () => {
    it('enforces non-defensive, de-escalating principles and no fake promises in system prompt', () => {
      expect(AI_OWNER_REPLY_SYSTEM_PROMPT).toContain('Warm & Gracious');
      expect(AI_OWNER_REPLY_SYSTEM_PROMPT).toContain('Professional & De-escalating');
      expect(AI_OWNER_REPLY_SYSTEM_PROMPT).toContain('Do NOT offer specific monetary discounts, coupon codes, or unverified refunds');
      expect(AI_OWNER_REPLY_SYSTEM_PROMPT).toContain('Do NOT disclose private customer information');
      expect(AI_OWNER_REPLY_SYSTEM_PROMPT).toContain('Concise: 2 to 4 sentences maximum');
    });

    it('builds owner reply prompt for English, Hindi, and Gujarati', () => {
      const promptEn = buildOwnerReplyUserPrompt({
        reviewerName: 'Ananya Roy',
        rating: 5,
        reviewText: 'Beautiful festive collection and attentive staff!',
        shopName: 'Heritage Threads',
        language: 'en',
      });

      expect(promptEn).toContain('Heritage Threads');
      expect(promptEn).toContain('Ananya Roy');
      expect(promptEn).toContain('5 / 5 stars');
      expect(promptEn).toContain('English');

      const promptHi = buildOwnerReplyUserPrompt({
        reviewerName: 'Manish Verma',
        rating: 2,
        reviewText: 'Fabric was rough and size exchange was slow.',
        shopName: 'Heritage Threads',
        language: 'hi',
      });

      expect(promptHi).toContain('Hindi (Devanagari script)');
      expect(promptHi).toContain('2 / 5 stars');

      const promptGu = buildOwnerReplyUserPrompt({
        reviewerName: 'Bhavna Ben',
        rating: 4,
        reviewText: 'Saree designs are great.',
        shopName: 'Heritage Threads',
        language: 'gu',
      });

      expect(promptGu).toContain('Gujarati (proper Gujarati Unicode script)');
      expect(promptGu).toContain('Bhavna Ben');
    });
  });

  describe('4. AI Owner Reply Draft Generation in 3 Languages', () => {
    const provider = new MockAIProvider();

    it('generates warm, personal 5-star owner reply in English acknowledging customer', async () => {
      const reply = await provider.generateOwnerReplyDraft({
        reviewerName: 'Sneha Patel',
        rating: 5,
        reviewText: 'Gorgeous silk gowns, loved the assistance by the staff!',
        shopName: 'Aura Boutique',
        language: 'en',
      });

      expect(reply).toContain('Sneha');
      expect(reply).toContain('Aura Boutique');
      expect(reply.length).toBeGreaterThan(30);
    });

    it('generates respectful Hindi owner reply in Devanagari script', async () => {
      const reply = await provider.generateOwnerReplyDraft({
        reviewerName: 'Rajesh Kumar',
        rating: 5,
        reviewText: 'Bahut achhi fitting aur kapda hai.',
        shopName: 'Aura Boutique',
        language: 'hi',
      });

      // Must be in Devanagari Unicode
      expect(/[\u0900-\u097F]/.test(reply)).toBe(true);
      expect(reply).toContain('धन्यवाद');
      expect(reply).toContain('Aura Boutique');
    });

    it('generates respectful Gujarati owner reply in Gujarati Unicode script', async () => {
      const reply = await provider.generateOwnerReplyDraft({
        reviewerName: 'Pooja Ben',
        rating: 4,
        reviewText: 'Saras kapda ane fitting.',
        shopName: 'Aura Boutique',
        language: 'gu',
      });

      // Must be in Gujarati Unicode
      expect(/[\u0A80-\u0AFF]/.test(reply)).toBe(true);
      expect(reply).toContain('આભાર');
      expect(reply).toContain('Aura Boutique');
    });

    it('generates empathetic, non-defensive reply for 1-star negative review', async () => {
      const replyEn = await provider.generateOwnerReplyDraft({
        reviewerName: 'Vikas Shah',
        rating: 1,
        reviewText: 'Sizes were out of stock and staff was busy.',
        shopName: 'Aura Boutique',
        language: 'en',
      });

      expect(replyEn.toLowerCase()).toContain('sorry');
      expect(replyEn).toContain('Vikas');

      const replyGu = await provider.generateOwnerReplyDraft({
        reviewerName: 'Vikas Shah',
        rating: 1,
        reviewText: 'Stock na hatho.',
        shopName: 'Aura Boutique',
        language: 'gu',
      });

      // Gujarati apology / regret
      expect(/[\u0A80-\u0AFF]/.test(replyGu)).toBe(true);
      expect(replyGu).toContain('ખેદ');
    });
  });
});
