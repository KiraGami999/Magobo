import { z } from 'zod';
import { paginationSchema } from './common';

export const submitProposalSchema = z.object({
  coverLetter: z
    .string()
    .trim()
    .min(30, 'Explain your approach in at least 30 characters.')
    .max(5000),
  amountMinor: z.coerce.number().int().min(1, 'Proposed amount must be positive.'),
  currency: z.string().trim().length(3).default('MWK'),
  estimatedDays: z.coerce.number().int().min(1).max(365).optional(),
});

export type SubmitProposalInput = z.infer<typeof submitProposalSchema>;

export const counterOfferSchema = z.object({
  message: z
    .string()
    .trim()
    .min(5, 'Add a message with your counter-offer.')
    .max(2000),
  amountMinor: z.coerce.number().int().min(1).optional(),
});

export type CounterOfferInput = z.infer<typeof counterOfferSchema>;

export const listProposalsSchema = paginationSchema;

export type ListProposalsInput = z.infer<typeof listProposalsSchema>;

/** Phase 5 proposal transitions — enforced server-side in proposal.service.ts. */
export const PROPOSAL_TRANSITIONS: Record<string, string[]> = {
  SUBMITTED: ['SHORTLISTED', 'NEGOTIATING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'],
  SHORTLISTED: ['NEGOTIATING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'],
  NEGOTIATING: ['ACCEPTED', 'REJECTED', 'WITHDRAWN'],
};

/** Phase 5 gig transitions added alongside proposals. */
export const GIG_PROPOSAL_TRANSITIONS: Record<string, string[]> = {
  RECEIVING_PROPOSALS: ['NEGOTIATING', 'AWARDED', 'CANCELLED'],
  NEGOTIATING: ['AWARDED', 'CANCELLED'],
};
