import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDatabase() {
  mongoose.set('strictQuery', true);

  await mongoose.connect(env.mongodbUri, {
    autoIndex: true,
  });

  console.log(`[backend] MongoDB connected: ${mongoose.connection.host}`);
}
