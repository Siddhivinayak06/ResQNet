import dotenv from 'dotenv';

dotenv.config();

/**
 * Centralized environment configuration.
 * All env vars are accessed through this object.
 */
export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5001,
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/resqnet',

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'replace-me-with-a-secure-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  // Cloudinary
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,

  // Client
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
};
