import 'server-only';
import { prisma, type VerificationPurpose, type VerificationChannel } from '@magobo/db';
import { generateNumericOtp, generateOpaqueToken, hashToken } from '@/server/auth/tokens';
import { ValidationError } from '@/server/errors';

const MAX_VERIFICATION_ATTEMPTS = 5;

export interface CreatedVerification {
  rawValue: string;
  expiresAt: Date;
}

/**
 * Creates a verification record and returns the raw value (an OTP digit
 * code for SMS, an opaque link token for email) that must be delivered
 * out-of-band. Only its hash is persisted.
 */
export async function createVerificationToken(
  userId: string,
  purpose: VerificationPurpose,
  channel: VerificationChannel,
  destination: string,
  ttlMs: number,
): Promise<CreatedVerification> {
  const rawValue = channel === 'SMS' ? generateNumericOtp() : generateOpaqueToken();
  const expiresAt = new Date(Date.now() + ttlMs);

  await prisma.verificationToken.create({
    data: {
      userId,
      purpose,
      channel,
      destination,
      tokenHash: hashToken(rawValue),
      expiresAt,
    },
  });

  return { rawValue, expiresAt };
}

/**
 * Validates and consumes a verification token/OTP for the given purpose.
 * Throws `ValidationError` on any mismatch (wrong/expired/already-used
 * code) — callers should surface this as a generic "invalid or expired
 * code" message rather than distinguishing the exact reason, to avoid
 * leaking information useful for guessing attacks.
 */
export async function consumeVerificationToken(
  userId: string,
  purpose: VerificationPurpose,
  rawValue: string,
): Promise<void> {
  const tokenHash = hashToken(rawValue);

  const candidate = await prisma.verificationToken.findFirst({
    where: { userId, purpose, consumedAt: null },
    orderBy: { createdAt: 'desc' },
  });

  if (!candidate) {
    throw new ValidationError('Invalid or expired code.');
  }

  if (candidate.attempts >= MAX_VERIFICATION_ATTEMPTS || candidate.expiresAt < new Date()) {
    throw new ValidationError('Invalid or expired code.');
  }

  if (candidate.tokenHash !== tokenHash) {
    await prisma.verificationToken.update({
      where: { id: candidate.id },
      data: { attempts: { increment: 1 } },
    });
    throw new ValidationError('Invalid or expired code.');
  }

  await prisma.verificationToken.update({
    where: { id: candidate.id },
    data: { consumedAt: new Date() },
  });
}

/**
 * Same lookup as `consumeVerificationToken`, but for link-style tokens
 * (email verification, password reset) where the raw token itself is the
 * lookup key rather than "the latest pending token for this user".
 */
export async function consumeVerificationTokenByValue(
  purpose: VerificationPurpose,
  rawValue: string,
): Promise<{ userId: string }> {
  const tokenHash = hashToken(rawValue);

  const candidate = await prisma.verificationToken.findUnique({
    where: { tokenHash },
  });

  if (
    !candidate ||
    candidate.purpose !== purpose ||
    candidate.consumedAt ||
    candidate.expiresAt < new Date()
  ) {
    throw new ValidationError('Invalid or expired link.');
  }

  await prisma.verificationToken.update({
    where: { id: candidate.id },
    data: { consumedAt: new Date() },
  });

  return { userId: candidate.userId };
}
