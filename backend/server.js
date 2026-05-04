import http from 'http';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env } from './config/env.js';
import { connectDatabase } from './config/database.js';
import incidentRoutes from './routes/incidentRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import authRoutes from './routes/authRoutes.js';
import servicesRoutes from './routes/servicesRoutes.js';
import errorHandler from './middleware/errorHandler.js';
import { initializeSocket } from './socket/index.js';

const app = express();
const server = http.createServer(app);

// ─── Parse allowed CORS origins from env ─────────────────────
const allowedOrigins = env.clientUrl
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// ─── Middleware ──────────────────────────────────────────────
app.use(
  cors({
    origin(origin, callback) {
      // Allow requests with no origin (curl, Postman, mobile apps)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '8mb' }));
app.use(cookieParser());
app.use(morgan('dev'));

// ─── Health Check ────────────────────────────────────────────
const healthResponse = (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    service: 'ResQNet API',
    timestamp: new Date().toISOString(),
  });
};

app.get('/health', healthResponse);
app.get('/api/health', healthResponse);

// ─── API Routes ──────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/incidents', uploadRoutes);   // Upload routes (specific paths first)
app.use('/api/incidents', incidentRoutes); // CRUD routes (general paths)
app.use('/api/services', servicesRoutes);  // Nearby emergency services

// ─── 404 Handler ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// ─── Global Error Handler ────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ────────────────────────────────────────────
const startServer = async () => {
  await connectDatabase();
  initializeSocket(server);

  server.listen(env.port, '0.0.0.0', () => {
    console.log(`🚀 ResQNet API running on http://localhost:${env.port}`);
    console.log(`📋 Incidents: http://localhost:${env.port}/api/incidents`);
    console.log(`🔐 Auth:      http://localhost:${env.port}/api/auth`);
    console.log(`🏥 Services:  http://localhost:${env.port}/api/services/nearby`);
    console.log(`⚡ Socket.io: ws://localhost:${env.port}`);
    console.log(`❤️  Health:    http://localhost:${env.port}/api/health`);
    console.log(`🌐 CORS origins: ${allowedOrigins.join(', ')}`);
  });
};

startServer();

export default app;
