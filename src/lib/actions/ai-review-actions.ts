'use server';

import { headers } from 'next/headers';
import type { ReviewDraft } from '@/lib/ai/types';
import { AIProviderError } from '@/lib/ai/types';
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
  isRateLimited?: boolean;
  retryAfterSeconds?: number;
}

// In-flight request deduplication map to prevent parallel duplicate calls
const inFlightRequests = new Map<string, Promise<ReviewDraft[]>>();

// In-memory 5-minute drafts cache for identical inputs
interface CachedDrafts {
  drafts: ReviewDraft[];
  expiresAt: number;
}
const DRAFT_CACHE_TTL_MS = 5 * 60 * 1000;
const draftsCache = new Map<string, CachedDrafts>();

function computeCacheKey(data: GenerateReviewDraftsInputData): string {
  const sortedTags = [...(data.selectedTags || [])].sort().join('|');
  const note = (data.customerNote || '').trim().toLowerCase();
  const shop = (data.shopName || '').trim().toLowerCase();
  return `${data.rating}:${data.language}:${sortedTags}:${note}:${shop}`;
}

export async function clearAIDraftsCache(): Promise<void> {
  draftsCache.clear();
  inFlightRequests.clear();
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
      const forwardedFor =
        headerList.get('x-forwarded-for') ||
        headerList.get('cf-connecting-ip') ||
        headerList.get('x-real-ip');
      const userAgent = headerList.get('user-agent') || '';
      clientKey = `${forwardedFor ? forwardedFor.split(',')[0].trim() : 'anonymous'}:${userAgent.slice(0, 32)}`;
    } catch {
      clientKey = 'test-environment-client';
    }

    const rateCheck = isAIRateLimited(clientKey);
    if (rateCheck.isBlocked) {
      console.warn('[AI Rate Limiter] Client throttled by internal rate limiter', {
        clientKey,
        retryAfterSeconds: rateCheck.retryAfterSeconds,
      });
      return {
        success: false,
        error: `AI review suggestions are temporarily paused. Please wait ${rateCheck.retryAfterSeconds}s before requesting new options.`,
        isRateLimited: true,
        retryAfterSeconds: rateCheck.retryAfterSeconds,
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

    // 3. Check memory cache for identical input
    const cacheKey = computeCacheKey(parsed.data);
    const now = Date.now();
    const cached = draftsCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      return {
        success: true,
        drafts: cached.drafts,
      };
    }

    // 4. In-flight request deduplication: reuse running promise if identical request is pending
    let draftsPromise = inFlightRequests.get(cacheKey);

    if (!draftsPromise) {
      const provider = getAIProvider();
      draftsPromise = provider.generateReviewDrafts(parsed.data).finally(() => {
        inFlightRequests.delete(cacheKey);
      });
      inFlightRequests.set(cacheKey, draftsPromise);
    }

    const drafts = await draftsPromise;

    // Cache the verified response
    draftsCache.set(cacheKey, {
      drafts,
      expiresAt: now + DRAFT_CACHE_TTL_MS,
    });

    // 5. Record successful generation against internal abuse rate limiter
    recordAIRequest(clientKey);

    return {
      success: true,
      drafts,
    };
  } catch (error) {
    if (error instanceof AIProviderError && error.code === 'AI_RATE_LIMITED') {
      const retryAfterSeconds = error.retryAfterSeconds ?? 15;
      console.warn('[AI Provider Rate Limit] Upstream Gemini 429 quota reached', {
        retryAfterSeconds,
        isProviderQuota: error.isProviderQuota,
      });

      return {
        success: false,
        error: `AI suggestion service is temporarily busy. Please wait ${retryAfterSeconds}s and try again.`,
        isRateLimited: true,
        retryAfterSeconds,
      };
    }

    // Sanitize error: never leak API keys, model names, or internal stack traces
    console.error('Non-fatal: AI review draft generation failed', error);
    return {
      success: false,
      error: "We couldn't create the review drafts right now. Please try again.",
    };
  }
}
