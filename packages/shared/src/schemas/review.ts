import { z } from 'zod';
import { paginationSchema } from './common';

export const createReviewSchema = z.object({
  rating: z.coerce.number().int().min(1, 'Rating must be at least 1.').max(5, 'Rating cannot exceed 5.'),
  comment: z.string().trim().max(2000).optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

export const listReviewsSchema = paginationSchema;

export type ListReviewsInput = z.infer<typeof listReviewsSchema>;
