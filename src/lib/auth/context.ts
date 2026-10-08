import { redirect } from 'next/navigation';
import { getSessionCookie } from './cookies';
import { validateSessionToken } from './session';
import type { DomainAdminUser } from '@/lib/domain/types';

/**
 * Sanitizes return URL to strictly allow internal /admin paths.
 * Prevents open redirect vulnerabilities.
 */
export function sanitizeReturnUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') return '/admin';

  const trimmed = url.trim();

  // Must start with /admin, cannot be protocol-relative (//), and cannot contain protocols
  if (
    trimmed.startsWith('/admin') &&
    !trimmed.startsWith('//') &&
    !trimmed.includes('://') &&
    !trimmed.includes('\\')
  ) {
    return trimmed;
  }

  return '/admin';
}

/**
 * Retrieves the currently authenticated pharmacy admin, or null if unauthenticated.
 * Single source of truth for server-side auth status.
 */
export async function getCurrentAdmin(): Promise<DomainAdminUser | null> {
  const token = await getSessionCookie();
  if (!token) return null;

  return validateSessionToken(token);
}

/**
 * Enforces admin authentication on server components, Server Actions, and API routes.
 * Redirects unauthenticated visitors to /admin/login.
 */
export async function requireAdmin(currentPath?: string): Promise<DomainAdminUser> {
  const admin = await getCurrentAdmin();

  if (!admin) {
    const returnUrl = sanitizeReturnUrl(currentPath);
    redirect(`/admin/login?returnUrl=${encodeURIComponent(returnUrl)}`);
  }

  return admin;
}
