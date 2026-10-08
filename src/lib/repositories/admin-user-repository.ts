import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import type { DomainAdminUser } from '@/lib/domain/types';
import {
  CreateAdminUserInputSchema,
  type CreateAdminUserInput,
} from '@/lib/validation/admin-user-schema';

export interface AdminUserRecord extends DomainAdminUser {
  passwordHash: string;
}

function toDomain(record: {
  id: string;
  username: string;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): DomainAdminUser {
  return {
    id: record.id,
    username: record.username,
    lastLoginAt: record.lastLoginAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

/**
 * Retrieves the owner admin user by username (includes passwordHash for Phase 3 auth verification).
 */
export async function getAdminUserByUsername(username: string): Promise<AdminUserRecord | null> {
  const record = await prisma.adminUser.findUnique({
    where: { username },
  });

  if (!record) return null;

  return {
    ...toDomain(record),
    passwordHash: record.passwordHash,
  };
}

/**
 * Creates the admin user record. Password hash is strictly stored (never plaintext).
 * Handles unique constraint error gracefully.
 */
export async function createAdminUser(input: CreateAdminUserInput): Promise<DomainAdminUser> {
  const validated = CreateAdminUserInputSchema.parse(input);

  try {
    const created = await prisma.adminUser.create({
      data: {
        username: validated.username,
        passwordHash: validated.passwordHash,
      },
    });

    return toDomain(created);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new Error(`Admin username '${validated.username}' is already registered.`);
    }
    throw error;
  }
}

/**
 * Updates the last login timestamp for the admin user.
 */
export async function updateLastLogin(id: string): Promise<void> {
  await prisma.adminUser.update({
    where: { id },
    data: { lastLoginAt: new Date() },
  });
}

/**
 * Checks if at least one admin user exists in the system.
 */
export async function hasAdminUser(): Promise<boolean> {
  const count = await prisma.adminUser.count();
  return count > 0;
}
