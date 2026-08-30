import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { ErrorCode, type ApiResponse } from '@magobo/shared';
import { AppError } from './errors';

export function ok<T>(data: T, message?: string, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data, message }, { status });
}

export function fail(
  code: ErrorCode,
  message: string,
  status: number,
  details?: Record<string, string[]>,
): NextResponse<ApiResponse<never>> {
  return NextResponse.json({ success: false, error: { code, message, details } }, { status });
}

/**
 * Wraps a Next.js route handler so that:
 *  - Known `AppError`s become predictable, typed API responses.
 *  - Zod validation errors become 400 responses with field-level details.
 *  - Anything unexpected is logged server-side and returned as a generic
 *    500 — raw exception messages/stack traces are never sent to clients.
 *
 * This is the single place error handling policy lives, so individual
 * routes never need to duplicate try/catch boilerplate.
 */
export function withErrorHandling<Args extends unknown[]>(
  handler: (...args: Args) => Promise<NextResponse>,
): (...args: Args) => Promise<NextResponse> {
  return async (...args: Args) => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof AppError) {
        return fail(error.code, error.message, error.statusCode, error.details);
      }

      if (error instanceof ZodError) {
        const details: Record<string, string[]> = {};
        for (const issue of error.issues) {
          const key = issue.path.join('.') || '_';
          details[key] = [...(details[key] ?? []), issue.message];
        }
        return fail(ErrorCode.VALIDATION_ERROR, 'Invalid input.', 400, details);
      }

      // Never expose internal exception details to the client.
      console.error('[unhandled_api_error]', error);
      return fail(ErrorCode.INTERNAL_ERROR, 'Something went wrong. Please try again.', 500);
    }
  };
}
