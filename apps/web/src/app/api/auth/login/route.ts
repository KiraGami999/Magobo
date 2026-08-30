import type { NextRequest } from 'next/server';
import { loginSchema } from '@magobo/shared';
import { ok, withErrorHandling } from '@/server/api-response';
import { parseOrThrow } from '@/server/validate';
import { enforceRateLimit, getClientIp } from '@/server/rate-limit';
import { loginUser } from '@/server/services/auth.service';
import { issueSession } from '@/server/auth/issue-session';
import { toPublicUser } from '@/server/serializers/user';

export const POST = withErrorHandling(async (request: NextRequest) => {
  // Rate-limit by IP regardless of which account is targeted — this is
  // what actually slows down a distributed credential-stuffing attempt.
  await enforceRateLimit(getClientIp(request), 'login', 10, 15 * 60 * 1000);

  const input = parseOrThrow(loginSchema, await request.json());
  const user = await loginUser(input);
  const { sessionToken } = await issueSession(request, user.id);

  return ok({ user: toPublicUser(user), sessionToken }, 'Logged in successfully.');
});
