import type { NextRequest } from 'next/server';
import { ok, withErrorHandling } from '@/server/api-response';
import { requireAuth } from '@/server/auth/guards';
import { clearSessionCookie } from '@/server/auth/session';
import { logoutUser } from '@/server/services/auth.service';
import { isMobileClient } from '@/server/auth/issue-session';

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { session } = await requireAuth(request);

  await logoutUser(session.id);

  if (!isMobileClient(request)) {
    await clearSessionCookie();
  }

  return ok(null, 'Logged out.');
});
