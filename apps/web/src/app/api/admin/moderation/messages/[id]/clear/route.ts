import type { NextRequest } from 'next/server';
import { ok, withErrorHandling } from '@/server/api-response';
import { requireAuth, requireRole } from '@/server/auth/guards';
import { clearMessageFlag } from '@/server/services/admin.service';

export const POST = withErrorHandling(
  async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const { user } = await requireAuth(request);
    requireRole(user, 'ADMIN');
    const { id } = await context.params;
    await clearMessageFlag(user, id);
    return ok({}, 'Message flag cleared.');
  },
);
