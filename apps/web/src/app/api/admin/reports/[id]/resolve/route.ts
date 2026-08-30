import type { NextRequest } from 'next/server';
import { adminResolveReportSchema } from '@magobo/shared';
import { ok, withErrorHandling } from '@/server/api-response';
import { requireAuth, requireRole } from '@/server/auth/guards';
import { parseOrThrow } from '@/server/validate';
import { resolveReport } from '@/server/services/admin.service';

export const POST = withErrorHandling(
  async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const { user } = await requireAuth(request);
    requireRole(user, 'ADMIN');
    const { id } = await context.params;
    const input = parseOrThrow(adminResolveReportSchema, await request.json());
    await resolveReport(user, id, input);
    return ok({}, 'Report updated.');
  },
);
