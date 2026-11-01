import express from 'express';
import { createApp } from './createApp';
import { connectDb } from './config/db';
import { env } from './config/env';
import { Admin } from './models/Admin';
import { Appointment } from './models/Appointment';

// Vercel entrypoint: a serverless function exports the app instead of listening on a port.
// The database connection is opened once per instance and reused; a failed attempt is retried on the next request.
let ready: Promise<unknown> | undefined;
const connect = () =>
  (ready ??= connectDb(env.MONGODB_URI)
    .then(() => Promise.all([Admin.init(), Appointment.init()]))
    .catch((err) => {
      ready = undefined;
      throw err;
    }));

const handler = express();
handler.use((_req, _res, next) => void connect().then(() => next(), next));
handler.use(createApp({ mongoUrl: env.MONGODB_URI }).app);

export default handler;
