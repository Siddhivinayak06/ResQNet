// ─────────────────────────────────────────────────────────────
// ResQNet — Centralized Error Handler
// Catches all errors and returns consistent API responses.
// Handles Mongoose, Zod, JWT, and custom errors.
// ─────────────────────────────────────────────────────────────

import type { Request, Response, NextFunction } from 'express';
import { Error as MongooseError } from 'mongoose';
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';

/** Custom application error with HTTP status code and error code */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Global error handler middleware.
 * Must be the LAST middleware registered on the Express app.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // ─── Custom AppError ──────────────────────────────────
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
    });
    return;
  }

  // ─── Mongoose Validation Error ────────────────────────
  if (err instanceof MongooseError.ValidationError) {
    const messages = Object.values(err.errors).map((e) => e.message);
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      code: 'MONGOOSE_VALIDATION',
      details: messages,
    });
    return;
  }

  // ─── Mongoose Cast Error (invalid ObjectId, etc.) ─────
  if (err instanceof MongooseError.CastError) {
    res.status(400).json({
      success: false,
      error: `Invalid ${err.path}: ${err.value}`,
      code: 'MONGOOSE_CAST_ERROR',
    });
    return;
  }

  // ─── MongoDB Duplicate Key Error ──────────────────────
  if (err.name === 'MongoServerError' && (err as unknown as Record<string, unknown>).code === 11000) {
    const keyValue = (err as unknown as Record<string, unknown>).keyValue as Record<string, unknown> | undefined;
    const field = Object.keys(keyValue || {})[0] || 'field';
    res.status(409).json({
      success: false,
      error: `A record with this ${field} already exists.`,
      code: 'DUPLICATE_KEY',
    });
    return;
  }

  // ─── JSON Parse Error ─────────────────────────────────
  if (err.name === 'SyntaxError' && 'body' in err) {
    res.status(400).json({
      success: false,
      error: 'Invalid JSON in request body.',
      code: 'INVALID_JSON',
    });
    return;
  }

  // ─── Unhandled errors ─────────────────────────────────
  logger.error('Unhandled error:', {
    name: err.name,
    message: err.message,
    stack: err.stack,
  });

  res.status(500).json({
    success: false,
    error: env.NODE_ENV === 'production'
      ? 'An unexpected error occurred. Please try again later.'
      : err.message,
    code: 'INTERNAL_ERROR',
    ...(env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}
