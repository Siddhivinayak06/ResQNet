// ─────────────────────────────────────────────────────────────
// ResQNet — Socket.io Server (TypeScript)
// Initializes Socket.io with JWT auth middleware, typed events,
// and organized namespace handlers.
// ─────────────────────────────────────────────────────────────

import { Server as SocketServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import type { JWTPayload, ServerToClientEvents, ClientToServerEvents } from '../types/index.js';

let io: SocketServer<ClientToServerEvents, ServerToClientEvents> | null = null;

/** Connected user tracking: userId → Set<socketId> */
const connectedUsers = new Map<string, Set<string>>();

/**
 * Initialize Socket.io on the HTTP server with JWT authentication.
 */
export function initializeSocket(httpServer: HTTPServer): SocketServer {
  io = new SocketServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: env.CLIENT_URL.split(',').map((o) => o.trim()),
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
  });

  // ─── JWT Authentication Middleware ──────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      // Allow unauthenticated connections for public incident feed
      socket.data.user = null;
      return next();
    }

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;
      socket.data.user = decoded;
      next();
    } catch {
      // Allow connection but without auth context
      socket.data.user = null;
      next();
    }
  });

  // ─── Connection Handler ────────────────────────────────
  io.on('connection', (socket) => {
    const user = socket.data.user as JWTPayload | null;
    const userId = user?.id;

    logger.debug(`🔌 Socket connected: ${socket.id} (user: ${userId || 'anonymous'})`);

    // Track connected users and join role-specific room
    if (userId) {
      if (!connectedUsers.has(userId)) {
        connectedUsers.set(userId, new Set());
      }
      connectedUsers.get(userId)!.add(socket.id);

      // Join role room (e.g. role:citizen, role:volunteer)
      if (user?.role) {
        socket.join(`role:${user.role}`);
        logger.debug(`📡 Socket ${socket.id} joined role:${user.role}`);
      }

      // Broadcast presence
      socket.broadcast.emit('presenceUpdate', { userId, status: 'online' });
    }

    // ─── Incident subscription ─────────────────────────
    socket.on('subscribeIncident', (incidentId: string) => {
      if (incidentId && typeof incidentId === 'string') {
        socket.join(`incident:${incidentId}`);
        logger.debug(`📡 ${socket.id} subscribed to incident:${incidentId}`);
      }
    });

    socket.on('unsubscribeIncident', (incidentId: string) => {
      if (incidentId && typeof incidentId === 'string') {
        socket.leave(`incident:${incidentId}`);
      }
    });

    // ─── Room management ───────────────────────────────
    socket.on('joinRoom', (roomId: string) => {
      socket.join(roomId);
    });

    socket.on('leaveRoom', (roomId: string) => {
      socket.leave(roomId);
    });

    // ─── Location updates ──────────────────────────────
    socket.on('updateLocation', (data) => {
      if (userId) {
        const payload = {
          userId,
          location: {
            type: 'Point' as const,
            coordinates: [data.longitude, data.latitude] as [number, number],
          },
          timestamp: new Date(),
        };
        // Emit to admins and super admins for tracking
        io!.to('role:department_admin').to('role:super_admin').emit('locationUpdate', payload);
        
        // Also emit globally for now since LiveCityMap might be used by anyone, but we restrict it for best practice.
        // If we want everyone to see it:
        io!.emit('locationUpdate', payload);
      }
    });

    // ─── Presence ──────────────────────────────────────
    socket.on('updatePresence', (data) => {
      if (userId) {
        socket.broadcast.emit('presenceUpdate', { userId, status: data.status });
      }
    });

    // ─── Chat ──────────────────────────────────────────
    socket.on('sendMessage', (data) => {
      if (!userId) return;

      const messagePayload = {
        senderId: userId,
        incidentId: data.incidentId,
        content: data.content,
        type: data.type,
        timestamp: new Date(),
      };

      // Send to incident room
      io!.to(`incident:${data.incidentId}`).emit('message', messagePayload);
    });

    socket.on('startTyping', (data) => {
      if (userId) {
        socket.to(`incident:${data.incidentId}`).emit('typing', {
          userId,
          incidentId: data.incidentId,
        });
      }
    });

    // ─── WebRTC Signaling ──────────────────────────────
    socket.on('callOffer', (data) => {
      io!.emit('callOffer', { ...data, callerId: userId });
    });

    socket.on('callAnswer', (data) => {
      io!.emit('callAnswer', data);
    });

    socket.on('callIce', (data) => {
      io!.emit('callIce', data);
    });

    socket.on('callEnd', (data) => {
      io!.emit('callEnd', { callId: data.callId });
    });

    // ─── Disconnection ─────────────────────────────────
    socket.on('disconnect', (reason) => {
      logger.debug(`❌ Socket disconnected: ${socket.id} (${reason})`);

      if (userId) {
        const userSockets = connectedUsers.get(userId);
        if (userSockets) {
          userSockets.delete(socket.id);
          if (userSockets.size === 0) {
            connectedUsers.delete(userId);
            socket.broadcast.emit('presenceUpdate', { userId, status: 'offline' });
          }
        }
      }
    });
  });

  logger.info('⚡ Socket.io initialized with JWT authentication');
  return io;
}

/**
 * Get the current Socket.io server instance.
 */
export function getIO(): SocketServer<ClientToServerEvents, ServerToClientEvents> {
  if (!io) {
    throw new Error('Socket.io has not been initialized');
  }
  return io;
}

/**
 * Check if a user is currently online.
 */
export function isUserOnline(userId: string): boolean {
  return connectedUsers.has(userId) && connectedUsers.get(userId)!.size > 0;
}

/**
 * Get count of currently connected users.
 */
export function getOnlineUsersCount(): number {
  return connectedUsers.size;
}
