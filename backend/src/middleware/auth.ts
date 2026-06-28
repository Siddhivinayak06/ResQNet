// ─────────────────────────────────────────────────────────────
// ResQNet — Authentication Middleware
// Verifies JWT access tokens, handles refresh token rotation,
// and attaches decoded user payload to the request.
// ─────────────────────────────────────────────────────────────

import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import type { JWTPayload, AuthenticatedRequest } from '../types/index.js';

/**
 * Protect routes — verifies the JWT from the Authorization header.
 * On success, attaches `req.user` with { id, email, role }.
 */
export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    let token: string | undefined;

    // Extract token from "Bearer <token>" header
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.',
        code: 'AUTH_NO_TOKEN',
      });
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;

    // Verify user still exists and is active
    const user = await User.findById(decoded.id).select('_id email role isActive');

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'User associated with this token no longer exists.',
        code: 'AUTH_USER_NOT_FOUND',
      });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        error: 'Account has been deactivated.',
        code: 'AUTH_ACCOUNT_DISABLED',
      });
      return;
    }

    // Check account lock
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      res.status(423).json({
        success: false,
        error: 'Account is temporarily locked due to too many failed login attempts.',
        code: 'AUTH_ACCOUNT_LOCKED',
      });
      return;
    }

    // Attach user info to request
    (req as AuthenticatedRequest).user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: 'Invalid token.',
        code: 'AUTH_INVALID_TOKEN',
      });
      return;
    }

    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: 'Token has expired. Please refresh your session.',
        code: 'AUTH_TOKEN_EXPIRED',
      });
      return;
    }

    logger.error('Authentication middleware error:', error);
    next(error);
  }
};

/**
 * Optional auth — same as protect but doesn't fail if no token.
 * Populates req.user if a valid token is present, otherwise proceeds.
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;
    const user = await User.findById(decoded.id).select('_id email role isActive');

    if (user?.isActive) {
      (req as AuthenticatedRequest).user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      };
    }
  } catch {
    // Silently ignore auth errors in optional mode
  }

  next();
};

/**
 * Authorize roles — strictly checks if req.user.role is in the allowed array.
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userRole = (req as AuthenticatedRequest).user?.role;
    if (!userRole || !roles.includes(userRole)) {
      res.status(403).json({
        success: false,
        error: `User role '${userRole || 'unknown'}' is not authorized to access this route.`,
        code: 'AUTH_FORBIDDEN_ROLE',
      });
      return;
    }
    next();
  };
};
