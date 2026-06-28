// ─────────────────────────────────────────────────────────────
// ResQNet — Encryption Utility
// AES-256-GCM encryption for sensitive data at rest.
// Used for medical profiles, personal data, etc.
// ─────────────────────────────────────────────────────────────

import crypto from 'crypto';
import { env } from '../config/env.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;       // 128 bits
const TAG_LENGTH = 16;      // 128 bits
const ENCODING = 'hex' as const;

/**
 * Get the encryption key from environment.
 * Key must be exactly 32 bytes (256 bits).
 */
function getKey(): Buffer {
  const key = env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY is not set in environment variables');
  }
  // If key is hex-encoded (64 chars = 32 bytes), convert from hex
  if (key.length === 64) {
    return Buffer.from(key, 'hex');
  }
  // Otherwise use first 32 bytes of the string
  return Buffer.from(key.padEnd(32, '0').slice(0, 32));
}

/**
 * Encrypt a string using AES-256-GCM.
 * Returns a string in format: iv:encrypted:authTag
 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', ENCODING);
  encrypted += cipher.final(ENCODING);

  const authTag = cipher.getAuthTag();

  return `${iv.toString(ENCODING)}:${encrypted}:${authTag.toString(ENCODING)}`;
}

/**
 * Decrypt a string encrypted with AES-256-GCM.
 * Expects input in format: iv:encrypted:authTag
 */
export function decrypt(ciphertext: string): string {
  const key = getKey();
  const parts = ciphertext.split(':');

  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format');
  }

  const [ivHex, encryptedHex, authTagHex] = parts;
  const iv = Buffer.from(ivHex, ENCODING);
  const encrypted = Buffer.from(encryptedHex, ENCODING);
  const authTag = Buffer.from(authTagHex, ENCODING);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString('utf8');
}

/**
 * Hash a value using SHA-256 (one-way, for comparisons).
 */
export function hash(value: string): string {
  return crypto.createHash('sha256').update(value).digest(ENCODING);
}

/**
 * Generate a cryptographically secure random string.
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString(ENCODING);
}
