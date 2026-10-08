/**
 * In-Memory Rate Limiter for AI Review Generation & Regeneration Requests.
 * Enforces per-minute throttling without persisting IP addresses or personal data.
 */

import { createHash } from 'node:crypto';

interface AIRateLimitRecord {
  requests: number;
  firstRequestAt: number;
  blockedUntil: number | null;
}

const DEFAULT_LIMIT_PER_MINUTE = 10;
const WINDOW_DURATION_MS = 60 * 1000; // 1 minute
const LOCKOUT_DURATION_MS = 60 * 1000; // 1 minute lockout

const aiLimitsMap = new Map<string, AIRateLimitRecord>();

function hashKey(key: string): string {
  return createHash('sha256').update(key.trim().toLowerCase()).digest('hex');
}

function getMaxRequestsPerMinute(): number {
  const envVal = process.env.AI_RATE_LIMIT_PER_MINUTE;
  if (envVal) {
    const parsed = parseInt(envVal, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return DEFAULT_LIMIT_PER_MINUTE;
}

/**
 * Checks whether the client has exceeded AI generation/regeneration limits.
 */
export function isAIRateLimited(key: string): { isBlocked: boolean; retryAfterSeconds: number } {
  const normalizedKey = hashKey(key);
  const now = Date.now();
  const record = aiLimitsMap.get(normalizedKey);

  if (!record) {
    return { isBlocked: false, retryAfterSeconds: 0 };
  }

  // Active lockout
  if (record.blockedUntil && record.blockedUntil > now) {
    const retryAfterSeconds = Math.ceil((record.blockedUntil - now) / 1000);
    return { isBlocked: true, retryAfterSeconds };
  }

  // Window expired -> reset
  if (now - record.firstRequestAt > WINDOW_DURATION_MS) {
    aiLimitsMap.delete(normalizedKey);
    return { isBlocked: false, retryAfterSeconds: 0 };
  }

  const maxRequests = getMaxRequestsPerMinute();
  if (record.requests >= maxRequests) {
    record.blockedUntil = now + LOCKOUT_DURATION_MS;
    aiLimitsMap.set(normalizedKey, record);
    return { isBlocked: true, retryAfterSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000) };
  }

  return { isBlocked: false, retryAfterSeconds: 0 };
}

/**
 * Records an AI generation request for the client.
 */
export function recordAIRequest(key: string): void {
  const normalizedKey = hashKey(key);
  const now = Date.now();
  let record = aiLimitsMap.get(normalizedKey);

  if (!record || now - record.firstRequestAt > WINDOW_DURATION_MS) {
    record = {
      requests: 1,
      firstRequestAt: now,
      blockedUntil: null,
    };
  } else {
    record.requests += 1;
  }

  aiLimitsMap.set(normalizedKey, record);
}

/**
 * Resets all AI rate limits (primarily for testing).
 */
export function clearAIRateLimits(): void {
  aiLimitsMap.clear();
}
