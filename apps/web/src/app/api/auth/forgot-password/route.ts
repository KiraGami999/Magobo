import type { NextRequest } from 'next/server';
import { requestPasswordResetSchema } from '@magobo/shared';
import { ok, withErrorHandling } from '@/server/api-response';
import { parseOrThrow } from '@/server/validate';
import { enforceRateLimit, getClientIp } from '@/server/rate-limit';
import { requestPasswordReset } from '@/server/services/auth.service';

export const POST = withErrorHandling(async (request: NextRequest) => {
  await enforceRateLimit(getClientIp(request), 'forgot-password', 5, 60 * 60 * 1000);

  const input = parseOrThrow(requestPasswordResetSchema, await request.json());
  await requestPasswordReset(input.email);

  // Always the same response, whether or not the email is registered.
  return ok(null, 'If an account exists for that email, a reset code has been sent.');
});
