import request from 'supertest';
import { Application } from 'express';
import { initTestApp, resetDatabase, closeTestApp } from './setup';

let app: Application;

const validJob = {
  title: 'Senior Backend Engineer',
  description: 'Build scalable services.',
  employmentType: 'full_time',
  requiredSkills: ['Node.js', 'PostgreSQL', 'node.js'],
  minExperience: 3,
};

beforeAll(async () => {
  app = await initTestApp();
});

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await closeTestApp();
});

describe('jobs', () => {
  it('creates a job as draft and normalizes skills', async () => {
    const res = await request(app).post('/jobs').send(validJob);
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('draft');
    expect(res.body.publishedAt).toBeNull();
    expect(res.body.requiredSkills).toEqual(['node.js', 'postgresql']);
  });

  it('ignores a client-supplied status (cannot create a published job)', async () => {
    const res = await request(app)
      .post('/jobs')
      .send({ ...validJob, status: 'published' });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('draft');
  });

  it('rejects invalid input with the validation envelope', async () => {
    const res = await request(app).post('/jobs').send({ title: '' });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toBeDefined();
  });

  it('publishes a draft and sets publishedAt', async () => {
    const created = await request(app).post('/jobs').send(validJob);
    const res = await request(app).post(`/jobs/${created.body.id}/publish`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('published');
    expect(res.body.publishedAt).not.toBeNull();
  });

  it('rejects publishing a non-draft job', async () => {
    const created = await request(app).post('/jobs').send(validJob);
    await request(app).post(`/jobs/${created.body.id}/publish`);
    const res = await request(app).post(`/jobs/${created.body.id}/publish`);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT_STATE');
  });

  it('rejects updating a closed job', async () => {
    const created = await request(app).post('/jobs').send(validJob);
    await request(app).post(`/jobs/${created.body.id}/close`);
    const res = await request(app)
      .patch(`/jobs/${created.body.id}`)
      .send({ title: 'New title' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT_STATE');
  });

  it('reopens a closed job back to draft', async () => {
    const created = await request(app).post('/jobs').send(validJob);
    await request(app).post(`/jobs/${created.body.id}/publish`);
    await request(app).post(`/jobs/${created.body.id}/close`);
    const res = await request(app).post(`/jobs/${created.body.id}/reopen`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('draft');
    expect(res.body.publishedAt).toBeNull();
  });

  it('filters by status and skill and returns a true total', async () => {
    const a = await request(app).post('/jobs').send(validJob);
    await request(app).post(`/jobs/${a.body.id}/publish`);
    await request(app)
      .post('/jobs')
      .send({ ...validJob, title: 'Frontend', requiredSkills: ['react'] });

    const byStatus = await request(app).get('/jobs?status=published');
    expect(byStatus.body.total).toBe(1);
    expect(byStatus.body.items).toHaveLength(1);

    const bySkill = await request(app).get('/jobs?skill=react');
    expect(bySkill.body.total).toBe(1);
    expect(bySkill.body.items[0].title).toBe('Frontend');
  });

  it('returns 404 with the envelope for a missing job', async () => {
    const res = await request(app).get('/jobs/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('deletes a job', async () => {
    const created = await request(app).post('/jobs').send(validJob);
    const del = await request(app).delete(`/jobs/${created.body.id}`);
    expect(del.status).toBe(204);
    const get = await request(app).get(`/jobs/${created.body.id}`);
    expect(get.status).toBe(404);
  });
});
