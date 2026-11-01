import pino from 'pino';
import { env } from './env';

export const logger = pino({
  level: env.logLevel,
  redact: {
    paths: [
      'req.headers.cookie',
      'req.headers.authorization',
      'req.headers["x-csrf-token"]',
      'res.headers["set-cookie"]',
      'password',
      '*.password',
    ],
    censor: '[redacted]',
  },
});
