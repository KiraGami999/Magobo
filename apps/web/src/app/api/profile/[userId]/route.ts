import type { NextRequest } from 'next/server';
import { ok, withErrorHandling } from '@/server/api-response';
import { getPublicProfile } from '@/server/services/profile.service';

export const GET = withErrorHandling(
  async (_request: NextRequest, context: { params: Promise<{ userId: string }> }) => {
    const { userId } = await context.params;
    const profile = await getPublicProfile(userId);
    return ok({ profile });
  },
);
