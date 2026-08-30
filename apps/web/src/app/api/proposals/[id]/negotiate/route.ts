import type { NextRequest } from 'next/server';
import { counterOfferSchema } from '@magobo/shared';
import { ok, withErrorHandling } from '@/server/api-response';
import { requireAuth } from '@/server/auth/guards';
import { parseOrThrow } from '@/server/validate';
import { counterOffer } from '@/server/services/proposal.service';

export const POST = withErrorHandling(
  async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const { user } = await requireAuth(request);
    const { id } = await context.params;
    const input = parseOrThrow(counterOfferSchema, await request.json());
    const proposal = await counterOffer(user, id, input);
    return ok({ proposal }, 'Counter-offer sent.');
  },
);
