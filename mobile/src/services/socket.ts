import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncQueuedReports } from '../utils/offlineQueue';

// ─── Types ───────────────────────────────────────────────────
export type SocketIncidentPayload = any;
export type SocketCivicPayload = any;
export type SocketLocationPayload = any;

type IncidentHandler = (data: SocketIncidentPayload) => void;
type CivicHandler = (data: SocketCivicPayload) => void;
type LocationHandler = (data: SocketLocationPayload) => void;

// ─── Singleton Socket Manager ────────────────────────────────
class SocketService {
  private socket: Socket | null = null;
  private newIncidentHandlers: IncidentHandler[] = [];
  private updatedIncidentHandlers: IncidentHandler[] = [];
  private newCivicHandlers: CivicHandler[] = [];
  private updatedCivicHandlers: CivicHandler[] = [];
  private locationHandlers: LocationHandler[] = [];

  /** Connect to the backend Socket.io server. */
  async connect(): Promise<void> {
    if (this.socket?.connected) return;

    const SOCKET_URL = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
    const token = await AsyncStorage.getItem('token');

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity, // keep trying to reconnect
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      timeout: 10000,
      auth: token ? { token } : {},
    });

    this.socket.on('connect', () => {
      console.log('🔌 Socket connected:', this.socket?.id);
      // Optimistic offline recovery: sync pending offline reports once reconnected
      syncQueuedReports().catch(console.error);
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

    this.socket.on('newCivicIssue', (data: SocketCivicPayload) => {
      this.newCivicHandlers.forEach((h) => h(data));
    });

    this.socket.on('civicIssueUpdated', (data: SocketCivicPayload) => {
      this.updatedCivicHandlers.forEach((h) => h(data));
    });

    this.socket.on('locationUpdate', (data: SocketLocationPayload) => {
      this.locationHandlers.forEach((h) => h(data));
    });
  }

  /** Disconnect from the server. */
  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  // ─── Handlers ──────────────────────────────────────────────

  onNewIncident(handler: IncidentHandler): () => void {
    this.newIncidentHandlers.push(handler);
    return () => { this.newIncidentHandlers = this.newIncidentHandlers.filter((h) => h !== handler); };
  }

  onIncidentUpdated(handler: IncidentHandler): () => void {
    this.updatedIncidentHandlers.push(handler);
    return () => { this.updatedIncidentHandlers = this.updatedIncidentHandlers.filter((h) => h !== handler); };
  }

  onNewCivicIssue(handler: CivicHandler): () => void {
    this.newCivicHandlers.push(handler);
    return () => { this.newCivicHandlers = this.newCivicHandlers.filter((h) => h !== handler); };
  }

  onCivicIssueUpdated(handler: CivicHandler): () => void {
    this.updatedCivicHandlers.push(handler);
    return () => { this.updatedCivicHandlers = this.updatedCivicHandlers.filter((h) => h !== handler); };
  }

  onLocationUpdate(handler: LocationHandler): () => void {
    this.locationHandlers.push(handler);
    return () => { this.locationHandlers = this.locationHandlers.filter((h) => h !== handler); };
  }

  // ─── Emitters ──────────────────────────────────────────────

  subscribeToIncident(incidentId: string): void {
    this.socket?.emit('subscribeIncident', incidentId);
  }

  unsubscribeFromIncident(incidentId: string): void {
    this.socket?.emit('unsubscribeIncident', incidentId);
  }
  
  updateLocation(latitude: number, longitude: number): void {
    if (this.isConnected) {
      this.socket?.emit('updateLocation', { latitude, longitude });
    }
  }

  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const socketService = new SocketService();
