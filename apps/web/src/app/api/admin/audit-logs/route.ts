import type { NextRequest } from 'next/server';
import { adminListAuditLogsSchema } from '@magobo/shared';
import { ok, withErrorHandling } from '@/server/api-response';
import { requireAuth, requireRole } from '@/server/auth/guards';
import { listAuditLogs } from '@/server/services/admin.service';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { user } = await requireAuth(request);
  requireRole(user, 'ADMIN');
  const input = adminListAuditLogsSchema.parse(Object.fromEntries(request.nextUrl.searchParams.entries()));
  const result = await listAuditLogs(user, input);
  return ok(result);
});
