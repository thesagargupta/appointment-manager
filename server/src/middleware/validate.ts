import type { RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';

/** Parses and replaces req[source] with the validated value; ZodError is turned into a 422 by the error handler. */
export const validate =
  (schema: ZodTypeAny, source: 'body' | 'query' | 'params' = 'body'): RequestHandler =>
  (req, _res, next) => {
    try {
      req[source] = schema.parse(req[source]);
      next();
    } catch (err) {
      next(err);
    }
  };
