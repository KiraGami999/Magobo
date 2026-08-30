import { z } from 'zod';
import { paginationSchema } from './common';

export const listNotificationsSchema = paginationSchema.extend({
  unreadOnly: z
    .union([z.literal('true'), z.literal('false'), z.boolean()])
    .optional()
    .transform((value) => value === true || value === 'true'),
});

export type ListNotificationsInput = z.infer<typeof listNotificationsSchema>;
