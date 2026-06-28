// ─────────────────────────────────────────────────────────────
// ResQNet — Environment Configuration
// Validates and exports all environment variables using Zod.
// Fails fast on startup if any required config is missing.
// ─────────────────────────────────────────────────────────────

import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  // ─── Server ──────────────────────────────────────────────
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5001),

  // ─── Database ────────────────────────────────────────────
  MONGODB_URI: z.string().url('MONGODB_URI must be a valid URL'),

  // ─── Redis ───────────────────────────────────────────────
  REDIS_URL: z.string().default('redis://127.0.0.1:6379'),

  // ─── Authentication ──────────────────────────────────────
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),

  // ─── CORS ────────────────────────────────────────────────
  CLIENT_URL: z.string().default('http://localhost:3000'),

  // ─── Cloudinary (image uploads) ──────────────────────────
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // ─── AI Providers ────────────────────────────────────────
  OPENAI_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  AI_DEFAULT_PROVIDER: z.enum(['openai', 'gemini', 'local']).default('openai'),

  // ─── Notifications ──────────────────────────────────────
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),

  // ─── External APIs ──────────────────────────────────────
  MAPBOX_ACCESS_TOKEN: z.string().optional(),
  GOOGLE_MAPS_API_KEY: z.string().optional(),

  // ─── Rate Limiting ──────────────────────────────────────
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000), // 15 min
  RATE_LIMIT_MAX: z.coerce.number().default(100),

  // ─── Encryption ─────────────────────────────────────────
  ENCRYPTION_KEY: z.string().min(32).optional(),
});

// Parse and validate — throws on failure with detailed error messages
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  const formatted = parsed.error.format();
  for (const [key, value] of Object.entries(formatted)) {
    if (key === '_errors') continue;
    const errors = (value as { _errors?: string[] })._errors;
    if (errors?.length) {
      console.error(`  ${key}: ${errors.join(', ')}`);
    }
  }
  process.exit(1);
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
