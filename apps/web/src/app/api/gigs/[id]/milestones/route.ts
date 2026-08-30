import type { NextRequest } from 'next/server';
import { createMilestoneSchema } from '@magobo/shared';
import { ok, withErrorHandling } from '@/server/api-response';
import { requireAuth } from '@/server/auth/guards';
import { parseOrThrow } from '@/server/validate';
import { createMilestone } from '@/server/services/project.service';

export const POST = withErrorHandling(
  async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const { user } = await requireAuth(request);
    const { id } = await context.params;
    const input = parseOrThrow(createMilestoneSchema, await request.json());
    const project = await createMilestone(user, id, input);
    return ok({ project }, 'Milestone added.');
  },
);
