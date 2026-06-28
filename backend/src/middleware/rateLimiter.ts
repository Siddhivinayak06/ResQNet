// ─────────────────────────────────────────────────────────────
// ResQNet — Rate Limiter Middleware
// Redis-backed rate limiting with configurable windows.
// Falls back to in-memory tracking if Redis is unavailable.
// ─────────────────────────────────────────────────────────────

import type { Request, Response, NextFunction } from 'express';
import { cacheGet, cacheSet } from '../config/redis.js';
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';

interface RateLimitConfig {
  windowMs: number;    // Time window in milliseconds
  maxRequests: number; // Max requests per window
  message?: string;    // Custom error message
  keyPrefix?: string;  // Redis key prefix
}

// In-memory fallback for when Redis is unavailable
const memoryStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Create a rate limiter middleware with configurable windows.
 * Uses Redis for distributed rate limiting, falls back to memory.
 */
export function rateLimiter(config?: Partial<RateLimitConfig>) {
  const {
    windowMs = env.RATE_LIMIT_WINDOW_MS,
    maxRequests = env.RATE_LIMIT_MAX,
    message = 'Too many requests. Please try again later.',
    keyPrefix = 'rl',
  } = config || {};

  const windowSeconds = Math.ceil(windowMs / 1000);

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const identifier = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${keyPrefix}:${identifier}`;

    try {
      // Try Redis first
      const current = await cacheGet<{ count: number; resetAt: number }>(key);

      if (current) {
        if (current.count >= maxRequests) {
          const retryAfter = Math.ceil((current.resetAt - Date.now()) / 1000);
          res.set('Retry-After', String(retryAfter));
          res.set('X-RateLimit-Limit', String(maxRequests));
          res.set('X-RateLimit-Remaining', '0');
          res.set('X-RateLimit-Reset', String(current.resetAt));

          res.status(429).json({
            success: false,
            error: message,
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter,
          });
          return;
        }

        current.count++;
        await cacheSet(key, current, windowSeconds);

        res.set('X-RateLimit-Limit', String(maxRequests));
        res.set('X-RateLimit-Remaining', String(maxRequests - current.count));
      } else {
        const data = { count: 1, resetAt: Date.now() + windowMs };
        await cacheSet(key, data, windowSeconds);

        res.set('X-RateLimit-Limit', String(maxRequests));
        res.set('X-RateLimit-Remaining', String(maxRequests - 1));
      }

      next();
    } catch {
      // Fallback to in-memory if Redis fails
      logger.warn('Rate limiter falling back to in-memory store');

      const now = Date.now();
      const entry = memoryStore.get(key);

      if (entry && now < entry.resetAt) {
        if (entry.count >= maxRequests) {
          res.status(429).json({
            success: false,
            error: message,
            code: 'RATE_LIMIT_EXCEEDED',
          });
          return;
        }
        entry.count++;
      } else {
        memoryStore.set(key, { count: 1, resetAt: now + windowMs });
      }

      // Periodic cleanup of expired entries
      if (memoryStore.size > 10000) {
        for (const [k, v] of memoryStore) {
          if (now > v.resetAt) memoryStore.delete(k);
        }
      }

      next();
    }
  };
}

/**
 * Strict rate limiter for sensitive endpoints (login, register).
 */
export const authRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10,           // 10 attempts
  message: 'Too many authentication attempts. Please try again in 15 minutes.',
  keyPrefix: 'rl:auth',
});

/**
 * API rate limiter for general endpoints.
 */
export const apiRateLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60,      // 60 requests per minute
  keyPrefix: 'rl:api',
});
