import type { NextRequest } from 'next/server';
import { listProposalsSchema, submitProposalSchema } from '@magobo/shared';
import { ok, withErrorHandling } from '@/server/api-response';
import { requireAuth } from '@/server/auth/guards';
import { parseOrThrow } from '@/server/validate';
import {
  getMyProposalForGig,
  listGigProposals,
  submitProposal,
} from '@/server/services/proposal.service';

export const GET = withErrorHandling(
  async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const { user } = await requireAuth(request);
    const { id } = await context.params;
    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const input = listProposalsSchema.parse(params);

    const mine = request.nextUrl.searchParams.get('mine');
    if (mine === 'true') {
      const proposal = await getMyProposalForGig(user, id);
      return ok({ proposal });
    }

    const result = await listGigProposals(user, id, input);
    return ok(result);
  },
);

export const POST = withErrorHandling(
  async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const { user } = await requireAuth(request);
    const { id } = await context.params;
    const input = parseOrThrow(submitProposalSchema, await request.json());
    const proposal = await submitProposal(user, id, input);
    return ok({ proposal }, 'Proposal submitted.');
  },
);
