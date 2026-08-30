import type { NextRequest } from 'next/server';
import { adminKycRejectSchema } from '@magobo/shared';
import { ok, withErrorHandling } from '@/server/api-response';
import { requireAuth, requireRole } from '@/server/auth/guards';
import { parseOrThrow } from '@/server/validate';
import { rejectKycCase } from '@/server/services/kyc.service';

export const POST = withErrorHandling(
  async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const { user } = await requireAuth(request);
    requireRole(user, 'ADMIN');

    const { id } = await context.params;
    const input = parseOrThrow(adminKycRejectSchema, await request.json());
    const kycCase = await rejectKycCase(id, user.id, input);
    return ok({ case: kycCase }, 'KYC rejected.');
  },
);
