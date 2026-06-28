// ─────────────────────────────────────────────────────────────
// ResQNet — Redis Connection Manager
// Provides Redis client for caching, session storage,
// rate limiting, and Socket.io adapter.
// ─────────────────────────────────────────────────────────────

import { createClient, type RedisClientType } from 'redis';
import { env } from './env.js';
import { logger } from './logger.js';

let redisClient: RedisClientType | null = null;
let isRedisDisabled = false;

/**
 * Get or create a Redis client singleton.
 * Connects lazily on first access with error handling.
 * If Redis is unavailable, it disables caching to prevent crashes.
 */
export async function getRedisClient(): Promise<RedisClientType | null> {
  if (isRedisDisabled) return null;
  if (redisClient?.isOpen) return redisClient;

  if (!redisClient) {
    redisClient = createClient({
      url: env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries: number) => {
          if (retries > 2) {
            logger.warn('🔴 Redis unavailable — disabling cache for this session');
            isRedisDisabled = true;
            return new Error('Redis unavailable');
          }
          return 500;
        },
      },
    });

    redisClient.on('connect', () => logger.info('🔴 Redis connected'));
    redisClient.on('error', (err) => {
        // Suppress repeated connection errors if we've already disabled it
        if (!isRedisDisabled) logger.error('🔴 Redis error:', err.message);
    });
  }

  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
    return redisClient;
  } catch (err) {
    isRedisDisabled = true;
    return null;
  }
}

/**
 * Gracefully disconnect Redis.
 */
export async function disconnectRedis(): Promise<void> {
  if (redisClient?.isOpen) {
    await redisClient.quit();
    logger.info('🔴 Redis disconnected gracefully');
  }
}

// ─── Cache Helper Utilities ──────────────────────────────────

/**
 * Get a cached value by key. Returns null if not found or expired.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = await getRedisClient();
  if (!client) return null;
  
  try {
    const value = await client.get(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

/**
 * Set a cache value with optional TTL in seconds.
 */
export async function cacheSet(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
  const client = await getRedisClient();
  if (!client) return;

  try {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    if (ttlSeconds) {
      await client.setEx(key, ttlSeconds, serialized);
    } else {
      await client.set(key, serialized);
    }
  } catch (err) {
    logger.warn('🔴 Failed to set cache:', err);
  }
}

/**
 * Delete a cached value by key.
 */
export async function cacheDel(key: string): Promise<void> {
  const client = await getRedisClient();
  if (!client) return;
  try {
    await client.del(key);
  } catch (err) {
    logger.warn('🔴 Failed to delete cache:', err);
  }
}

/**
 * Delete all cache keys matching a pattern (e.g., "incidents:*").
 */
export async function cacheInvalidatePattern(pattern: string): Promise<void> {
  const client = await getRedisClient();
  if (!client) return;
  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
    }
  } catch (err) {
    logger.warn('🔴 Failed to invalidate cache pattern:', err);
  }
}
