import type { NextRequest } from 'next/server';
import { discoverGigsSchema } from '@magobo/shared';
import { ok, withErrorHandling } from '@/server/api-response';
import { requireAuth } from '@/server/auth/guards';
import { listMyGigs } from '@/server/services/gig.service';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { user } = await requireAuth(request);
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const input = discoverGigsSchema.parse(params);
  const result = await listMyGigs(user, input);
  return ok(result);
});
