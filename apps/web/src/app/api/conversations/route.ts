import type { NextRequest } from 'next/server';
import { listConversationsSchema } from '@magobo/shared';
import { ok, withErrorHandling } from '@/server/api-response';
import { requireAuth } from '@/server/auth/guards';
import { listMyConversations } from '@/server/services/message.service';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { user } = await requireAuth(request);
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const input = listConversationsSchema.parse(params);
  const result = await listMyConversations(user, input);
  return ok(result);
});
