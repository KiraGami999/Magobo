import type { User } from '@magobo/db';
import type { PublicUser } from '@magobo/shared';

/**
 * The one place a `User` record is shaped for API responses. Every route
 * that returns user data should go through this instead of spreading the
 * Prisma record directly — that's how `passwordHash` etc. would leak.
 */
export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    roles: user.roles,
    status: user.status,
    emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
    phoneVerifiedAt: user.phoneVerifiedAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}
