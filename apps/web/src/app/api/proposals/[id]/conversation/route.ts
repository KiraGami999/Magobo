import type { NextRequest } from 'next/server';
import { ok, withErrorHandling } from '@/server/api-response';
import { requireAuth } from '@/server/auth/guards';
import { getConversationByProposal } from '@/server/services/message.service';

export const GET = withErrorHandling(
  async (request: NextRequest, context: { params: Promise<{ proposalId: string }> }) => {
    const { user } = await requireAuth(request);
    const { proposalId } = await context.params;
    const conversation = await getConversationByProposal(user, proposalId);
    return ok({ conversation });
  },
);
