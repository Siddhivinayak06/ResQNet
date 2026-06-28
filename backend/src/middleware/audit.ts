// ─────────────────────────────────────────────────────────────
// ResQNet — Audit Logging Middleware
// Automatically logs significant API actions to the AuditLog
// collection for compliance and security analysis.
// ─────────────────────────────────────────────────────────────

import type { Request, Response, NextFunction } from 'express';
import { AuditLog } from '../models/index.js';
import type { AuthenticatedRequest } from '../types/index.js';
import { logger } from '../config/logger.js';

/** Routes that should NOT be logged (high-frequency, low-value) */
const EXCLUDED_PATHS = ['/api/health', '/api/v1/health', '/favicon.ico'];
const EXCLUDED_METHODS = ['OPTIONS', 'HEAD'];

/**
 * Audit logging middleware. Captures request/response metadata
 * and stores it in MongoDB asynchronously (non-blocking).
 */
export function auditLogger() {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip excluded paths and methods
    if (
      EXCLUDED_METHODS.includes(req.method) ||
      EXCLUDED_PATHS.some((p) => req.path.startsWith(p))
    ) {
      return next();
    }

    const startTime = Date.now();

    // Hook into response finish event to capture status code
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const user = (req as AuthenticatedRequest).user;

      // Determine the action from method + path
      const action = `${req.method} ${req.route?.path || req.path}`;
      const resource = req.path.split('/').filter(Boolean).slice(1, 3).join('/') || 'unknown';
      const resourceId = req.params?.id || null;

      // Fire-and-forget: don't await, don't block the response
      AuditLog.create({
        userId: user?.id || null,
        userEmail: user?.email || 'anonymous',
        userRole: user?.role || 'unknown',
        action,
        resource,
        resourceId,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
        userAgent: req.get('User-Agent') || '',
        details: {
          // Only log body for mutating operations, never log passwords
          ...((['POST', 'PUT', 'PATCH'].includes(req.method)) && {
            bodyKeys: Object.keys(req.body || {}).filter((k) => !['password', 'token'].includes(k)),
          }),
          queryKeys: Object.keys(req.query || {}),
        },
        duration,
      }).catch((err) => {
        logger.error('Failed to create audit log:', err);
      });
    });

    next();
  };
}
