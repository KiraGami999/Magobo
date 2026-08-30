import type { NextRequest } from 'next/server';
import { adminListGigsSchema } from '@magobo/shared';
import { ok, withErrorHandling } from '@/server/api-response';
import { requireAuth, requireRole } from '@/server/auth/guards';
import { listAdminGigs } from '@/server/services/admin.service';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { user } = await requireAuth(request);
  requireRole(user, 'ADMIN');
  const input = adminListGigsSchema.parse(Object.fromEntries(request.nextUrl.searchParams.entries()));
  const result = await listAdminGigs(user, input);
  return ok(result);
});
