export type ErrorCode =
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'CONFLICT_STATE'
  | 'VALIDATION_ERROR'
  | 'INTERNAL_ERROR';

export abstract class DomainError extends Error {
  abstract readonly code: ErrorCode;
  abstract readonly httpStatus: number;
  readonly details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.name = new.target.name;
    this.details = details;
  }
}

export class NotFoundError extends DomainError {
  readonly code = 'NOT_FOUND' as const;
  readonly httpStatus = 404;
}

export class ConflictError extends DomainError {
  readonly code = 'CONFLICT' as const;
  readonly httpStatus = 409;
}

export class ConflictStateError extends DomainError {
  readonly code = 'CONFLICT_STATE' as const;
  readonly httpStatus = 409;
}

export class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR' as const;
  readonly httpStatus = 422;
}
