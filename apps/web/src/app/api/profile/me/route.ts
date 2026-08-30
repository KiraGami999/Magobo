import type { NextRequest } from 'next/server';
import { updateUserProfileSchema } from '@magobo/shared';
import { ok, withErrorHandling } from '@/server/api-response';
import { requireAuth } from '@/server/auth/guards';
import { parseOrThrow } from '@/server/validate';
import { getOwnProfile, updateUserProfile } from '@/server/services/profile.service';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { user } = await requireAuth(request);
  const profile = await getOwnProfile(user);
  return ok({ profile });
});

export const PATCH = withErrorHandling(async (request: NextRequest) => {
  const { user } = await requireAuth(request);
  const input = parseOrThrow(updateUserProfileSchema, await request.json());
  const userProfile = await updateUserProfile(user.id, input);
  return ok({ userProfile }, 'Profile updated.');
});
