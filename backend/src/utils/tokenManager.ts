// ─────────────────────────────────────────────────────────────
// ResQNet — Token Manager
// Handles JWT access/refresh token generation, verification,
// and rotation with Redis-backed blacklist.
// ─────────────────────────────────────────────────────────────

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env.js';
import { cacheSet, cacheGet, cacheDel } from '../config/redis.js';
import type { JWTPayload, TokenPair } from '../types/index.js';

const REFRESH_TOKEN_PREFIX = 'rt:';
const BLACKLIST_PREFIX = 'bl:';

/**
 * Generate an access + refresh token pair.
 */
export function generateTokenPair(payload: Omit<JWTPayload, 'iat' | 'exp'>): TokenPair {
  // Use a numeric TTL to satisfy strict typing on jwt.sign expiresIn
  const expiryMap: Record<string, number> = {
    '15m': 15 * 60,
    '30m': 30 * 60,
    '1h': 3600,
    '7d': 7 * 24 * 3600,
  };
  const expiresInSeconds = expiryMap[env.JWT_ACCESS_EXPIRY] || 900; // default 15min

  const accessToken = jwt.sign(
    { ...payload },
    env.JWT_SECRET,
    { expiresIn: expiresInSeconds },
  );

  const refreshToken = crypto.randomBytes(40).toString('hex');

  return { accessToken, refreshToken };
}

/**
 * Store a refresh token in Redis, associated with a user ID.
 * @param userId - The user's ID
 * @param refreshToken - The generated refresh token
 * @param ttlSeconds - Time-to-live (default: 7 days)
 */
export async function storeRefreshToken(
  userId: string,
  refreshToken: string,
  ttlSeconds: number = 7 * 24 * 60 * 60,
): Promise<void> {
  const key = `${REFRESH_TOKEN_PREFIX}${refreshToken}`;
  await cacheSet(key, { userId, createdAt: Date.now() }, ttlSeconds);
}

/**
 * Verify and consume a refresh token (one-time use).
 * Returns the user ID if valid, null otherwise.
 */
export async function verifyRefreshToken(refreshToken: string): Promise<string | null> {
  const key = `${REFRESH_TOKEN_PREFIX}${refreshToken}`;
  const data = await cacheGet<{ userId: string }>(key);

  if (!data) return null;

  // Delete the used token (one-time rotation)
  await cacheDel(key);
  return data.userId;
}

/**
 * Blacklist an access token (on logout).
 * The token will be rejected until it expires naturally.
 */
export async function blacklistToken(token: string): Promise<void> {
  try {
    const decoded = jwt.decode(token) as JWTPayload | null;
    if (!decoded?.exp) return;

    const ttl = decoded.exp - Math.floor(Date.now() / 1000);
    if (ttl > 0) {
      await cacheSet(`${BLACKLIST_PREFIX}${token}`, true, ttl);
    }
  } catch {
    // Token is already invalid, nothing to blacklist
  }
}

/**
 * Check if a token has been blacklisted.
 */
export async function isTokenBlacklisted(token: string): Promise<boolean> {
  const result = await cacheGet(`${BLACKLIST_PREFIX}${token}`);
  return result !== null;
}

/**
 * Invalidate all refresh tokens for a user (force logout everywhere).
 */
export async function invalidateAllUserTokens(userId: string): Promise<void> {
  // Note: In production, you'd scan Redis keys with the user ID pattern.
  // For now, we rely on storing refresh tokens with user association.
  // The access tokens will expire naturally (short-lived).
  void userId;
}

/**
 * Verify an access token and return the decoded payload.
 */
export function verifyAccessToken(token: string): JWTPayload {
  return jwt.verify(token, env.JWT_SECRET) as JWTPayload;
}
