import { Server } from 'socket.io';

let io = null;

/**
 * Initialize Socket.io on the HTTP server.
 * @param {import('http').Server} httpServer
 * @returns {import('socket.io').Server}
 */
export function initializeSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Allow clients to subscribe to updates for a specific incident
    socket.on('subscribeIncident', (incidentId) => {
      if (incidentId && typeof incidentId === 'string') {
        socket.join(`incident:${incidentId}`);
        console.log(`📡 ${socket.id} subscribed to incident:${incidentId}`);
      }
    });

    // Allow clients to unsubscribe from a specific incident
    socket.on('unsubscribeIncident', (incidentId) => {
      if (incidentId && typeof incidentId === 'string') {
        socket.leave(`incident:${incidentId}`);
        console.log(`🔕 ${socket.id} unsubscribed from incident:${incidentId}`);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`❌ Client disconnected: ${socket.id} (${reason})`);
    });
  });

  console.log('⚡ Socket.io initialized');
  return io;
}

/**
 * Get the current Socket.io instance.
 * @returns {import('socket.io').Server}
 */
export function getIO() {
  if (!io) {
    throw new Error('Socket.io has not been initialized. Call initializeSocket() first.');
  }
  return io;
}
