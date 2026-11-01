import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ADMIN, loginAgent, startTestApp } from './helpers';

let ctx: Awaited<ReturnType<typeof startTestApp>>;
beforeAll(async () => {
  ctx = await startTestApp();
});
afterAll(() => ctx.stop());

describe('auth', () => {
  it('rejects unauthenticated access to protected endpoints with 401', async () => {
    for (const url of ['/api/appointments', '/api/dashboard/stats', '/api/auth/me']) {
      const res = await request(ctx.app).get(url);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    }
  });

  it('rejects login without a CSRF token (403)', async () => {
    const res = await request(ctx.app).post('/api/auth/login').send(ADMIN);
    expect(res.status).toBe(403);
  });

  it('logs in, sets an HttpOnly cookie, and exposes /me without leaking secrets', async () => {
    const { res, agent } = await loginAgent(ctx.app);
    expect(res.status).toBe(200);
    const cookie = String(res.headers['set-cookie']);
    expect(cookie).toMatch(/sid=/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|\$2[aby]\$/);

    const me = await agent.get('/api/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.data.admin.email).toBe(ADMIN.email);
  });

  it('returns the same generic 401 for wrong password and unknown account', async () => {
    const agent = request.agent(ctx.app);
    const token = (await agent.get('/api/auth/csrf')).body.data.csrfToken;
    const wrongPw = await agent.post('/api/auth/login').set('x-csrf-token', token).send({ email: ADMIN.email, password: 'nope-nope-nope' });
    const unknown = await agent.post('/api/auth/login').set('x-csrf-token', token).send({ email: 'ghost@example.com', password: 'nope-nope-nope' });
    expect(wrongPw.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(unknown.body.message).toBe(wrongPw.body.message);
  });

  it('validates login payloads (422)', async () => {
    const agent = request.agent(ctx.app);
    const token = (await agent.get('/api/auth/csrf')).body.data.csrfToken;
    const res = await agent.post('/api/auth/login').set('x-csrf-token', token).send({ email: 'not-an-email' });
    expect(res.status).toBe(422);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  it('rejects NoSQL operator injection in credentials', async () => {
    const agent = request.agent(ctx.app);
    const token = (await agent.get('/api/auth/csrf')).body.data.csrfToken;
    const res = await agent.post('/api/auth/login').set('x-csrf-token', token).send({ email: { $ne: '' }, password: { $ne: '' } });
    expect(res.status).toBe(422);
  });

  it('logs out and invalidates the session', async () => {
    const { agent, csrf } = await loginAgent(ctx.app);
    const out = await agent.post('/api/auth/logout').set('x-csrf-token', csrf);
    expect(out.status).toBe(200);
    expect((await agent.get('/api/auth/me')).status).toBe(401);
  });

  it('reports liveness and readiness', async () => {
    expect((await request(ctx.app).get('/api/health/live')).status).toBe(200);
    expect((await request(ctx.app).get('/api/health/ready')).status).toBe(200);
  });
});
