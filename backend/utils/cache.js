/**
 * Simple in-memory cache with TTL expiry.
 * Used to cache Overpass API responses and reduce external API calls.
 */
class MemoryCache {
  constructor() {
    this.store = new Map();

    // Periodic cleanup every 60 seconds
    this._cleanupInterval = setInterval(() => this._purgeExpired(), 60 * 1000);
    if (this._cleanupInterval.unref) {
      this._cleanupInterval.unref();
    }
  }

  /**
   * Get a cached value by key.
   * @param {string} key
   * @returns {*|null} Cached value or null if expired/missing
   */
  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Set a value in the cache.
   * @param {string} key
   * @param {*} value
   * @param {number} ttlMs - Time to live in milliseconds
   */
  set(key, value, ttlMs) {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  /**
   * Generate a cache key from coordinates and radius.
   * Rounds coordinates to 3 decimal places (~111m precision)
   * so nearby requests share the same cache entry.
   */
  static locationKey(lat, lon, radius) {
    const roundedLat = Number(lat).toFixed(3);
    const roundedLon = Number(lon).toFixed(3);
    return `nearby:${roundedLat}:${roundedLon}:${radius}`;
  }

  _purgeExpired() {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }
}

// Singleton instance
const cache = new MemoryCache();

export default cache;
