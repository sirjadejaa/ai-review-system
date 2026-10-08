/**
 * In-Memory Rate Limiter for Login Brute-Force & Credential-Stuffing Protection
 * Designed for single-pharmacy deployment. Does not permanently persist user IP addresses.
 */

interface RateLimitRecord {
  failedAttempts: number;
  firstAttemptAt: number;
  blockedUntil: number | null;
}

const MAX_FAILED_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const BLOCK_DURATION_MS = 15 * 60 * 1000;  // 15 minutes temporary lockout

// Map key: normalized username or client identifier
const attemptsMap = new Map<string, RateLimitRecord>();

/**
 * Checks whether an identifier is currently rate-limited.
 */
export function isRateLimited(key: string): { isBlocked: boolean; retryAfterSeconds: number } {
  const normalizedKey = key.trim().toLowerCase();
  const now = Date.now();
  const record = attemptsMap.get(normalizedKey);

  if (!record) {
    return { isBlocked: false, retryAfterSeconds: 0 };
  }

  // Check if active lockout exists
  if (record.blockedUntil && record.blockedUntil > now) {
    const retryAfterSeconds = Math.ceil((record.blockedUntil - now) / 1000);
    return { isBlocked: true, retryAfterSeconds };
  }

  // If lockout expired or attempt window passed, reset
  if (now - record.firstAttemptAt > ATTEMPT_WINDOW_MS) {
    attemptsMap.delete(normalizedKey);
    return { isBlocked: false, retryAfterSeconds: 0 };
  }

  return { isBlocked: false, retryAfterSeconds: 0 };
}

/**
 * Records a failed login attempt and calculates whether lockout threshold was reached.
 */
export function recordFailedAttempt(key: string): { isBlocked: boolean; retryAfterSeconds: number } {
  const normalizedKey = key.trim().toLowerCase();
  const now = Date.now();
  let record = attemptsMap.get(normalizedKey);

  if (!record || now - record.firstAttemptAt > ATTEMPT_WINDOW_MS) {
    record = {
      failedAttempts: 1,
      firstAttemptAt: now,
      blockedUntil: null,
    };
  } else {
    record.failedAttempts += 1;
  }

  if (record.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    record.blockedUntil = now + BLOCK_DURATION_MS;
    attemptsMap.set(normalizedKey, record);
    return {
      isBlocked: true,
      retryAfterSeconds: Math.ceil(BLOCK_DURATION_MS / 1000),
    };
  }

  attemptsMap.set(normalizedKey, record);
  return { isBlocked: false, retryAfterSeconds: 0 };
}

/**
 * Resets failed attempts after a successful login.
 */
export function resetFailedAttempts(key: string): void {
  attemptsMap.delete(key.trim().toLowerCase());
}

/**
 * Clears all rate limit records (primarily for testing).
 */
export function clearRateLimitRecords(): void {
  attemptsMap.clear();
}
