import path from 'node:path';
import dotenv from 'dotenv';
import { DateTime } from 'luxon';
import { z } from 'zod';

// .env lives at the repository root (works from both src/ and dist/). Existing env vars win.
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  MONGODB_URI: z.string().regex(/^mongodb(\+srv)?:\/\/.+/, 'must start with mongodb:// or mongodb+srv://'),
  CLIENT_ORIGIN: z.string().url('must be a full origin such as https://app.example.com'),
  SESSION_SECRET: z.string().min(32, 'must be at least 32 characters'),
  APP_TIMEZONE: z
    .string()
    .default('Asia/Kolkata')
    .refine((zone) => DateTime.local().setZone(zone).isValid, 'must be a valid IANA timezone'),
  TRUST_PROXY: z.coerce.number().int().min(0).optional(),
  LOGIN_RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(10),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).optional(),
  ADMIN_EMAIL: z.string().optional(),
  ADMIN_PASSWORD: z.string().optional(),
});

function loadEnv() {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    // Only variable names and reasons are printed, never values.
    const lines = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`);
    console.error(`Invalid environment configuration:\n${lines.join('\n')}\nSee .env.example.`);
    process.exit(1);
  }
  const e = parsed.data;
  if (e.NODE_ENV === 'production' && /change-me|placeholder/i.test(e.SESSION_SECRET)) {
    console.error('Invalid environment configuration:\n  - SESSION_SECRET: placeholder value not allowed in production');
    process.exit(1);
  }
  return {
    ...e,
    isProduction: e.NODE_ENV === 'production',
    trustProxy: e.TRUST_PROXY ?? (e.NODE_ENV === 'production' ? 1 : 0),
    logLevel: e.LOG_LEVEL ?? (e.NODE_ENV === 'test' ? 'silent' : 'info'),
  };
}

export const env = loadEnv();
