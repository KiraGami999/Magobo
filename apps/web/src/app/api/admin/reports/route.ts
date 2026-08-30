import type { NextRequest } from 'next/server';
import { adminListReportsSchema } from '@magobo/shared';
import { ok, withErrorHandling } from '@/server/api-response';
import { requireAuth, requireRole } from '@/server/auth/guards';
import { listAdminReports } from '@/server/services/admin.service';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { user } = await requireAuth(request);
  requireRole(user, 'ADMIN');
  const input = adminListReportsSchema.parse(Object.fromEntries(request.nextUrl.searchParams.entries()));
  const result = await listAdminReports(user, input);
  return ok(result);
});
