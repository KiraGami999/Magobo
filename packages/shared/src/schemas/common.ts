import { z } from 'zod';

/**
 * Reusable validation primitives. Domain-specific schemas (auth, gigs,
 * proposals, ...) are added incrementally in their own modules and should
 * compose these rather than redefining basic rules.
 */

export const emailSchema = z.string().trim().toLowerCase().email('Enter a valid email address.');

/** E.164-ish phone number: leading "+" and 8-15 digits. */
export const phoneSchema = z
  .string()
  .trim()
  .regex(
    /^\+[1-9]\d{7,14}$/,
    'Enter a valid phone number in international format, e.g. +265991234567.',
  );

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  .max(128, 'Password is too long.')
  .regex(/[a-z]/, 'Password must contain a lowercase letter.')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter.')
  .regex(/[0-9]/, 'Password must contain a number.');

export const uuidSchema = z.string().uuid('Invalid identifier.');

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
