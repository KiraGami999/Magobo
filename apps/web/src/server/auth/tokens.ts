import { createHash, randomBytes, randomInt } from 'crypto';

/**
 * Generates an opaque, high-entropy session/verification-link token. The
 * raw value is sent to the client (cookie, email link, Authorization
 * header) and is never itself persisted — only its hash is stored, so a
 * database leak alone can't be used to impersonate a session.
 */
export function generateOpaqueToken(): string {
  return randomBytes(32).toString('base64url');
}

/** Generates a 6-digit numeric OTP suitable for SMS delivery. */
export function generateNumericOtp(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

export function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}
