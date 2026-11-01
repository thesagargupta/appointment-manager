import { createApp } from './createApp';
import { connectDb, disconnectDb } from './config/db';
import { env } from './config/env';
import { logger } from './config/logger';
import { Admin } from './models/Admin';
import { Appointment } from './models/Appointment';

async function main() {
  await connectDb(env.MONGODB_URI);
  await Promise.all([Admin.init(), Appointment.init()]); // make sure indexes exist
  const { app, sessionStore } = createApp({ mongoUrl: env.MONGODB_URI });
  const server = app.listen(env.PORT, () => logger.info({ port: env.PORT, env: env.NODE_ENV }, 'Server listening'));

  let shuttingDown = false;
  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, 'Shutting down');
    const force = setTimeout(() => process.exit(1), 10_000);
    force.unref();
    server.close(async () => {
      await sessionStore.close();
      await disconnectDb();
      process.exit(0);
    });
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

main().catch((err: Error) => {
  logger.fatal({ err: err.message }, 'Failed to start server');
  process.exit(1);
});
