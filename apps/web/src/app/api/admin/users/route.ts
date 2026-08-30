import type { NextRequest } from 'next/server';
import { adminListUsersSchema } from '@magobo/shared';
import { ok, withErrorHandling } from '@/server/api-response';
import { requireAuth, requireRole } from '@/server/auth/guards';
import { listAdminUsers } from '@/server/services/admin.service';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { user } = await requireAuth(request);
  requireRole(user, 'ADMIN');
  const input = adminListUsersSchema.parse(Object.fromEntries(request.nextUrl.searchParams.entries()));
  const result = await listAdminUsers(user, input);
  return ok(result);
});
