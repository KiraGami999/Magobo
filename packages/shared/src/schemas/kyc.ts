import { z } from 'zod';

export const kycDocumentTypeSchema = z.enum([
  'GOVERNMENT_ID_FRONT',
  'GOVERNMENT_ID_BACK',
  'SELFIE',
  'BUSINESS_REGISTRATION',
  'PROOF_OF_ADDRESS',
]);

export const adminKycRejectSchema = z.object({
  reason: z.string().trim().min(5, 'Provide a reason for rejection.').max(1000),
});

export type AdminKycRejectInput = z.infer<typeof adminKycRejectSchema>;

/** Required documents for individual/service-provider KYC. */
export const INDIVIDUAL_KYC_DOCUMENTS = [
  'GOVERNMENT_ID_FRONT',
  'GOVERNMENT_ID_BACK',
  'SELFIE',
] as const;

/** Additional documents when the user also has a BUSINESS role. */
export const BUSINESS_KYC_DOCUMENTS = ['BUSINESS_REGISTRATION'] as const;

export const ALLOWED_KYC_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const;

export const ALLOWED_PROFILE_PHOTO_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export const MAX_KYC_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_PROFILE_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB
