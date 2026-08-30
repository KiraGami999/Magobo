import type { NextRequest } from 'next/server';
import { listNotificationsSchema } from '@magobo/shared';
import { ok, withErrorHandling } from '@/server/api-response';
import { requireAuth } from '@/server/auth/guards';
import { listNotifications } from '@/server/services/notification.service';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { user } = await requireAuth(request);
  const input = listNotificationsSchema.parse(Object.fromEntries(request.nextUrl.searchParams.entries()));
  const result = await listNotifications(user, input);
  return ok(result);
});
