import { Router } from 'express';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env';
import * as auth from '../controllers/authController';
import * as appointments from '../controllers/appointmentController';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler as h } from '../utils/asyncHandler';
import {
  createAppointmentSchema,
  idParamSchema,
  listQuerySchema,
  loginSchema,
  updateStatusSchema,
} from '../validators/schemas';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.LOGIN_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Please try again later.', errors: [] },
});

export const authRouter = Router();
authRouter.get('/csrf', h(auth.csrf));
authRouter.post('/login', loginLimiter, validate(loginSchema), h(auth.login));
authRouter.post('/logout', h(auth.logout));
authRouter.get('/me', requireAuth, h(auth.me));

export const appointmentRouter = Router();
appointmentRouter.use(requireAuth);
appointmentRouter.get('/', validate(listQuerySchema, 'query'), h(appointments.list));
appointmentRouter.get('/services', h(appointments.services));
appointmentRouter.post('/', validate(createAppointmentSchema), h(appointments.create));
appointmentRouter.patch(
  '/:id/status',
  validate(idParamSchema, 'params'),
  validate(updateStatusSchema),
  h(appointments.updateStatus),
);

export const dashboardRouter = Router();
dashboardRouter.get('/stats', requireAuth, h(appointments.stats));

export const healthRouter = Router();
healthRouter.get('/live', (_req, res) => {
  res.json({ success: true, message: 'Alive', data: { status: 'ok' } });
});
healthRouter.get('/ready', (_req, res) => {
  const ready = mongoose.connection.readyState === 1;
  res.status(ready ? 200 : 503).json({
    success: ready,
    message: ready ? 'Ready' : 'Database not connected',
    data: { status: ready ? 'ok' : 'unavailable' },
  });
});
