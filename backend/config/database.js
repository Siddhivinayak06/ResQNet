import mongoose from 'mongoose';
import { env } from './env.js';

/**
 * Connect to MongoDB using the URI from environment variables.
 * Exits the process on failure.
 */
export async function connectDatabase() {
  try {
    mongoose.set('strictQuery', true);
    const conn = await mongoose.connect(env.mongodbUri);
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
}
