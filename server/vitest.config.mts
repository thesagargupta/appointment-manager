import { defineConfig } from 'vitest/config';

// Test env is set explicitly so a developer's real .env (Atlas URI) is never used by tests.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 30000,
    hookTimeout: 120000,
    env: {
      NODE_ENV: 'test',
      MONGODB_URI: 'mongodb://127.0.0.1:1/never-connected',
      CLIENT_ORIGIN: 'http://localhost:5173',
      SESSION_SECRET: 'test-session-secret-test-session-secret',
      APP_TIMEZONE: 'Asia/Kolkata',
      LOGIN_RATE_LIMIT_MAX: '1000',
    },
  },
});
