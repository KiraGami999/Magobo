import { z } from 'zod';
import { paginationSchema } from './common';

export const REPORT_REASONS = [
  'SPAM',
  'HARASSMENT',
  'FRAUD',
  'OFF_PLATFORM',
  'INAPPROPRIATE',
  'OTHER',
] as const;

export const createReportSchema = z.object({
  targetType: z.enum(['USER', 'GIG', 'MESSAGE']),
  targetId: z.string().uuid(),
  reason: z.enum(REPORT_REASONS),
  description: z
    .string()
    .trim()
    .min(10, 'Describe the issue in at least 10 characters.')
    .max(2000),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;

export const adminResolveReportSchema = z.object({
  status: z.enum(['RESOLVED', 'DISMISSED']),
  resolutionNote: z.string().trim().min(5).max(1000).optional(),
});

export type AdminResolveReportInput = z.infer<typeof adminResolveReportSchema>;

export const adminSuspendUserSchema = z.object({
  reason: z.string().trim().min(5, 'Provide a reason.').max(500),
});

export type AdminSuspendUserInput = z.infer<typeof adminSuspendUserSchema>;

export const adminSuspendGigSchema = z.object({
  reason: z.string().trim().min(5, 'Provide a reason.').max(500),
});

export type AdminSuspendGigInput = z.infer<typeof adminSuspendGigSchema>;

export const adminListUsersSchema = paginationSchema.extend({
  status: z.enum(['PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'DEACTIVATED']).optional(),
  q: z.string().trim().max(200).optional(),
});

export type AdminListUsersInput = z.infer<typeof adminListUsersSchema>;

export const adminListGigsSchema = paginationSchema.extend({
  status: z.string().trim().max(50).optional(),
  q: z.string().trim().max(200).optional(),
});

export type AdminListGigsInput = z.infer<typeof adminListGigsSchema>;

export const adminListReportsSchema = paginationSchema.extend({
  status: z.enum(['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED']).optional(),
});

export type AdminListReportsInput = z.infer<typeof adminListReportsSchema>;

export const adminListAuditLogsSchema = paginationSchema;

export type AdminListAuditLogsInput = z.infer<typeof adminListAuditLogsSchema>;

/** Known audit actions — extend as admin capabilities grow. */
export const AUDIT_ACTIONS = {
  KYC_APPROVED: 'KYC_APPROVED',
  KYC_REJECTED: 'KYC_REJECTED',
  USER_SUSPENDED: 'USER_SUSPENDED',
  USER_REACTIVATED: 'USER_REACTIVATED',
  GIG_SUSPENDED: 'GIG_SUSPENDED',
  REPORT_RESOLVED: 'REPORT_RESOLVED',
  REPORT_DISMISSED: 'REPORT_DISMISSED',
  MESSAGE_FLAG_CLEARED: 'MESSAGE_FLAG_CLEARED',
} as const;
