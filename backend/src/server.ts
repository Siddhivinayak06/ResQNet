// ─────────────────────────────────────────────────────────────
// ResQNet — Server Entry Point (TypeScript)
// Sets up Express with all middleware, routes, Socket.io,
// and graceful shutdown handling.
// ─────────────────────────────────────────────────────────────

import http from 'http';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { getRedisClient, disconnectRedis } from './config/redis.js';
import { logger } from './config/logger.js';
import { initializeSocket, getOnlineUsersCount } from './socket/server.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import { auditLogger } from './middleware/audit.js';
import v1Routes from './routes/index.js';

const app = express();
const server = http.createServer(app);

// ─── Parse allowed CORS origins ─────────────────────────────
const allowedOrigins = env.CLIENT_URL
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// ─── Security Middleware ─────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // Disable for API server
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// ─── Body Parsing ────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(compression());

// ─── Rate Limiting & Audit ───────────────────────────────────
app.use(apiRateLimiter);
app.use(auditLogger());

// ─── Health Check ────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    service: 'ResQNet API v2',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    connectedUsers: getOnlineUsersCount(),
    environment: env.NODE_ENV,
  });
});

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    service: 'ResQNet API v2',
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ──────────────────────────────────────────────
app.use('/api/v1', v1Routes);

// Backward compatibility: also mount under /api for existing clients
app.use('/api', v1Routes);

// ─── 404 Handler ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.originalUrl} not found`,
    code: 'ROUTE_NOT_FOUND',
  });
});

// ─── Global Error Handler (must be last) ─────────────────────
app.use(errorHandler);

// ─── Startup ─────────────────────────────────────────────────
async function startServer(): Promise<void> {
  try {
    // Connect to databases
    await connectDatabase();
    logger.info('✅ MongoDB connected');

    // Connect to Redis (non-blocking — app works without it)
    try {
      await getRedisClient();
      logger.info('✅ Redis connected');
    } catch (err) {
      logger.warn('⚠️ Redis not available — running without cache', err);
    }

    // Initialize Socket.io
    initializeSocket(server);

    // Start HTTP server
    server.listen(env.PORT, '0.0.0.0', () => {
      logger.info(`🚀 ResQNet API v2 running on http://localhost:${env.PORT}`);
      logger.info(`📋 Incidents: http://localhost:${env.PORT}/api/v1/incidents`);
      logger.info(`🔐 Auth:      http://localhost:${env.PORT}/api/v1/auth`);
      logger.info(`🏥 Hospitals: http://localhost:${env.PORT}/api/v1/hospitals`);
      logger.info(`⚡ Socket.io: ws://localhost:${env.PORT}`);
      logger.info(`❤️  Health:    http://localhost:${env.PORT}/health`);
      logger.info(`🌐 CORS:      ${allowedOrigins.join(', ')}`);
      logger.info(`🔧 Env:       ${env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// ─── Graceful Shutdown ───────────────────────────────────────
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`\n${signal} received. Starting graceful shutdown...`);

  // Stop accepting new connections
  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      await disconnectDatabase();
      await disconnectRedis();
      logger.info('All connections closed. Goodbye! 👋');
      process.exit(0);
    } catch (err) {
      logger.error('Error during shutdown:', err);
      process.exit(1);
    }
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection:', reason);
});

// Start
startServer();

export default app;
