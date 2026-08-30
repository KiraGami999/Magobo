import type { NextRequest } from 'next/server';
import { ok, withErrorHandling } from '@/server/api-response';
import { requireAuth, requireRole } from '@/server/auth/guards';
import { getAdminKycCase } from '@/server/services/kyc.service';

export const GET = withErrorHandling(
  async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const { user } = await requireAuth(request);
    requireRole(user, 'ADMIN');

    const { id } = await context.params;
    const kycCase = await getAdminKycCase(id);
    return ok({ case: kycCase });
  },
);
