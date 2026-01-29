import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './test-app';

describe('App (e2e)', () => {
  let app: INestApplication<App>;
  let accessToken: string;
  const unique = `test-${Date.now()}@example.com`;

  beforeAll(async () => {
    app = await createTestApp();
  }, 30000);

  afterAll(async () => {
    if (app) await app.close();
  });

  it('GET / returns Hello World!', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect((res) => {
        expect(res.text).toBe('Hello World!');
      });
  });

  it('POST /auth/register returns 201 with access_token and user', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .set('Content-Type', 'application/json')
      .send({ email: unique, password: 'password123' })
      .expect(201);

    expect(res.body).toHaveProperty('access_token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user.email).toBe(unique);
    accessToken = res.body.access_token;
  });

  it('POST /auth/login returns 200 with access_token and user', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .set('Content-Type', 'application/json')
      .send({ email: unique, password: 'password123' })
      .expect(200);

    expect(res.body).toHaveProperty('access_token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user.email).toBe(unique);
    accessToken = res.body.access_token;
  });

  it('GET /wallets without Authorization returns 401', async () => {
    await request(app.getHttpServer()).get('/wallets').expect(401);
  });

  it('GET /wallets with Bearer token returns 200 and array', async () => {
    const res = await request(app.getHttpServer())
      .get('/wallets')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /wallets with Bearer token returns 201 and created wallet', async () => {
    const res = await request(app.getHttpServer())
      .post('/wallets')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Content-Type', 'application/json')
      .send({ name: 'E2E Wallet', currency: 'RUB' })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe('E2E Wallet');
    expect(res.body.currency).toBe('RUB');
    expect(res.body).toHaveProperty('balance');
  });

  it('GET /transactions with Bearer token returns 200 and data structure', async () => {
    const res = await request(app.getHttpServer())
      .get('/transactions')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('page');
    expect(res.body).toHaveProperty('limit');
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
