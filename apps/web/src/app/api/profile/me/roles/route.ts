import type { NextRequest } from 'next/server';
import { enableProviderRoleSchema } from '@magobo/shared';
import { ok, withErrorHandling } from '@/server/api-response';
import { requireAuth } from '@/server/auth/guards';
import { parseOrThrow } from '@/server/validate';
import { enableProviderRole } from '@/server/services/profile.service';
import { toPublicUser } from '@/server/serializers/user';

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { user } = await requireAuth(request);
  const input = parseOrThrow(enableProviderRoleSchema, await request.json());
  const updated = await enableProviderRole(user, input);
  return ok({ user: toPublicUser(updated) }, 'Capability enabled.');
});
