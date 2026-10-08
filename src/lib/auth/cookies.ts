import { cookies } from 'next/headers';
import { SESSION_MAX_AGE_SECONDS } from './session';

export const ADMIN_SESSION_COOKIE_NAME = 'admin_session';

/**
 * Retrieves the raw session token from the secure HTTP-only cookie.
 */
export async function getSessionCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value;
}

/**
 * Sets the secure HTTP-only session cookie upon successful authentication.
 * Attributes: HttpOnly, SameSite=Lax, Secure in production, Path=/, MaxAge=7d.
 */
export async function setSessionCookie(rawToken: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE_NAME, rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

/**
 * Clears the session cookie from the browser upon logout.
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE_NAME);
}
