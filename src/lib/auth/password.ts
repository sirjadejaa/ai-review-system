import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Compares a plaintext password against a stored bcrypt hash.
 * Constant-time comparison performed by bcrypt to prevent timing attacks.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) return false;
  return bcrypt.compare(password, hash);
}

/**
 * Hashes a plaintext password using bcrypt with standard salt rounds.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}
