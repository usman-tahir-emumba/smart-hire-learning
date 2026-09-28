import { Request, Response, NextFunction } from 'express';
import { QueryFailedError } from 'typeorm';
import { DomainError } from './errors';

interface Envelope {
  error: {
    code: string;
    message: string;
    requestId: string;
    details?: unknown;
  };
}

export function notFoundHandler(req: Request, res: Response): void {
  const body: Envelope = {
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
      requestId: req.requestId,
    },
  };
  res.status(404).json(body);
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const requestId = req.requestId;

  if (err instanceof DomainError) {
    const body: Envelope = {
      error: { code: err.code, message: err.message, requestId },
    };
    if (err.details !== undefined) body.error.details = err.details;
    res.status(err.httpStatus).json(body);
    return;
  }

  if (err instanceof QueryFailedError && isUniqueViolation(err)) {
    const body: Envelope = {
      error: {
        code: 'CONFLICT',
        message: 'A resource with the same unique value already exists',
        requestId,
      },
    };
    res.status(409).json(body);
    return;
  }

  req.log?.error({ err }, 'Unhandled error');

  const body: Envelope = {
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      requestId,
    },
  };
  res.status(500).json(body);
}

function isUniqueViolation(err: QueryFailedError): boolean {
  const code = (err as unknown as { code?: string }).code;
  return code === '23505';
}
