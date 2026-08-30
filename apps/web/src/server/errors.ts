import { ErrorCode } from '@magobo/shared';

/**
 * Base class for every expected/handled application error. Route handlers
 * catch `AppError` and translate it into the standard API error envelope.
 * Anything that is *not* an `AppError` is treated as an unexpected internal
 * failure and never leaks its message to the client.
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;
  readonly details?: Record<string, string[]>;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number,
    details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, string[]>) {
    super(ErrorCode.VALIDATION_ERROR, message, 400, details);
    this.name = 'ValidationError';
  }
}

export class UnauthenticatedError extends AppError {
  constructor(message = 'Authentication is required.') {
    super(ErrorCode.UNAUTHENTICATED, message, 401);
    this.name = 'UnauthenticatedError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'You do not have permission to perform this action.') {
    super(ErrorCode.UNAUTHORIZED, message, 403);
    this.name = 'UnauthorizedError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(ErrorCode.RESOURCE_NOT_FOUND, `${resource} not found.`, 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(ErrorCode.CONFLICT, message, 409);
    this.name = 'ConflictError';
  }
}

export class RateLimitedError extends AppError {
  constructor(message = 'Too many requests. Please try again shortly.') {
    super(ErrorCode.RATE_LIMITED, message, 429);
    this.name = 'RateLimitedError';
  }
}
