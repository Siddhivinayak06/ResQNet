// ─────────────────────────────────────────────────────────────
// ResQNet — Structured Logger (Winston)
// Provides consistent, structured logging across the backend.
// Logs to console in development, JSON files in production.
// ─────────────────────────────────────────────────────────────

import winston from 'winston';

const { combine, timestamp, colorize, printf, json, errors } = winston.format;

/** Human-readable format for development console output */
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ timestamp: ts, level, message, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${ts} [${level}]: ${stack || message}${metaStr}`;
  }),
);

/** Structured JSON format for production log aggregation */
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json(),
);

const isProduction = process.env.NODE_ENV === 'production';

export const logger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  format: isProduction ? prodFormat : devFormat,
  defaultMeta: { service: 'resqnet-api' },
  transports: [
    new winston.transports.Console(),

    // Production-only: write error logs to a file
    ...(isProduction
      ? [
          new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            maxsize: 5 * 1024 * 1024, // 5MB
            maxFiles: 5,
          }),
          new winston.transports.File({
            filename: 'logs/combined.log',
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 5,
          }),
        ]
      : []),
  ],

  // Don't crash the app on unhandled rejections
  exceptionHandlers: [
    new winston.transports.Console(),
  ],
  rejectionHandlers: [
    new winston.transports.Console(),
  ],
});
