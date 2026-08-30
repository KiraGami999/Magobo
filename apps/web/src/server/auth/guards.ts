import 'server-only';
import type { NextRequest } from 'next/server';
import type { UserRole, User } from '@magobo/db';
import { UnauthenticatedError, UnauthorizedError } from '@/server/errors';
import { getSessionFromRequest, type ResolvedSession } from './session';

/**
 * Resolves the authenticated session or throws `UnauthenticatedError`.
 * Every protected route handler should call this first — authentication
 * answers "who are you", and it must happen before any authorization or
 * business logic runs.
 */
export async function requireAuth(request?: NextRequest): Promise<ResolvedSession> {
  const resolved = await getSessionFromRequest(request);
  if (!resolved) {
    throw new UnauthenticatedError();
  }
  return resolved;
}

/**
 * Authorization: "are you allowed to do this". Checked *after*
 * authentication, and only ever against the server-resolved user record —
 * never against anything the client claims about itself.
 */
export function requireRole(user: User, ...allowed: UserRole[]): void {
  const hasRole = user.roles.some((role) => allowed.includes(role));
  if (!hasRole) {
    throw new UnauthorizedError();
  }
}

/**
 * Resource-ownership check. A user must own (or be an admin over) a
 * resource before acting on it — knowing a resource's ID is never
 * sufficient. Call this in every service method that mutates a
 * user-owned record.
 */
export function requireOwnership(user: User, ownerUserId: string): void {
  if (user.id === ownerUserId) return;
  if (user.roles.includes('ADMIN')) return;
  throw new UnauthorizedError();
}
