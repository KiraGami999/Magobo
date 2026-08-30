import type { NextRequest } from 'next/server';
import { ok, withErrorHandling } from '@/server/api-response';
import { requireAuth, requireRole } from '@/server/auth/guards';
import { getAdminDashboard } from '@/server/services/admin.service';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { user } = await requireAuth(request);
  requireRole(user, 'ADMIN');
  const stats = await getAdminDashboard(user);
  return ok({ stats });
});
