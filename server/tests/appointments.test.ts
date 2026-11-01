import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Appointment } from '../src/models/Appointment';
import { loginAgent, startTestApp } from './helpers';

let ctx: Awaited<ReturnType<typeof startTestApp>>;
let agent: Awaited<ReturnType<typeof loginAgent>>['agent'];
let csrf: string;

const post = (body: object) => agent.post('/api/appointments').set('x-csrf-token', csrf).send(body);
const valid = { customerName: 'Alex Morgan', service: 'Consultation', date: '2030-01-15', time: '10:00', status: 'Pending' };

beforeAll(async () => {
  ctx = await startTestApp();
  ({ agent, csrf } = await loginAgent(ctx.app));
});
afterAll(() => ctx.stop());
beforeEach(async () => {
  await Appointment.deleteMany({});
});

describe('create', () => {
  it('creates an appointment stored as a UTC instant interpreted in Asia/Kolkata', async () => {
    const res = await post({ ...valid, customerName: '  Alex   Morgan ' });
    expect(res.status).toBe(201);
    expect(res.body.data.customerName).toBe('Alex   Morgan'); // trimmed at the ends
    expect(res.body.data.appointmentAt).toBe('2030-01-15T04:30:00.000Z'); // 10:00 IST
    expect(res.body.data).not.toHaveProperty('_id');
    expect(res.body.data).not.toHaveProperty('customerNameNormalized');
    expect(res.body.data).not.toHaveProperty('createdBy');
    expect(await Appointment.countDocuments()).toBe(1);
  });

  it('defaults status to Pending', async () => {
    const { status: _s, ...noStatus } = valid;
    const res = await post(noStatus);
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('Pending');
  });

  it('rejects missing required fields with field-level errors (422)', async () => {
    const res = await post({});
    expect(res.status).toBe(422);
    const fields = res.body.errors.map((e: { field: string }) => e.field);
    expect(fields).toEqual(expect.arrayContaining(['customerName', 'service', 'date', 'time']));
  });

  it('rejects blank names, invalid status, unknown service, impossible dates and unknown fields', async () => {
    expect((await post({ ...valid, customerName: '   ' })).status).toBe(422);
    expect((await post({ ...valid, status: 'Done' })).status).toBe(422);
    expect((await post({ ...valid, service: 'Surgery' })).status).toBe(422);
    expect((await post({ ...valid, date: '2030-02-30' })).status).toBe(422);
    expect((await post({ ...valid, time: '25:00' })).status).toBe(422);
    expect((await post({ ...valid, isAdmin: true })).status).toBe(422);
    expect(await Appointment.countDocuments()).toBe(0);
  });

  it('returns 409 for a duplicate booking', async () => {
    expect((await post(valid)).status).toBe(201);
    expect((await post(valid)).status).toBe(409);
  });

  it('requires a CSRF token', async () => {
    const res = await agent.post('/api/appointments').send(valid);
    expect(res.status).toBe(403);
  });
});

describe('status update', () => {
  it('updates the status and persists it', async () => {
    const created = await post(valid);
    const id = created.body.data.id;
    const res = await agent.patch(`/api/appointments/${id}/status`).set('x-csrf-token', csrf).send({ status: 'Confirmed' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('Confirmed');
    expect((await Appointment.findById(id))?.status).toBe('Confirmed');
  });

  it('rejects invalid status (422), malformed id (422) and unknown id (404)', async () => {
    const id = (await post(valid)).body.data.id;
    const patch = (path: string, body: object) => agent.patch(`/api/appointments/${path}/status`).set('x-csrf-token', csrf).send(body);
    expect((await patch(id, { status: 'Bogus' })).status).toBe(422);
    expect((await patch('not-an-id', { status: 'Pending' })).status).toBe(422);
    expect((await patch('64b7f0c2a1b2c3d4e5f60718', { status: 'Pending' })).status).toBe(404);
  });
});

describe('list, filter, search, pagination, stats', () => {
  const seed = async () => {
    const rows = [
      { customerName: 'Alex Morgan', date: '2030-03-01', status: 'Pending' },
      { customerName: 'Jamie Lee', date: '2030-03-02', status: 'Confirmed' },
      { customerName: 'Taylor Smith', date: '2030-03-03', status: 'Cancelled' },
      { customerName: 'Alexandra Stone', date: '2030-03-04', status: 'Confirmed' },
      { customerName: 'Old Timer', date: '2020-01-01', status: 'Confirmed' },
    ];
    for (const r of rows) await post({ ...valid, ...r });
  };

  it('requires nothing but returns upcoming first (soonest), then past (latest first)', async () => {
    await seed();
    const res = await agent.get('/api/appointments');
    expect(res.status).toBe(200);
    expect(res.body.data.map((a: { customerName: string }) => a.customerName)).toEqual([
      'Alex Morgan',
      'Jamie Lee',
      'Taylor Smith',
      'Alexandra Stone',
      'Old Timer',
    ]);
    expect(res.body.pagination).toEqual({ page: 1, limit: 10, total: 5, totalPages: 1 });
  });

  it('filters by status, with All meaning no filter', async () => {
    await seed();
    const confirmed = await agent.get('/api/appointments?status=Confirmed');
    expect(confirmed.body.pagination.total).toBe(3);
    expect(confirmed.body.data.every((a: { status: string }) => a.status === 'Confirmed')).toBe(true);
    expect((await agent.get('/api/appointments?status=All')).body.pagination.total).toBe(5);
    expect((await agent.get('/api/appointments?status=Nope')).status).toBe(422);
  });

  it('searches case-insensitively with partial matching, combined with status', async () => {
    await seed();
    const partial = await agent.get('/api/appointments?search=ALEX');
    expect(partial.body.data.map((a: { customerName: string }) => a.customerName).sort()).toEqual(['Alex Morgan', 'Alexandra Stone']);
    const combined = await agent.get('/api/appointments?search=alex&status=Confirmed');
    expect(combined.body.data.map((a: { customerName: string }) => a.customerName)).toEqual(['Alexandra Stone']);
  });

  it('treats regex metacharacters in search as literal text and rejects operator objects', async () => {
    await seed();
    expect((await agent.get('/api/appointments?search=.*')).body.pagination.total).toBe(0);
    expect((await agent.get('/api/appointments?search[$ne]=x')).status).toBe(422);
    expect((await agent.get(`/api/appointments?search=${'a'.repeat(101)}`)).status).toBe(422);
  });

  it('paginates across the upcoming/past boundary without gaps or duplicates', async () => {
    await seed();
    const names: string[] = [];
    for (const page of [1, 2, 3]) {
      const res = await agent.get(`/api/appointments?limit=2&page=${page}`);
      expect(res.body.pagination).toEqual({ page, limit: 2, total: 5, totalPages: 3 });
      names.push(...res.body.data.map((a: { customerName: string }) => a.customerName));
    }
    expect(names).toEqual(['Alex Morgan', 'Jamie Lee', 'Taylor Smith', 'Alexandra Stone', 'Old Timer']);
    expect((await agent.get('/api/appointments?limit=2&page=4')).body.data).toEqual([]);
    expect((await agent.get('/api/appointments?limit=1000')).status).toBe(422);
  });

  it('calculates dashboard stats from the database', async () => {
    await seed();
    const res = await agent.get('/api/dashboard/stats');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ total: 5, pending: 1, confirmed: 3, cancelled: 1 });
  });

  it('serves the configurable service list', async () => {
    const res = await agent.get('/api/appointments/services');
    expect(res.body.data).toEqual(['Consultation', 'Follow-up', 'Review']);
  });
});
