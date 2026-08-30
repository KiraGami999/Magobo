import type { NextRequest } from 'next/server';
import { ok, withErrorHandling } from '@/server/api-response';
import { requireAuth } from '@/server/auth/guards';
import { rejectProposal } from '@/server/services/proposal.service';

export const POST = withErrorHandling(
  async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const { user } = await requireAuth(request);
    const { id } = await context.params;
    const proposal = await rejectProposal(user, id);
    return ok({ proposal }, 'Proposal rejected.');
  },
);
