import { Router } from 'express';
import { JobController } from './job.controller';
import { asyncHandler } from '../../common/async-handler';

export function jobRoutes(): Router {
  const router = Router();
  const controller = new JobController();

  router.post('/', asyncHandler(controller.create));
  router.get('/', asyncHandler(controller.list));
  router.get('/:id', asyncHandler(controller.getById));
  router.patch('/:id', asyncHandler(controller.update));
  router.post('/:id/publish', asyncHandler(controller.publish));
  router.post('/:id/close', asyncHandler(controller.close));
  router.post('/:id/reopen', asyncHandler(controller.reopen));
  router.delete('/:id', asyncHandler(controller.remove));

  return router;
}
