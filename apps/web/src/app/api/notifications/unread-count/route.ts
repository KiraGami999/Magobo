import type { NextRequest } from 'next/server';
import { ok, withErrorHandling } from '@/server/api-response';
import { requireAuth } from '@/server/auth/guards';
import { getUnreadNotificationCount } from '@/server/services/notification.service';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { user } = await requireAuth(request);
  const count = await getUnreadNotificationCount(user);
  return ok({ count });
});
