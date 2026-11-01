import mongoose from 'mongoose';
import { logger } from './logger';

export async function connectDb(uri: string): Promise<void> {
  mongoose.set('strictQuery', true);
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
  mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnected'));
  mongoose.connection.on('error', (err: Error) => logger.error({ err: err.message }, 'MongoDB error'));
  await mongoose.connect(uri, { maxPoolSize: 10, serverSelectionTimeoutMS: 10_000 });
  logger.info('MongoDB connected');
}

export const disconnectDb = () => mongoose.disconnect();
