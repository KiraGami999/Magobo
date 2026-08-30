import type { NextRequest } from 'next/server';
import { createReportSchema } from '@magobo/shared';
import { ok, withErrorHandling } from '@/server/api-response';
import { requireAuth } from '@/server/auth/guards';
import { parseOrThrow } from '@/server/validate';
import { createReport } from '@/server/services/report.service';

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { user } = await requireAuth(request);
  const input = parseOrThrow(createReportSchema, await request.json());
  const report = await createReport(user, input);
  return ok({ report }, 'Report submitted.', 201);
});
