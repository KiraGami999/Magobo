/**
 * The subset of a `User` record that is ever safe to send to a client.
 * Never include `passwordHash`, `failedLoginAttempts`, `lockedUntil`, or
 * other internal security bookkeeping fields in an API response.
 */
export interface PublicUser {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  roles: string[];
  status: string;
  emailVerifiedAt: string | null;
  phoneVerifiedAt: string | null;
  createdAt: string;
}
