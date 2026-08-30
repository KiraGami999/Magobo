import type { NextRequest } from 'next/server';
import { updateGigSchema } from '@magobo/shared';
import { ok, withErrorHandling } from '@/server/api-response';
import { getSessionFromRequest } from '@/server/auth/session';
import { requireAuth } from '@/server/auth/guards';
import { parseOrThrow } from '@/server/validate';
import { getGig, updateDraftGig } from '@/server/services/gig.service';

export const GET = withErrorHandling(
  async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const { id } = await context.params;
    const session = await getSessionFromRequest(request);
    const gig = await getGig(id, session?.user);
    return ok({ gig });
  },
);

export const PATCH = withErrorHandling(
  async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const { user } = await requireAuth(request);
    const { id } = await context.params;
    const input = parseOrThrow(updateGigSchema, await request.json());
    const gig = await updateDraftGig(user, id, input);
    return ok({ gig }, 'Gig updated.');
  },
);
