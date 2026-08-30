import type { NextRequest } from 'next/server';
import { listProposalsSchema } from '@magobo/shared';
import { ok, withErrorHandling } from '@/server/api-response';
import { requireAuth } from '@/server/auth/guards';
import { listMyProposals } from '@/server/services/proposal.service';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { user } = await requireAuth(request);
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const input = listProposalsSchema.parse(params);
  const result = await listMyProposals(user, input);
  return ok(result);
});
