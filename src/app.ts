import express, { Application } from 'express';
import swaggerUi from 'swagger-ui-express';
import { requestContext } from './common/request-context';
import { errorHandler, notFoundHandler } from './common/error-middleware';
import { jobRoutes } from './modules/jobs/job.routes';
import { candidateRoutes } from './modules/candidates/candidate.routes';
import { healthRoutes } from './modules/health/health.routes';
import { openApiSpec } from './docs/openapi';

export function createApp(): Application {
  const app = express();

  app.use(express.json({ limit: '1mb' }));
  app.use(requestContext);

  app.use('/health', healthRoutes());
  app.use('/jobs', jobRoutes());
  app.use('/candidates', candidateRoutes());

  app.get('/openapi.json', (_req, res) => res.json(openApiSpec));
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
