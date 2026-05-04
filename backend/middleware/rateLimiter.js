/**
 * In-memory rate limiter middleware.
 * Limits the number of requests per IP within a sliding time window.
 *
 * @param {Object} options
 * @param {number} options.windowMs  - Time window in milliseconds (default: 60000 = 1 min)
 * @param {number} options.maxHits   - Max requests allowed per window (default: 10)
 * @param {string} options.message   - Error message when rate limited
 */
const rateLimiter = ({
  windowMs = 60 * 1000,
  maxHits = 10,
  message = 'Too many requests. Please try again later.',
} = {}) => {
  const hits = new Map(); // IP -> { count, resetTime }

  // Periodically purge expired entries to prevent memory leaks
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of hits) {
      if (now > record.resetTime) {
        hits.delete(ip);
      }
    }
  }, windowMs);

  // Allow garbage collection if the process exits
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    const record = hits.get(ip);

    if (!record || now > record.resetTime) {
      // First request or window expired — start a new window
      hits.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }

    record.count += 1;

    if (record.count > maxHits) {
      const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);

      res.set('Retry-After', String(retryAfterSec));
      return res.status(429).json({
        success: false,
        error: message,
        retryAfterSeconds: retryAfterSec,
      });
    }

    next();
  };
};

export default rateLimiter;
