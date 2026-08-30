import type { NextRequest } from 'next/server';
import { ok, withErrorHandling } from '@/server/api-response';
import { requireAuth } from '@/server/auth/guards';
import { markAllNotificationsRead } from '@/server/services/notification.service';

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { user } = await requireAuth(request);
  await markAllNotificationsRead(user);
  return ok({}, 'All notifications marked as read.');
});
