import crypto from 'node:crypto';
import type { RequestHandler } from 'express';
import { HttpError } from '../utils/httpError';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/** Synchronizer-token CSRF protection: the token lives in the server session and must be echoed in X-CSRF-Token. */
export const csrfProtection: RequestHandler = (req, _res, next) => {
  if (SAFE_METHODS.has(req.method)) return next();
  const expected = req.session.csrfToken;
  const received = req.get('x-csrf-token');
  const valid =
    !!expected &&
    !!received &&
    received.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected));
  if (!valid) return next(new HttpError(403, 'Invalid or missing CSRF token', 'CSRF_INVALID'));
  next();
};

export const newCsrfToken = () => crypto.randomBytes(32).toString('hex');
