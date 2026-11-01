import type { RequestHandler } from 'express';
import { HttpError } from '../utils/httpError';

export const requireAuth: RequestHandler = (req, _res, next) => {
  if (!req.session.adminId) return next(new HttpError(401, 'Authentication required', 'UNAUTHENTICATED'));
  next();
};
