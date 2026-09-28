import { Router, Request, Response } from 'express';
import { AppDataSource } from '../../db/data-source';
import { asyncHandler } from '../../common/async-handler';

export function healthRoutes(): Router {
  const router = Router();

  router.get('/live', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  router.get(
    '/ready',
    asyncHandler(async (_req: Request, res: Response) => {
      try {
        await AppDataSource.query('SELECT 1');
        res.json({ status: 'ready', dependencies: { database: 'up' } });
      } catch {
        res.status(503).json({ status: 'unavailable', dependencies: { database: 'down' } });
      }
    }),
  );

  return router;
}
