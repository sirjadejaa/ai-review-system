import { PrismaClient } from '@prisma/client';

/**
 * Server-only Singleton Prisma Database Client
 * Prevents multiple instances of PrismaClient in development during Next.js HMR.
 * STRICT RULE: Never import this into client components ('use client').
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
