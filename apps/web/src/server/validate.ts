import type { z } from 'zod';

/**
 * Parses `input` against `schema`, throwing a `ZodError` (caught centrally
 * by `withErrorHandling`) on failure. Keeping this as a one-line helper
 * ensures every route validates input the same way instead of hand-rolling
 * `safeParse` checks.
 */
export function parseOrThrow<Schema extends z.ZodTypeAny>(
  schema: Schema,
  input: unknown,
): z.infer<Schema> {
  return schema.parse(input);
}
