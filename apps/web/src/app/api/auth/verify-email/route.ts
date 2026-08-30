import type { NextRequest } from 'next/server';
import { verifyEmailSchema } from '@magobo/shared';
import { ok, withErrorHandling } from '@/server/api-response';
import { parseOrThrow } from '@/server/validate';
import { enforceRateLimit, getClientIp } from '@/server/rate-limit';
import { verifyEmailToken } from '@/server/services/auth.service';
import { toPublicUser } from '@/server/serializers/user';

export const POST = withErrorHandling(async (request: NextRequest) => {
  await enforceRateLimit(getClientIp(request), 'verify-email', 10, 60 * 60 * 1000);

  const input = parseOrThrow(verifyEmailSchema, await request.json());
  const user = await verifyEmailToken(input.token);

  return ok({ user: toPublicUser(user) }, 'Email verified.');
});
