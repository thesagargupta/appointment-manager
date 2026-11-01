import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { HttpError } from '../utils/httpError';

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.path}`, errors: [] });
};

interface KnownError extends Error {
  status?: number;
  type?: string;
  code?: number | string;
  name: string;
}

export const errorHandler: ErrorRequestHandler = (err: KnownError, req, res, _next) => {
  const send = (status: number, message: string, errors: unknown[] = [], code?: string) =>
    res.status(status).json({ success: false, message, errors, ...(code && { code }) });

  if (err instanceof ZodError) {
    return send(
      422,
      'Validation failed',
      err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    );
  }
  if (err instanceof HttpError) return send(err.status, err.message, [], err.code);
  if (err.type === 'entity.too.large') return send(413, 'Request body too large');
  if (err.type === 'entity.parse.failed') return send(400, 'Malformed JSON body');
  if (err.name === 'CastError') return send(400, 'Invalid identifier');
  if (err.code === 11000) return send(409, 'This appointment already exists for that customer, service and time');
  if (err.name === 'MongooseServerSelectionError' || err.name === 'MongoNetworkError') {
    logger.error({ err: err.message }, 'Database unavailable');
    return send(503, 'Database temporarily unavailable');
  }

  logger.error({ err: { name: err.name, message: err.message, stack: err.stack }, url: req.originalUrl }, 'Unhandled error');
  return send(500, env.isProduction ? 'Internal server error' : err.message || 'Internal server error');
};
