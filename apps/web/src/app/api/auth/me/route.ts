import type { NextRequest } from 'next/server';
import { ok, withErrorHandling } from '@/server/api-response';
import { requireAuth } from '@/server/auth/guards';
import { toPublicUser } from '@/server/serializers/user';

/** Returns the currently authenticated user — the source of truth for "who am I" on both web and mobile. */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { user } = await requireAuth(request);
  return ok({ user: toPublicUser(user) });
});
