import type { NextRequest } from 'next/server';
import { createReviewSchema } from '@magobo/shared';
import { ok, withErrorHandling } from '@/server/api-response';
import { requireAuth } from '@/server/auth/guards';
import { parseOrThrow } from '@/server/validate';
import { createReview, listReviewsForGig, getPendingReviewForGig } from '@/server/services/review.service';

export const GET = withErrorHandling(
  async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const { user } = await requireAuth(request);
    const { id } = await context.params;

    if (request.nextUrl.searchParams.get('pending') === 'true') {
      const pending = await getPendingReviewForGig(user, id);
      return ok({ pending });
    }

    const reviews = await listReviewsForGig(user, id);
    return ok({ reviews });
  },
);

export const POST = withErrorHandling(
  async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const { user } = await requireAuth(request);
    const { id } = await context.params;
    const input = parseOrThrow(createReviewSchema, await request.json());
    const review = await createReview(user, id, input);
    return ok({ review }, 'Review submitted.');
  },
);
