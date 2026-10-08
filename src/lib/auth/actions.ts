'use server';

import { redirect } from 'next/navigation';
import { getAdminUserByUsername, updateLastLogin } from '@/lib/repositories/admin-user-repository';
import { verifyPassword } from './password';
import { createAdminSession, destroyAdminSession } from './session';
import { getSessionCookie, setSessionCookie, clearSessionCookie } from './cookies';
import { isRateLimited, recordFailedAttempt, resetFailedAttempts } from './rate-limiter';
import { sanitizeReturnUrl } from './context';

export interface LoginActionState {
  error?: string;
  fieldErrors?: {
    username?: string;
    password?: string;
  };
}

// Fixed dummy hash for constant-time failure path (prevents timing attacks on non-existent users)
const DUMMY_HASH = '$2b$10$AAvyhgGCSPSAmLin/PlzfudJKdcriXkifBQxEXGutIzEy/IQlvRSq';

/**
 * Server Action for Owner Login
 * Secure credential validation, rate limiting, and session creation.
 */
export async function loginAction(
  _prevState: LoginActionState | null,
  formData: FormData
): Promise<LoginActionState> {
  const username = (formData.get('username') as string)?.trim() || '';
  const password = (formData.get('password') as string) || '';
  const rawReturnUrl = (formData.get('returnUrl') as string) || '';

  // 1. Basic field presence checks
  if (!username || !password) {
    return {
      error: 'Please provide both username and password.',
    };
  }

  // 2. Brute-force & rate-limiting check
  const rateLimitStatus = isRateLimited(username);
  if (rateLimitStatus.isBlocked) {
    const minutes = Math.ceil(rateLimitStatus.retryAfterSeconds / 60);
    return {
      error: `Too many failed login attempts. Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`,
    };
  }

  // 3. User lookup
  const adminUser = await getAdminUserByUsername(username);

  if (!adminUser) {
    // Constant-time dummy verification to mitigate user-enumeration timing attacks
    await verifyPassword(password, DUMMY_HASH);
    recordFailedAttempt(username);
    return {
      error: 'Invalid username or password.',
    };
  }

  // 4. Verify password against stored bcrypt hash
  const isMatch = await verifyPassword(password, adminUser.passwordHash);

  if (!isMatch) {
    recordFailedAttempt(username);
    return {
      error: 'Invalid username or password.',
    };
  }

  // 5. Successful authentication
  resetFailedAttempts(username);

  // Invalidate any prior sessions and create a fresh session token
  const { rawToken } = await createAdminSession(adminUser.id);

  // Set secure HTTP-only cookie
  await setSessionCookie(rawToken);

  // Update last login timestamp
  await updateLastLogin(adminUser.id);

  // Sanitize return URL to prevent open redirects
  const destination = sanitizeReturnUrl(rawReturnUrl);

  // Redirect to target admin route
  redirect(destination);
}

/**
 * Server Action for Owner Logout
 * Destroys session server-side and clears authentication cookie.
 */
export async function logoutAction(): Promise<void> {
  const token = await getSessionCookie();

  if (token) {
    await destroyAdminSession(token);
  }

  await clearSessionCookie();
  redirect('/admin/login');
}
