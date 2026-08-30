import type { NextRequest } from 'next/server';
import { listMessagesSchema } from '@magobo/shared';
import { ok, withErrorHandling } from '@/server/api-response';
import { requireAuth } from '@/server/auth/guards';
import { getConversation } from '@/server/services/message.service';

export const GET = withErrorHandling(
  async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const { user } = await requireAuth(request);
    const { id } = await context.params;
    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const input = listMessagesSchema.parse(params);
    const result = await getConversation(user, id, input);
    return ok(result);
  },
);
