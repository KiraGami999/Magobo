import type { NextRequest } from 'next/server';
import { ok, withErrorHandling } from '@/server/api-response';
import { requireAuth } from '@/server/auth/guards';
import { submitKyc } from '@/server/services/kyc.service';

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { user } = await requireAuth(request);
  const kyc = await submitKyc(user);
  return ok({ kyc }, 'KYC submitted for review.');
});
