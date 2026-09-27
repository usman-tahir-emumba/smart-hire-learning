import 'reflect-metadata';
import { AppDataSource } from './data-source';
import { logger } from '../common/logger';

async function run(): Promise<void> {
  await AppDataSource.initialize();
  const migrations = await AppDataSource.runMigrations();
  logger.info(`Applied ${migrations.length} migration(s)`);
  await AppDataSource.destroy();
}

run().catch((err) => {
  logger.error({ err }, 'Migration run failed');
  process.exit(1);
});
