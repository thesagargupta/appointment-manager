import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createApp } from '../src/createApp';
import { Admin } from '../src/models/Admin';
import { Appointment } from '../src/models/Appointment';
import { hashPassword } from '../src/services/authService';

export const ADMIN = { email: 'admin@example.com', password: 'correct-horse-battery' };

export async function startTestApp() {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri('appointments_test');
  await mongoose.connect(uri);
  await Promise.all([Admin.init(), Appointment.init()]);
  const admin = await Admin.create({ email: ADMIN.email, passwordHash: await hashPassword(ADMIN.password) });
  const { app, sessionStore } = createApp({ mongoUrl: uri });
  return {
    app,
    adminId: admin._id,
    async stop() {
      await sessionStore.close();
      await mongoose.disconnect();
      await mongod.stop();
    },
  };
}

/** Returns a supertest agent holding a session, plus the CSRF token to send on writes. */
export async function loginAgent(app: Parameters<typeof request.agent>[0]) {
  const agent = request.agent(app);
  const csrf = await agent.get('/api/auth/csrf');
  const res = await agent
    .post('/api/auth/login')
    .set('x-csrf-token', csrf.body.data.csrfToken)
    .send(ADMIN);
  return { agent, csrf: res.body.data.csrfToken as string, res };
}
