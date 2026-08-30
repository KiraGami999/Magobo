import 'server-only';
import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { prisma, type Session, type User } from '@magobo/db';
import { generateOpaqueToken, hashToken } from './tokens';

export const SESSION_COOKIE_NAME = 'magobo_session';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface SessionMeta {
  userAgent?: string | null;
  ipAddress?: string | null;
}

/**
 * Creates a database-backed session and returns the raw token. Only the
 * hash is ever persisted (see `Session.tokenHash`), so possession of the
 * raw token — never stored anywhere — is what proves the session is
 * legitimate. This also makes sessions individually revocable server-side,
 * unlike a stateless JWT.
 */
export async function createSession(userId: string, meta: SessionMeta = {}): Promise<string> {
  const rawToken = generateOpaqueToken();

  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashToken(rawToken),
      userAgent: meta.userAgent ?? null,
      ipAddress: meta.ipAddress ?? null,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    },
  });

  return rawToken;
}

/**
 * Resolves the raw session token from either the httpOnly cookie (web) or
 * an `Authorization: Bearer <token>` header (mobile) — the same backend
 * serves both clients identically.
 */
async function extractRawToken(request?: NextRequest): Promise<string | null> {
  const authHeader = request?.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length).trim();
  }

  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
}

export interface ResolvedSession {
  session: Session;
  user: User;
}

/**
 * Looks up the session for the current request. Returns `null` for any
 * missing, expired, or revoked session rather than throwing — callers
 * decide whether authentication is required for their route.
 */
export async function getSessionFromRequest(
  request?: NextRequest,
): Promise<ResolvedSession | null> {
  const rawToken = await extractRawToken(request);
  if (!rawToken) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(rawToken) },
    include: { user: true },
  });

  if (!session || session.revokedAt || session.expiresAt < new Date()) {
    return null;
  }

  if (
    session.user.deletedAt ||
    session.user.status === 'SUSPENDED' ||
    session.user.status === 'DEACTIVATED'
  ) {
    return null;
  }

  // Sliding expiration: touch lastUsedAt without blocking the request.
  void prisma.session
    .update({ where: { id: session.id }, data: { lastUsedAt: new Date() } })
    .catch(() => undefined);

  const { user, ...sessionOnly } = session;
  return { session: sessionOnly, user };
}

export async function revokeSession(sessionId: string): Promise<void> {
  await prisma.session.update({
    where: { id: sessionId },
    data: { revokedAt: new Date() },
  });
}

export async function revokeAllSessionsForUser(userId: string): Promise<void> {
  await prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function setSessionCookie(rawToken: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
