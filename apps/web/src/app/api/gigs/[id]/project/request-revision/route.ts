import type { NextRequest } from 'next/server';
import { requestRevisionSchema } from '@magobo/shared';
import { ok, withErrorHandling } from '@/server/api-response';
import { requireAuth } from '@/server/auth/guards';
import { parseOrThrow } from '@/server/validate';
import { requestRevision } from '@/server/services/project.service';

export const POST = withErrorHandling(
  async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const { user } = await requireAuth(request);
    const { id } = await context.params;
    const input = parseOrThrow(requestRevisionSchema, await request.json());
    const project = await requestRevision(user, id, input);
    return ok({ project }, 'Revision requested.');
  },
);
