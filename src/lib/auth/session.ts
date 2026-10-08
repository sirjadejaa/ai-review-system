import crypto from 'crypto';
import { prisma } from '@/lib/db';
import type { DomainAdminUser } from '@/lib/domain/types';

// Centralized Session Duration: 7 days
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 604,800 seconds
export const SESSION_MAX_AGE_MS = SESSION_MAX_AGE_SECONDS * 1000;

/**
 * Generates a cryptographically secure, high-entropy 256-bit random token.
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Computes a SHA-256 hash of the session token.
 * Only this hash is stored in the database to prevent token leakage from DB dumps.
 */
export function hashSessionToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Creates a new authenticated session in the database for the given admin user.
 * Inactivates prior sessions to prevent session fixation.
 */
export async function createAdminSession(
  adminUserId: string
): Promise<{ rawToken: string; expiresAt: Date }> {
  const rawToken = generateSessionToken();
  const tokenHash = hashSessionToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS);

  // Invalidate previous sessions for this admin (session fixation prevention)
  await prisma.adminSession.deleteMany({
    where: { adminUserId },
  });

  // Opportunistic cleanup of expired sessions across the system
  await cleanupExpiredSessions();

  await prisma.adminSession.create({
    data: {
      adminUserId,
      tokenHash,
      expiresAt,
    },
  });

  return { rawToken, expiresAt };
}

/**
 * Validates a raw session token against the database.
 * Returns the authenticated AdminUser if valid and not expired; otherwise null.
 */
export async function validateSessionToken(rawToken: string): Promise<DomainAdminUser | null> {
  if (!rawToken || typeof rawToken !== 'string') return null;

  const tokenHash = hashSessionToken(rawToken);
  const now = new Date();

  const session = await prisma.adminSession.findUnique({
    where: { tokenHash },
    include: { adminUser: true },
  });

  if (!session) return null;

  // Check expiration
  if (session.expiresAt <= now) {
    // Delete expired session record
    await prisma.adminSession.delete({
      where: { id: session.id },
    }).catch(() => {});
    return null;
  }

  const { adminUser } = session;
  return {
    id: adminUser.id,
    username: adminUser.username,
    lastLoginAt: adminUser.lastLoginAt,
    createdAt: adminUser.createdAt,
    updatedAt: adminUser.updatedAt,
  };
}

/**
 * Destroys/invalidates an authenticated session in the database upon logout.
 */
export async function destroyAdminSession(rawToken: string): Promise<boolean> {
  if (!rawToken) return false;

  const tokenHash = hashSessionToken(rawToken);

  try {
    const deleted = await prisma.adminSession.deleteMany({
      where: { tokenHash },
    });
    return deleted.count > 0;
  } catch {
    return false;
  }
}

/**
 * Opportunistically cleans up expired sessions to avoid table bloat.
 */
export async function cleanupExpiredSessions(): Promise<number> {
  try {
    const result = await prisma.adminSession.deleteMany({
      where: {
        expiresAt: {
          lte: new Date(),
        },
      },
    });
    return result.count;
  } catch {
    return 0;
  }
}
