import { z } from 'zod';
import { paginationSchema } from './common';

export const sendMessageSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, 'Message cannot be empty.')
    .max(5000, 'Message is too long.'),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export const listConversationsSchema = paginationSchema;

export type ListConversationsInput = z.infer<typeof listConversationsSchema>;

export const listMessagesSchema = paginationSchema;

export type ListMessagesInput = z.infer<typeof listMessagesSchema>;

export const ALLOWED_MESSAGE_ATTACHMENT_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const;

export const MAX_MESSAGE_ATTACHMENT_BYTES = 5 * 1024 * 1024;

/** Proposal statuses that allow sending new messages. */
export const MESSAGING_ACTIVE_PROPOSAL_STATUSES = [
  'SUBMITTED',
  'SHORTLISTED',
  'NEGOTIATING',
  'ACCEPTED',
] as const;
