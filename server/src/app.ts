import fs from 'node:fs';
import path from 'node:path';
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import helmet from 'helmet';
import MongoStore from 'connect-mongo';
import pinoHttp from 'pino-http';
import { env } from './config/env';
import { logger } from './config/logger';
import { csrfProtection } from './middleware/csrf';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { SESSION_COOKIE } from './controllers/authController';
import { appointmentRouter, authRouter, dashboardRouter, healthRouter } from './routes';

const CLIENT_DIST = path.resolve(__dirname, '../../client/dist');
const SESSION_TTL_SECONDS = 8 * 60 * 60;

/** mongoUrl is passed explicitly so tests can point the session store at an in-memory database. */
export function createApp({ mongoUrl }: { mongoUrl: string }) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', env.trustProxy);

  const sessionStore = MongoStore.create({ mongoUrl, ttl: SESSION_TTL_SECONDS, touchAfter: 5 * 60 });

  app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url?.startsWith('/api/health') ?? false } }));
  app.use(helmet());
  app.use(compression());
  app.use(cors({ origin: [env.CLIENT_ORIGIN], credentials: true }));
  app.use(express.json({ limit: '10kb' }));

  app.use('/api/health', healthRouter);

  app.use(
    '/api',
    rateLimit({
      windowMs: 60 * 1000,
      limit: 300,
      standardHeaders: true,
      legacyHeaders: false,
      message: { success: false, message: 'Too many requests. Please slow down.', errors: [] },
    }),
    session({
      name: SESSION_COOKIE,
      secret: env.SESSION_SECRET,
      store: sessionStore,
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: {
        httpOnly: true,
        secure: env.isProduction,
        sameSite: 'lax',
        maxAge: SESSION_TTL_SECONDS * 1000,
      },
    }),
    csrfProtection,
  );
  app.use('/api/auth', authRouter);
  app.use('/api/appointments', appointmentRouter);
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api', notFoundHandler);

  // Serve the built SPA (same origin as the API) when it exists.
  if (fs.existsSync(path.join(CLIENT_DIST, 'index.html'))) {
    app.use(express.static(CLIENT_DIST, { index: false, maxAge: '1h' }));
    app.get(/^\/(?!api\/).*/, (_req, res) => {
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(path.join(CLIENT_DIST, 'index.html'));
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);
  return { app, sessionStore };
}
