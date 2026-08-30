import { describe, expect, it } from 'vitest';
import type { User } from '@magobo/db';
import { UnauthorizedError } from '@/server/errors';
import { requireOwnership, requireRole } from './guards';

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    email: 'test@example.com',
    phone: null,
    fullName: 'Test User',
    passwordHash: 'irrelevant-for-this-test',
    roles: ['INDIVIDUAL'],
    status: 'ACTIVE',
    emailVerifiedAt: null,
    phoneVerifiedAt: null,
    lastLoginAt: null,
    failedLoginAttempts: 0,
    lockedUntil: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

describe('requireRole', () => {
  it('does not throw when the user has one of the allowed roles', () => {
    const user = makeUser({ roles: ['SERVICE_PROVIDER'] });
    expect(() => requireRole(user, 'SERVICE_PROVIDER', 'ADMIN')).not.toThrow();
  });

  it('throws UnauthorizedError when the user has none of the allowed roles', () => {
    const user = makeUser({ roles: ['INDIVIDUAL'] });
    expect(() => requireRole(user, 'ADMIN')).toThrow(UnauthorizedError);
  });

  it('checks against every role a user holds, not just the first', () => {
    const user = makeUser({ roles: ['INDIVIDUAL', 'SERVICE_PROVIDER'] });
    expect(() => requireRole(user, 'SERVICE_PROVIDER')).not.toThrow();
  });
});

describe('requireOwnership', () => {
  it('does not throw when the user owns the resource', () => {
    const user = makeUser({ id: 'user-1' });
    expect(() => requireOwnership(user, 'user-1')).not.toThrow();
  });

  it('does not throw for an admin acting on someone else\u2019s resource', () => {
    const admin = makeUser({ id: 'admin-1', roles: ['ADMIN'] });
    expect(() => requireOwnership(admin, 'someone-elses-id')).not.toThrow();
  });

  it('throws UnauthorizedError when a non-owner, non-admin user tries to act on the resource', () => {
    const user = makeUser({ id: 'user-1', roles: ['INDIVIDUAL'] });
    expect(() => requireOwnership(user, 'someone-elses-id')).toThrow(UnauthorizedError);
  });
});
