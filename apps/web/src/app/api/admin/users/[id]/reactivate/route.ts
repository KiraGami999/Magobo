import type { NextRequest } from 'next/server';
import { ok, withErrorHandling } from '@/server/api-response';
import { requireAuth, requireRole } from '@/server/auth/guards';
import { reactivateUser } from '@/server/services/admin.service';

export const POST = withErrorHandling(
  async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const { user } = await requireAuth(request);
    requireRole(user, 'ADMIN');
    const { id } = await context.params;
    await reactivateUser(user, id);
    return ok({}, 'User reactivated.');
  },
);
