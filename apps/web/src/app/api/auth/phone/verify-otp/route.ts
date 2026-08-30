import { z } from 'zod';
import type { NextRequest } from 'next/server';
import { ok, withErrorHandling } from '@/server/api-response';
import { parseOrThrow } from '@/server/validate';
import { enforceRateLimit } from '@/server/rate-limit';
import { requireAuth } from '@/server/auth/guards';
import { verifyPhoneOtp } from '@/server/services/auth.service';
import { toPublicUser } from '@/server/serializers/user';

const verifyOtpBodySchema = z.object({ code: z.string().length(6) });

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { user } = await requireAuth(request);
  await enforceRateLimit(user.id, 'phone-otp-verify', 10, 15 * 60 * 1000);

  const input = parseOrThrow(verifyOtpBodySchema, await request.json());
  const updated = await verifyPhoneOtp(user.id, input.code);

  return ok({ user: toPublicUser(updated) }, 'Phone number verified.');
});
