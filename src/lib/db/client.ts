import { PrismaClient } from '@prisma/client';

/**
 * Server-only Singleton Prisma Database Client
 * Prevents multiple instances of PrismaClient in development during Next.js HMR.
 * Includes automatic self-healing if schema was modified while dev server was active.
 * STRICT RULE: Never import this into client components ('use client').
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function isPrismaClientCurrent(client: PrismaClient | undefined): client is PrismaClient {
  if (!client) return false;
  return (
    'googleBusinessAccount' in client &&
    'googleReview' in client &&
    'googleReviewReplyDraft' in client &&
    'product' in client &&
    'offer' in client &&
    'shopSettings' in client &&
    'feedback' in client &&
    'analyticsEvent' in client &&
    'adminUser' in client &&
    'adminSession' in client
  );
}

function getFreshClient(): PrismaClient {
  if (isPrismaClientCurrent(globalForPrisma.prisma)) {
    return globalForPrisma.prisma;
  }

  // Clear Node module cache for Prisma in dev mode to pick up newly generated models
  if (process.env.NODE_ENV !== 'production' && typeof require !== 'undefined' && require.cache) {
    try {
      Object.keys(require.cache).forEach((key) => {
        if (key.includes('/.prisma/') || key.includes('/@prisma/')) {
          delete require.cache[key];
        }
      });
    } catch {
      // Ignored in non-CJS environments
    }
  }

  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client;
  }

  return client;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getFreshClient();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});
