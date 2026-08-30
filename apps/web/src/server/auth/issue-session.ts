import 'server-only';
import type { NextRequest } from 'next/server';
import { createSession, setSessionCookie } from './session';

/**
 * Web and mobile authenticate the same backend differently:
 *  - Web relies on an httpOnly cookie — the raw token is never exposed to
 *    page JavaScript, which is what makes it resistant to XSS-based theft.
 *  - React Native has no equivalent to httpOnly cookies, so the mobile
 *    client explicitly opts in (`X-Client-Platform: mobile`) to receive
 *    the raw token in the response body and stores it itself in
 *    `expo-secure-store` (OS keychain/keystore), sending it back as
 *    `Authorization: Bearer <token>`.
 *
 * A plain web request never gets the raw token back in JSON — only the
 * mobile path does, and only because it explicitly asked for it.
 */
export function isMobileClient(request: NextRequest): boolean {
  return request.headers.get('x-client-platform') === 'mobile';
}

export async function issueSession(
  request: NextRequest,
  userId: string,
): Promise<{ sessionToken?: string }> {
  const rawToken = await createSession(userId, {
    userAgent: request.headers.get('user-agent'),
    ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
  });

  if (isMobileClient(request)) {
    return { sessionToken: rawToken };
  }

  await setSessionCookie(rawToken);
  return {};
}
