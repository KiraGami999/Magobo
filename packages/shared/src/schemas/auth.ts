import { z } from 'zod';
import { emailSchema, passwordSchema, phoneSchema } from './common';

/**
 * Registration requires an email OR a phone number (at least one), plus a
 * password and display name. Magobo has one identity system — there is no
 * separate "client" vs "provider" registration flow; roles/capabilities
 * are layered on afterward.
 */
export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Enter your full name.').max(120),
    email: emailSchema.optional(),
    phone: phoneSchema.optional(),
    password: passwordSchema,
  })
  .refine((data) => Boolean(data.email) || Boolean(data.phone), {
    message: 'Provide an email address or a phone number.',
    path: ['email'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z
  .object({
    email: emailSchema.optional(),
    phone: phoneSchema.optional(),
    password: z.string().min(1, 'Enter your password.'),
  })
  .refine((data) => Boolean(data.email) || Boolean(data.phone), {
    message: 'Provide an email address or a phone number.',
    path: ['email'],
  });

export type LoginInput = z.infer<typeof loginSchema>;

export const requestPasswordResetSchema = z.object({
  email: emailSchema,
});

export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(16, 'Invalid or expired reset link.'),
  password: passwordSchema,
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const verifyEmailSchema = z.object({
  token: z.string().min(16, 'Invalid or expired verification link.'),
});

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

export const requestPhoneOtpSchema = z.object({
  phone: phoneSchema,
});

export type RequestPhoneOtpInput = z.infer<typeof requestPhoneOtpSchema>;

export const verifyPhoneOtpSchema = z.object({
  phone: phoneSchema,
  code: z.string().length(6, 'Enter the 6-digit code.'),
});

export type VerifyPhoneOtpInput = z.infer<typeof verifyPhoneOtpSchema>;
