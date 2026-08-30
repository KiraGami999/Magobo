import type { NextRequest } from 'next/server';
import { ok, withErrorHandling } from '@/server/api-response';
import { enforceRateLimit } from '@/server/rate-limit';
import { requireAuth } from '@/server/auth/guards';
import { requestPhoneOtp } from '@/server/services/auth.service';

/**
 * Requires an authenticated session — phone verification is something a
 * user does for *their own* account, not a standalone public endpoint.
 * This avoids the SMS-bombing/enumeration risk a public "send OTP to any
 * number" endpoint would create.
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const { user } = await requireAuth(request);
  await enforceRateLimit(user.id, 'phone-otp-request', 5, 60 * 60 * 1000);

  await requestPhoneOtp(user);

  return ok(null, 'Verification code sent.');
});
