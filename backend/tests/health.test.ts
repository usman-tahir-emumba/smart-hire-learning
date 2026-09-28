import request from 'supertest';
import { Application } from 'express';
import { initTestApp, closeTestApp } from './setup';

let app: Application;

beforeAll(async () => {
  app = await initTestApp();
});

afterAll(async () => {
  await closeTestApp();
});

describe('health', () => {
  it('liveness returns ok', async () => {
    const res = await request(app).get('/health/live');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('readiness returns ready when the database is up', async () => {
    const res = await request(app).get('/health/ready');
    expect(res.status).toBe(200);
    expect(res.body.dependencies.database).toBe('up');
  });

  it('unknown route returns the error envelope', async () => {
    const res = await request(app).get('/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(res.body.error.requestId).toBeDefined();
    expect(res.headers['x-request-id']).toBeDefined();
  });
});
