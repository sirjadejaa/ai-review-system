/**
 * In-Memory Rate Limiter for Public Customer Feedback Submissions
 * Prevents spam/flooding while preserving privacy (no permanent IP persistence).
 */

import { createHash } from 'node:crypto';

interface FeedbackLimitRecord {
  submissions: number;
  firstSubmissionAt: number;
  blockedUntil: number | null;
}

const MAX_SUBMISSIONS_PER_WINDOW = 5;
const WINDOW_DURATION_MS = 10 * 60 * 1000; // 10 minutes
const LOCKOUT_DURATION_MS = 10 * 60 * 1000; // 10 minutes temporary throttle

const limitsMap = new Map<string, FeedbackLimitRecord>();

function hashKey(key: string): string {
  return createHash('sha256').update(key.trim().toLowerCase()).digest('hex');
}

/**
 * Checks whether the client context has exceeded public feedback submission limits.
 */
export function isFeedbackRateLimited(key: string): { isBlocked: boolean; retryAfterSeconds: number } {
  const normalizedKey = hashKey(key);
  const now = Date.now();
  const record = limitsMap.get(normalizedKey);

  if (!record) {
    return { isBlocked: false, retryAfterSeconds: 0 };
  }

  // Active block
  if (record.blockedUntil && record.blockedUntil > now) {
    const retryAfterSeconds = Math.ceil((record.blockedUntil - now) / 1000);
    return { isBlocked: true, retryAfterSeconds };
  }

  // Expired window
  if (now - record.firstSubmissionAt > WINDOW_DURATION_MS) {
    limitsMap.delete(normalizedKey);
    return { isBlocked: false, retryAfterSeconds: 0 };
  }

  if (record.submissions >= MAX_SUBMISSIONS_PER_WINDOW) {
    record.blockedUntil = now + LOCKOUT_DURATION_MS;
    limitsMap.set(normalizedKey, record);
    return { isBlocked: true, retryAfterSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000) };
  }

  return { isBlocked: false, retryAfterSeconds: 0 };
}

/**
 * Records a feedback submission for the client context.
 */
export function recordFeedbackSubmission(key: string): void {
  const normalizedKey = hashKey(key);
  const now = Date.now();
  let record = limitsMap.get(normalizedKey);

  if (!record || now - record.firstSubmissionAt > WINDOW_DURATION_MS) {
    record = {
      submissions: 1,
      firstSubmissionAt: now,
      blockedUntil: null,
    };
  } else {
    record.submissions += 1;
  }

  limitsMap.set(normalizedKey, record);
}

/**
 * Resets all feedback rate limits (primarily for testing).
 */
export function clearFeedbackRateLimits(): void {
  limitsMap.clear();
}
