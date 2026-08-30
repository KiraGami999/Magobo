import type { NextRequest } from 'next/server';
import { resetPasswordSchema } from '@magobo/shared';
import { ok, withErrorHandling } from '@/server/api-response';
import { parseOrThrow } from '@/server/validate';
import { enforceRateLimit, getClientIp } from '@/server/rate-limit';
import { resetPassword } from '@/server/services/auth.service';

export const POST = withErrorHandling(async (request: NextRequest) => {
  await enforceRateLimit(getClientIp(request), 'reset-password', 10, 60 * 60 * 1000);

  const input = parseOrThrow(resetPasswordSchema, await request.json());
  await resetPassword(input.token, input.password);

  return ok(null, 'Password updated. Please log in again.');
});
