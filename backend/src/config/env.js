import dotenv from 'dotenv';

dotenv.config();

const defaultMongoUri = 'mongodb://127.0.0.1:27017/resqnet';

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  mongodbUri: process.env.MONGODB_URI || defaultMongoUri,
  jwtSecret: process.env.JWT_SECRET || 'replace-me-with-a-secure-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  seedDemoData: process.env.SEED_DEMO_DATA !== 'false',
};

export function getAllowedOrigins() {
  return env.clientUrl
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}
