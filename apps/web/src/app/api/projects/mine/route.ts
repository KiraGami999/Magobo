import type { NextRequest } from 'next/server';
import { listProjectsSchema } from '@magobo/shared';
import { ok, withErrorHandling } from '@/server/api-response';
import { requireAuth } from '@/server/auth/guards';
import { listMyProjects } from '@/server/services/project.service';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { user } = await requireAuth(request);
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const input = listProjectsSchema.parse(params);
  const result = await listMyProjects(user, input);
  return ok(result);
});
