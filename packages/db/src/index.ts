import { PrismaClient } from '../generated/client';

/**
 * Singleton Prisma client.
 *
 * In development, Next.js hot-reloads modules, which would otherwise create
 * a new PrismaClient (and a new connection pool) on every reload. We cache
 * the instance on `globalThis` to avoid exhausting the database connection
 * limit.
 */
declare global {
  var __magoboPrisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  globalThis.__magoboPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__magoboPrisma = prisma;
}

export * from '../generated/client';
