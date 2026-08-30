import 'server-only';
import { prisma, type User } from '@magobo/db';
import type { LoginInput, RegisterInput } from '@magobo/shared';
import {
  ConflictError,
  UnauthenticatedError,
  UnauthorizedError,
  ValidationError,
} from '@/server/errors';
import { hashPassword, verifyPassword } from '@/server/auth/password';
import { revokeAllSessionsForUser, revokeSession } from '@/server/auth/session';
import { emailProvider } from '@/server/providers/email';
import { smsProvider } from '@/server/providers/sms';
import {
  consumeVerificationToken,
  consumeVerificationTokenByValue,
  createVerificationToken,
} from './verification.service';

const EMAIL_VERIFICATION_TTL_MS = 60 * 60 * 1000; // 1 hour
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1 hour
const PHONE_OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

const GENERIC_INVALID_CREDENTIALS = 'Invalid email/phone or password.';

export async function registerUser(input: RegisterInput): Promise<User> {
  const email = input.email?.toLowerCase();
  const phone = input.phone;

  const existing = await prisma.user.findFirst({
    where: {
      OR: [email ? { email } : undefined, phone ? { phone } : undefined].filter(Boolean) as never[],
      deletedAt: null,
    },
  });

  if (existing) {
    throw new ConflictError('An account with this email or phone number already exists.');
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      email,
      phone,
      fullName: input.fullName,
      passwordHash,
      roles: ['INDIVIDUAL'],
      status: 'PENDING_VERIFICATION',
    },
  });

  await sendVerificationChallenge(user);

  return user;
}

async function sendVerificationChallenge(user: User): Promise<void> {
  if (user.email) {
    const { rawValue } = await createVerificationToken(
      user.id,
      'EMAIL_VERIFICATION',
      'EMAIL',
      user.email,
      EMAIL_VERIFICATION_TTL_MS,
    );
    await emailProvider.send({
      to: user.email,
      subject: 'Verify your Magobo account',
      body: `Hi ${user.fullName}, verify your email using this code: ${rawValue}`,
    });
    return;
  }

  if (user.phone) {
    const { rawValue } = await createVerificationToken(
      user.id,
      'PHONE_VERIFICATION',
      'SMS',
      user.phone,
      PHONE_OTP_TTL_MS,
    );
    await smsProvider.send({
      to: user.phone,
      body: `Your Magobo verification code is ${rawValue}. It expires in 10 minutes.`,
    });
  }
}

export async function loginUser(input: LoginInput): Promise<User> {
  const email = input.email?.toLowerCase();
  const phone = input.phone;

  const user = await prisma.user.findFirst({
    where: {
      OR: [email ? { email } : undefined, phone ? { phone } : undefined].filter(Boolean) as never[],
      deletedAt: null,
    },
  });

  // Same generic error whether the account doesn't exist or the password
  // is wrong — never reveal which one it was (avoids account enumeration).
  if (!user) {
    throw new UnauthenticatedError(GENERIC_INVALID_CREDENTIALS);
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new UnauthorizedError('Too many failed attempts. Try again later.');
  }

  const passwordValid = await verifyPassword(input.password, user.passwordHash);

  if (!passwordValid) {
    const failedLoginAttempts = user.failedLoginAttempts + 1;
    const lockedUntil =
      failedLoginAttempts >= MAX_FAILED_LOGIN_ATTEMPTS
        ? new Date(Date.now() + LOGIN_LOCKOUT_MS)
        : null;

    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts, lockedUntil },
    });

    throw new UnauthenticatedError(GENERIC_INVALID_CREDENTIALS);
  }

  if (user.status === 'SUSPENDED' || user.status === 'DEACTIVATED') {
    throw new UnauthorizedError('This account is no longer active.');
  }

  return prisma.user.update({
    where: { id: user.id },
    data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
  });
}

export async function logoutUser(sessionId: string): Promise<void> {
  await revokeSession(sessionId);
}

export async function verifyEmailToken(rawToken: string): Promise<User> {
  const { userId } = await consumeVerificationTokenByValue('EMAIL_VERIFICATION', rawToken);
  return activateAfterVerification(userId, 'email');
}

export async function verifyPhoneOtp(userId: string, code: string): Promise<User> {
  await consumeVerificationToken(userId, 'PHONE_VERIFICATION', code);
  return activateAfterVerification(userId, 'phone');
}

async function activateAfterVerification(
  userId: string,
  channel: 'email' | 'phone',
): Promise<User> {
  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(channel === 'email' ? { emailVerifiedAt: new Date() } : { phoneVerifiedAt: new Date() }),
      status: 'ACTIVE',
    },
  });
}

export async function requestPhoneOtp(user: User): Promise<void> {
  if (!user.phone) {
    throw new ValidationError('Add a phone number before requesting a verification code.');
  }

  const { rawValue } = await createVerificationToken(
    user.id,
    'PHONE_VERIFICATION',
    'SMS',
    user.phone,
    PHONE_OTP_TTL_MS,
  );

  await smsProvider.send({
    to: user.phone,
    body: `Your Magobo verification code is ${rawValue}. It expires in 10 minutes.`,
  });
}

/**
 * Always resolves successfully, even if no account matches — the caller
 * should return the same generic "check your email" response either way
 * so an attacker can't use this endpoint to discover which emails are
 * registered.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const user = await prisma.user.findFirst({
    where: { email: email.toLowerCase(), deletedAt: null },
  });

  if (!user) return;

  const { rawValue } = await createVerificationToken(
    user.id,
    'PASSWORD_RESET',
    'EMAIL',
    user.email!,
    PASSWORD_RESET_TTL_MS,
  );

  await emailProvider.send({
    to: user.email!,
    subject: 'Reset your Magobo password',
    body: `Hi ${user.fullName}, use this code to reset your password: ${rawValue}. It expires in 1 hour.`,
  });
}

export async function resetPassword(rawToken: string, newPassword: string): Promise<void> {
  const { userId } = await consumeVerificationTokenByValue('PASSWORD_RESET', rawToken);
  const passwordHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash, failedLoginAttempts: 0, lockedUntil: null },
  });

  // Resetting the password invalidates every existing session — if an
  // attacker had a stolen session, it dies here too.
  await revokeAllSessionsForUser(userId);
}
