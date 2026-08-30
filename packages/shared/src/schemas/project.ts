import { z } from 'zod';
import { paginationSchema } from './common';

export const createMilestoneSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters.').max(200),
  description: z.string().trim().max(2000).optional(),
  sortOrder: z.coerce.number().int().min(0).default(0),
  amountMinor: z.coerce.number().int().min(0).optional(),
  dueAt: z.coerce.date().optional(),
});

export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>;

export const submitDeliverableSchema = z.object({
  notes: z
    .string()
    .trim()
    .min(10, 'Describe what you are submitting in at least 10 characters.')
    .max(5000),
});

export type SubmitDeliverableInput = z.infer<typeof submitDeliverableSchema>;

export const requestRevisionSchema = z.object({
  message: z
    .string()
    .trim()
    .min(10, 'Explain what needs to change in at least 10 characters.')
    .max(3000),
});

export type RequestRevisionInput = z.infer<typeof requestRevisionSchema>;

export const rejectMilestoneSchema = z.object({
  message: z.string().trim().min(5).max(1000).optional(),
});

export type RejectMilestoneInput = z.infer<typeof rejectMilestoneSchema>;

export const listProjectsSchema = paginationSchema;

export type ListProjectsInput = z.infer<typeof listProjectsSchema>;

export const ALLOWED_DELIVERABLE_ATTACHMENT_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/zip',
] as const;

export const MAX_DELIVERABLE_ATTACHMENT_BYTES = 25 * 1024 * 1024;

/** Phase 7 gig project transitions — enforced in project.service.ts. */
export const PROJECT_GIG_TRANSITIONS: Record<string, string[]> = {
  AWARDED: ['IN_PROGRESS'],
  IN_PROGRESS: ['SUBMITTED'],
  SUBMITTED: ['REVISION_REQUESTED', 'COMPLETED'],
  REVISION_REQUESTED: ['RESUBMITTED'],
  RESUBMITTED: ['REVISION_REQUESTED', 'COMPLETED'],
};

export const MILESTONE_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['SUBMITTED'],
  REJECTED: ['SUBMITTED'],
  SUBMITTED: ['APPROVED', 'REJECTED'],
};

export const PROJECT_GIG_STATUSES = [
  'AWARDED',
  'IN_PROGRESS',
  'SUBMITTED',
  'REVISION_REQUESTED',
  'RESUBMITTED',
  'COMPLETED',
  'REVIEWED',
] as const;
