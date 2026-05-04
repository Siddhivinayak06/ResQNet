import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env, getAllowedOrigins } from '../config/env.js';

let io;

export function initializeSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: getAllowedOrigins(),
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next();
    }

    try {
      const payload = jwt.verify(token, env.jwtSecret);
      socket.user = payload;
      return next();
    } catch (error) {
      return next(new Error('Unauthorized socket connection'));
    }
  });

  io.on('connection', (socket) => {
    if (socket.user?.role) {
      socket.join(`role:${socket.user.role}`);
    }

    if (socket.user?.userId) {
      socket.join(`user:${socket.user.userId}`);
    }

    socket.on('join-role', (role) => {
      if (typeof role === 'string' && role.length > 0) {
        socket.join(`role:${role}`);
      }
    });
  });

  return io;
}

export function emitToRoles(eventName, payload, roles = []) {
  if (!io) return;

  roles.forEach((role) => {
    io.to(`role:${role}`).emit(eventName, payload);
  });
}

export function emitToUser(userId, eventName, payload) {
  if (!io || !userId) return;

  io.to(`user:${userId}`).emit(eventName, payload);
}

export function emitGlobal(eventName, payload) {
  if (!io) return;

  io.emit(eventName, payload);
}
