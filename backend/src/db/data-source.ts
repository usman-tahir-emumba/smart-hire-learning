import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from '../config';
import { Job } from '../modules/jobs/job.entity';
import { Candidate } from '../modules/candidates/candidate.entity';
import { InitSchema1700000000000 } from './migrations/1700000000000-InitSchema';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.db.host,
  port: config.db.port,
  username: config.db.user,
  password: config.db.password,
  database: config.db.name,
  entities: [Job, Candidate],
  migrations: [InitSchema1700000000000],
  synchronize: false,
  logging: config.env === 'development' ? ['error', 'warn'] : ['error'],
});
