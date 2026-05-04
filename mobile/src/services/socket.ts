import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from './api';

// ─── Types ───────────────────────────────────────────────────
export interface SocketIncidentPayload {
  incidentId: string;
  incidentType: string;
  description: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  status?: string;
}

type IncidentHandler = (data: SocketIncidentPayload) => void;

// ─── Singleton Socket Manager ────────────────────────────────
class SocketService {
  private socket: Socket | null = null;
  private newIncidentHandlers: IncidentHandler[] = [];
  private updatedIncidentHandlers: IncidentHandler[] = [];

  /** Connect to the backend Socket.io server. */
  connect(): void {
    if (this.socket?.connected) return;

    this.socket = io(API_BASE_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      timeout: 10000,
    });

    this.socket.on('connect', () => {
      console.log('🔌 Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (err) => {
      console.log('⚠️ Socket error:', err.message);
    });

    // ── Listen for real-time events ──
    this.socket.on('newIncident', (data: SocketIncidentPayload) => {
      this.newIncidentHandlers.forEach((h) => h(data));
    });

    this.socket.on('incidentUpdated', (data: SocketIncidentPayload) => {
      this.updatedIncidentHandlers.forEach((h) => h(data));
    });
  }

  /** Disconnect from the server. */
  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  /** Register a handler for new incidents. Returns an unsubscribe function. */
  onNewIncident(handler: IncidentHandler): () => void {
    this.newIncidentHandlers.push(handler);
    return () => {
      this.newIncidentHandlers = this.newIncidentHandlers.filter((h) => h !== handler);
    };
  }

  /** Register a handler for updated incidents. Returns an unsubscribe function. */
  onIncidentUpdated(handler: IncidentHandler): () => void {
    this.updatedIncidentHandlers.push(handler);
    return () => {
      this.updatedIncidentHandlers = this.updatedIncidentHandlers.filter((h) => h !== handler);
    };
  }

  /** Subscribe to updates for a specific incident. */
  subscribeToIncident(incidentId: string): void {
    this.socket?.emit('subscribeIncident', incidentId);
  }

  /** Unsubscribe from a specific incident. */
  unsubscribeFromIncident(incidentId: string): void {
    this.socket?.emit('unsubscribeIncident', incidentId);
  }

  /** Check if currently connected. */
  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

// Export singleton
export const socketService = new SocketService();
