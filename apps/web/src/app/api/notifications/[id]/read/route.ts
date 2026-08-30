import type { NextRequest } from 'next/server';
import { ok, withErrorHandling } from '@/server/api-response';
import { requireAuth } from '@/server/auth/guards';
import { markNotificationRead } from '@/server/services/notification.service';

export const POST = withErrorHandling(
  async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const { user } = await requireAuth(request);
    const { id } = await context.params;
    const notification = await markNotificationRead(user, id);
    return ok({ notification });
  },
);
