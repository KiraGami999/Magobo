import { z } from 'zod';
import { uuidSchema } from './common';

export const availabilitySchema = z.enum(['AVAILABLE', 'LIMITED', 'UNAVAILABLE']);

export const locationSchema = z.object({
  city: z.string().trim().max(120).optional(),
  region: z.string().trim().max(120).optional(),
  country: z.string().trim().max(120).optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
});

export const updateUserProfileSchema = z.object({
  bio: z.string().trim().max(2000).optional(),
  location: locationSchema.optional(),
  yearsOfExperience: z.coerce.number().int().min(0).max(80).optional(),
  availability: availabilitySchema.optional(),
  skills: z.array(z.string().trim().min(1).max(80)).max(30).optional(),
  categoryIds: z.array(uuidSchema).max(20).optional(),
});

export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>;

export const updateBusinessProfileSchema = z.object({
  businessName: z.string().trim().min(2).max(160).optional(),
  description: z.string().trim().max(2000).optional(),
  websiteUrl: z.string().trim().url('Enter a valid website URL.').max(500).optional().or(z.literal('')),
  location: z
    .object({
      city: z.string().trim().max(120).optional(),
      region: z.string().trim().max(120).optional(),
      country: z.string().trim().max(120).optional(),
    })
    .optional(),
  categoryIds: z.array(uuidSchema).max(20).optional(),
});

export type UpdateBusinessProfileInput = z.infer<typeof updateBusinessProfileSchema>;

export const enableProviderRoleSchema = z.object({
  role: z.enum(['SERVICE_PROVIDER', 'BUSINESS']),
});

export type EnableProviderRoleInput = z.infer<typeof enableProviderRoleSchema>;
