import request from 'supertest';
import { Application } from 'express';
import { initTestApp, resetDatabase, closeTestApp } from './setup';

let app: Application;

const validCandidate = {
  email: 'Ada.Lovelace@example.com',
  fullName: 'Ada Lovelace',
  experienceYears: 5,
  skills: ['Python', 'python', 'SQL'],
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

describe('candidates', () => {
  it('registers a candidate with normalized email and skills', async () => {
    const res = await request(app).post('/candidates').send(validCandidate);
    expect(res.status).toBe(201);
    expect(res.body.email).toBe('ada.lovelace@example.com');
    expect(res.body.skills).toEqual(['python', 'sql']);
  });

  it('rejects a duplicate email case-insensitively', async () => {
    await request(app).post('/candidates').send(validCandidate);
    const res = await request(app)
      .post('/candidates')
      .send({ ...validCandidate, email: 'ADA.LOVELACE@example.com' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('rejects an invalid email', async () => {
    const res = await request(app)
      .post('/candidates')
      .send({ ...validCandidate, email: 'not-an-email' });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('cannot change email through update', async () => {
    const created = await request(app).post('/candidates').send(validCandidate);
    const res = await request(app)
      .patch(`/candidates/${created.body.id}`)
      .send({ email: 'new@example.com', fullName: 'Ada L.' });
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('ada.lovelace@example.com');
    expect(res.body.fullName).toBe('Ada L.');
  });

  it('filters by skill and minExperience', async () => {
    await request(app).post('/candidates').send(validCandidate);
    await request(app).post('/candidates').send({
      email: 'grace@example.com',
      fullName: 'Grace Hopper',
      experienceYears: 1,
      skills: ['cobol'],
    });

    const bySkill = await request(app).get('/candidates?skill=python');
    expect(bySkill.body.total).toBe(1);
    expect(bySkill.body.items[0].fullName).toBe('Ada Lovelace');

    const byExp = await request(app).get('/candidates?minExperience=3');
    expect(byExp.body.total).toBe(1);
    expect(byExp.body.items[0].fullName).toBe('Ada Lovelace');
  });

  it('returns 404 for a missing candidate', async () => {
    const res = await request(app).get('/candidates/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('deletes a candidate', async () => {
    const created = await request(app).post('/candidates').send(validCandidate);
    const del = await request(app).delete(`/candidates/${created.body.id}`);
    expect(del.status).toBe(204);
  });
});
