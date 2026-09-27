import 'reflect-metadata';
import { Application } from 'express';
import { AppDataSource } from '../src/db/data-source';
import { createApp } from '../src/app';

let app: Application;

export async function initTestApp(): Promise<Application> {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
    await AppDataSource.runMigrations();
  }
  if (!app) {
    app = createApp();
  }
  return app;
}

export async function resetDatabase(): Promise<void> {
  await AppDataSource.query('TRUNCATE TABLE "jobs", "candidates" RESTART IDENTITY CASCADE');
}

export async function closeTestApp(): Promise<void> {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
}
