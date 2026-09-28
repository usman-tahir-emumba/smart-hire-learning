import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import type { Logger } from 'pino';
import { logger } from './logger';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      requestId: string;
      log: Logger;
    }
  }
}

const REQUEST_ID_HEADER = 'x-request-id';

export function requestContext(req: Request, res: Response, next: NextFunction): void {
  const inbound = req.header(REQUEST_ID_HEADER);
  const requestId = inbound && inbound.trim() !== '' ? inbound : randomUUID();

  req.requestId = requestId;
  req.log = logger.child({ requestId });
  res.setHeader('X-Request-ID', requestId);

  next();
}
