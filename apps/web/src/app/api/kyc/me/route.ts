import type { NextRequest } from 'next/server';
import { ok, withErrorHandling } from '@/server/api-response';
import { requireAuth } from '@/server/auth/guards';
import { getOwnKyc } from '@/server/services/kyc.service';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { user } = await requireAuth(request);
  const kyc = await getOwnKyc(user);
  return ok({ kyc });
});
