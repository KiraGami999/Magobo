import { prisma } from '@magobo/db';
import { ok, withErrorHandling } from '@/server/api-response';

/**
 * Unauthenticated liveness/readiness probe. Confirms the API process is up
 * and that Prisma can reach PostgreSQL — useful for deployment health
 * checks and for verifying local environment setup.
 */
export const GET = withErrorHandling(async () => {
  await prisma.$queryRaw`SELECT 1`;

  return ok({
    status: 'ok',
    database: 'connected',
    timestamp: new Date().toISOString(),
  });
});
