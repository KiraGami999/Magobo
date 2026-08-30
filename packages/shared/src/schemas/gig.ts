import { z } from 'zod';
import { paginationSchema, uuidSchema } from './common';

export const gigLocationSchema = z.object({
  city: z.string().trim().max(120).optional(),
  region: z.string().trim().max(120).optional(),
  country: z.string().trim().max(120).optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
});

const gigBaseSchema = z.object({
  title: z.string().trim().min(5, 'Title must be at least 5 characters.').max(200),
  description: z
    .string()
    .trim()
    .min(20, 'Describe the gig in at least 20 characters.')
    .max(10000),
  categoryId: uuidSchema,
  budgetMinMinor: z.coerce.number().int().min(0).optional(),
  budgetMaxMinor: z.coerce.number().int().min(0).optional(),
  currency: z.string().trim().length(3).default('MWK'),
  location: gigLocationSchema.optional(),
  deadlineAt: z.coerce.date().optional(),
});

export const createGigSchema = gigBaseSchema
  .refine(
    (data) => data.budgetMinMinor !== undefined || data.budgetMaxMinor !== undefined,
    { message: 'Provide at least a minimum or maximum budget.', path: ['budgetMaxMinor'] },
  )
  .refine(
    (data) =>
      data.budgetMinMinor === undefined ||
      data.budgetMaxMinor === undefined ||
      data.budgetMinMinor <= data.budgetMaxMinor,
    { message: 'Minimum budget cannot exceed maximum budget.', path: ['budgetMaxMinor'] },
  );

export type CreateGigInput = z.infer<typeof createGigSchema>;

export const updateGigSchema = gigBaseSchema.partial();

export type UpdateGigInput = z.infer<typeof updateGigSchema>;

export const discoverGigsSchema = paginationSchema.extend({
  q: z.string().trim().max(200).optional(),
  categoryId: uuidSchema.optional(),
  city: z.string().trim().max(120).optional(),
  country: z.string().trim().max(120).optional(),
  budgetMinMinor: z.coerce.number().int().min(0).optional(),
  budgetMaxMinor: z.coerce.number().int().min(0).optional(),
});

export type DiscoverGigsInput = z.infer<typeof discoverGigsSchema>;

export const ALLOWED_GIG_ATTACHMENT_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

export const MAX_GIG_ATTACHMENT_BYTES = 10 * 1024 * 1024;

/** Phase 4–5 gig transitions — enforced server-side in gig.service.ts / proposal.service.ts. */
export const GIG_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['RECEIVING_PROPOSALS', 'CANCELLED'],
  RECEIVING_PROPOSALS: ['NEGOTIATING', 'AWARDED', 'CANCELLED'],
  NEGOTIATING: ['AWARDED', 'CANCELLED'],
  PUBLISHED: ['RECEIVING_PROPOSALS', 'CANCELLED'],
};
