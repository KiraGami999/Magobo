import type { NextRequest } from 'next/server';
import { registerSchema } from '@magobo/shared';
import { ok, withErrorHandling } from '@/server/api-response';
import { parseOrThrow } from '@/server/validate';
import { enforceRateLimit, getClientIp } from '@/server/rate-limit';
import { registerUser } from '@/server/services/auth.service';
import { issueSession } from '@/server/auth/issue-session';
import { toPublicUser } from '@/server/serializers/user';

export const POST = withErrorHandling(async (request: NextRequest) => {
  await enforceRateLimit(getClientIp(request), 'register', 5, 60 * 60 * 1000);

  const input = parseOrThrow(registerSchema, await request.json());
  const user = await registerUser(input);
  const { sessionToken } = await issueSession(request, user.id);

  return ok(
    { user: toPublicUser(user), sessionToken },
    'Account created. Check your email or phone to verify your account.',
    201,
  );
});
