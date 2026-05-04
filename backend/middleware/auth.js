import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { env } from '../config/env.js';

/**
 * Authentication middleware
 * Verifies the JWT token from the Authorization header
 * and attaches the decoded user to req.user
 */
export const protect = async (req, res, next) => {
  try {
    let token;

    // Extract token from "Bearer <token>" header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, env.jwtSecret);

    // Check if user still exists in database
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'The user associated with this token no longer exists.',
      });
    }

    // Attach user info to request object
    req.user = {
      id: decoded.id,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token.',
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token has expired. Please login again.',
      });
    }

    next(error);
  }
};

/**
 * Role-based authorization middleware
 * Must be used AFTER the protect middleware
 * @param  {...string} roles - Allowed roles (e.g., 'admin', 'volunteer')
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Role '${req.user.role}' is not authorized for this resource.`,
      });
    }

    next();
  };
};
