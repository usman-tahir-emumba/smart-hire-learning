import { Router } from 'express';
import { CandidateController } from './candidate.controller';
import { asyncHandler } from '../../common/async-handler';

export function candidateRoutes(): Router {
  const router = Router();
  const controller = new CandidateController();

  router.post('/', asyncHandler(controller.create));
  router.get('/', asyncHandler(controller.list));
  router.get('/:id', asyncHandler(controller.getById));
  router.patch('/:id', asyncHandler(controller.update));
  router.delete('/:id', asyncHandler(controller.remove));

  return router;
}
