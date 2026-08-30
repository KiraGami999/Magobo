import type { NextRequest } from 'next/server';
import { listReviewsSchema } from '@magobo/shared';
import { ok, withErrorHandling } from '@/server/api-response';
import { listReviewsForUser } from '@/server/services/review.service';

export const GET = withErrorHandling(
  async (request: NextRequest, context: { params: Promise<{ userId: string }> }) => {
    const { userId } = await context.params;
    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const input = listReviewsSchema.parse(params);
    const result = await listReviewsForUser(userId, input);
    return ok(result);
  },
);
