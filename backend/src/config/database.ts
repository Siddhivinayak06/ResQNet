// ─────────────────────────────────────────────────────────────
// ResQNet — MongoDB Connection Manager
// Connects to MongoDB with retry logic and event logging.
// ─────────────────────────────────────────────────────────────

import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

/**
 * Connect to MongoDB with exponential backoff retry logic.
 * Logs connection events and handles graceful disconnection.
 */
export async function connectDatabase(): Promise<typeof mongoose> {
  let retries = 0;

  // ─── Connection event listeners ────────────────────────
  mongoose.connection.on('connected', () => {
    logger.info('📦 MongoDB connected successfully');
  });

  mongoose.connection.on('error', (err) => {
    logger.error('📦 MongoDB connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('📦 MongoDB disconnected');
  });

  // ─── Connection attempt with retries ───────────────────
  while (retries < MAX_RETRIES) {
    try {
      const connection = await mongoose.connect(env.MONGODB_URI, {
        // Performance: limit server selection to 5s
        serverSelectionTimeoutMS: 5000,
        // Automatically create indexes defined in schemas
        autoIndex: env.NODE_ENV !== 'production',
      });

      logger.info(`📦 MongoDB connected to: ${connection.connection.host}`);
      return connection;
    } catch (error) {
      retries++;
      const delay = RETRY_DELAY_MS * retries;
      logger.error(
        `📦 MongoDB connection attempt ${retries}/${MAX_RETRIES} failed. Retrying in ${delay}ms...`,
        error instanceof Error ? error.message : error,
      );

      if (retries >= MAX_RETRIES) {
        logger.error('📦 MongoDB connection failed after all retries. Exiting.');
        process.exit(1);
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // TypeScript requires a return — this line is unreachable
  throw new Error('MongoDB connection failed');
}

/**
 * Gracefully close the MongoDB connection.
 */
export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  logger.info('📦 MongoDB disconnected gracefully');
}
