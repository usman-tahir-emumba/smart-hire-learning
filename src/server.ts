import 'reflect-metadata';
import { createApp } from './app';
import { AppDataSource } from './db/data-source';
import { config } from './config';
import { logger } from './common/logger';

async function bootstrap(): Promise<void> {
  await AppDataSource.initialize();
  logger.info('Database connection established');

  const app = createApp();
  const server = app.listen(config.port, () => {
    logger.info(`SmartHire API listening on port ${config.port}`);
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`Received ${signal}, shutting down`);
    server.close();
    await AppDataSource.destroy();
    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});
