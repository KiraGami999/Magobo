import type { NextRequest } from 'next/server';
import type { KycStatus } from '@magobo/db';
import { ok, withErrorHandling } from '@/server/api-response';
import { requireAuth, requireRole } from '@/server/auth/guards';
import { listAdminKycQueue } from '@/server/services/kyc.service';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { user } = await requireAuth(request);
  requireRole(user, 'ADMIN');

  const statusParam = request.nextUrl.searchParams.get('status');
  const status = statusParam ? (statusParam as KycStatus) : undefined;
  const cases = await listAdminKycQueue(status);
  return ok({ cases });
});
