import bcrypt from 'bcryptjs';

/**
 * bcrypt work factor. 12 rounds is a reasonable balance of security and
 * latency for an interactive login flow as of 2026 hardware.
 */
const SALT_ROUNDS = 12;

export async function hashPassword(plainTextPassword: string): Promise<string> {
  return bcrypt.hash(plainTextPassword, SALT_ROUNDS);
}

export async function verifyPassword(plainTextPassword: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainTextPassword, hash);
}
