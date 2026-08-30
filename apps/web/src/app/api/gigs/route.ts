import type { NextRequest } from 'next/server';
import { createGigSchema, discoverGigsSchema } from '@magobo/shared';
import { ok, withErrorHandling } from '@/server/api-response';
import { requireAuth } from '@/server/auth/guards';
import { parseOrThrow } from '@/server/validate';
import { createDraftGig, discoverGigs } from '@/server/services/gig.service';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const input = discoverGigsSchema.parse(params);
  const result = await discoverGigs(input);
  return ok(result);
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { user } = await requireAuth(request);
  const input = parseOrThrow(createGigSchema, await request.json());
  const gig = await createDraftGig(user, input);
  return ok({ gig }, 'Draft gig created.', 201);
});
