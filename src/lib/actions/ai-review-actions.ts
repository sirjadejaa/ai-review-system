'use server';

import { headers } from 'next/headers';
import type { ReviewDraft } from '@/lib/ai/types';
import { getAIProvider } from '@/lib/ai/provider-factory';
import { isAIRateLimited, recordAIRequest } from '@/lib/ai/rate-limiter';
import {
  GenerateReviewDraftsInputSchema,
  type GenerateReviewDraftsInputData,
} from '@/lib/validation/ai-schema';

export interface GenerateReviewDraftsResult {
  success: boolean;
  drafts?: ReviewDraft[];
  error?: string;
}

/**
 * Server action to generate 3 natural review drafts via the configured AI provider.
 * Strictly server-side: API keys and vendor details are never exposed to the client.
 */
export async function generateReviewDraftsAction(
  input: GenerateReviewDraftsInputData
): Promise<GenerateReviewDraftsResult> {
  try {
    // 1. Abuse protection: Check in-memory rate limiter per client request context
    let clientKey = 'anonymous:client';
    try {
      const headerList = await headers();
      const forwardedFor = headerList.get('x-forwarded-for');
      const userAgent = headerList.get('user-agent') || '';
      clientKey = `${forwardedFor ? forwardedFor.split(',')[0].trim() : 'anonymous'}:${userAgent.slice(0, 32)}`;
    } catch {
      clientKey = 'test-environment-client';
    }

    const rateCheck = isAIRateLimited(clientKey);
    if (rateCheck.isBlocked) {
      return {
        success: false,
        error: `Please wait ${rateCheck.retryAfterSeconds} seconds before generating new review options.`,
      };
    }

    // 2. Validate input parameters strictly
    const parsed = GenerateReviewDraftsInputSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Invalid review generation inputs.';
      return {
        success: false,
        error: firstError,
      };
    }

    // 3. Delegate to configured AI Service Provider
    const provider = getAIProvider();
    const drafts = await provider.generateReviewDrafts(parsed.data);

    // 4. Record successful generation against rate limiter
    recordAIRequest(clientKey);

    return {
      success: true,
      drafts,
    };
  } catch (error) {
    // Sanitize error: never leak API keys, model names, or internal stack traces
    console.error('Non-fatal: AI review draft generation failed', error);
    return {
      success: false,
      error: "We couldn't create the review drafts right now. Please try again.",
    };
  }
}
