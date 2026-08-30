import type { NextRequest } from 'next/server';
import { updateBusinessProfileSchema } from '@magobo/shared';
import { ok, withErrorHandling } from '@/server/api-response';
import { requireAuth } from '@/server/auth/guards';
import { parseOrThrow } from '@/server/validate';
import { updateBusinessProfile } from '@/server/services/profile.service';

export const PATCH = withErrorHandling(async (request: NextRequest) => {
  const { user } = await requireAuth(request);
  const input = parseOrThrow(updateBusinessProfileSchema, await request.json());
  const businessProfile = await updateBusinessProfile(user.id, input);
  return ok({ businessProfile }, 'Business profile updated.');
});
