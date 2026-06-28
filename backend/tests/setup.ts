import mongoose from 'mongoose';
import { env } from '../src/config/env.js';

beforeAll(async () => {
  // Connect to a test database if available, or default
  const uri = process.env.TEST_MONGODB_URI || env.MONGODB_URI;
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.connection.close();
});
