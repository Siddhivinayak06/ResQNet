import { env } from '../config/env.js';

/**
 * Global error handling middleware
 * Catches all errors passed via next(error) and returns structured JSON responses
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = [];

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    errors = Object.values(err.errors).map((e) => e.message);
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // MongoDB duplicate key error
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue).join(', ');
    message = `Duplicate value for field: ${field}`;
  }

  // JSON parse error
  if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Invalid JSON in request body';
  }

  const response = {
    success: false,
    error: message,
  };

  if (errors.length > 0) {
    response.errors = errors;
  }

  // Include stack trace in development mode
  if (env.nodeEnv === 'development') {
    response.stack = err.stack;
  }

  console.error(`[ERROR] ${statusCode} - ${message}`, err.stack ? `\n${err.stack}` : '');

  res.status(statusCode).json(response);
};

export default errorHandler;
