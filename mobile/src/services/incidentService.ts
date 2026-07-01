import api, { ApiError } from './api';
import { queueIncident } from './db';
import NetInfo from '@react-native-community/netinfo';

// ─── Types ───────────────────────────────────────────────────
export type IncidentType = 'accident' | 'fire' | 'medical' | 'disaster' | 'crime' | 'hazmat' | 'rescue' | 'other';
export type IncidentStatus = 'pending' | 'verified' | 'assigned' | 'in_progress' | 'resolved' | 'closed' | 'false_alarm';
export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface Incident {
  _id: string;
  incidentType: IncidentType;
  description: string;
  latitude: number;
  longitude: number;
  imageUrl?: string;
  severity?: IncidentSeverity;
  tags?: string[];
  status: IncidentStatus;
  reportedAt: string;
  reporterId?: any; // To allow populated object or string
  assignedResponders?: any[];
  assignedVehicles?: any[];
  timeline?: any[];
  isOffline?: boolean;
}

export interface CreateIncidentPayload {
  incidentType: IncidentType;
  description: string;
  latitude: number;
  longitude: number;
  severity?: IncidentSeverity;
  imageUrl?: string;
  tags?: string[];
}

interface IncidentListResponse {
  success: boolean;
  count: number;
  data: any[];
}

interface IncidentSingleResponse {
  success: boolean;
  data: any;
}

// ─── Helper ──────────────────────────────────────────────────
export function mapIncident(raw: any): Incident {
  return {
    ...raw,
    latitude: raw.location?.coordinates[1] ?? 0,
    longitude: raw.location?.coordinates[0] ?? 0,
    _id: raw._id || raw.incidentId, // handle just in case
    reportedAt: raw.createdAt || raw.timestamp || raw.reportedAt || new Date().toISOString(),
  };
}

// ─── Service ─────────────────────────────────────────────────
export const incidentService = {
  /**
   * Create a new incident report.
   * If offline, queues the incident in SQLite and returns a mock object.
   */
  async reportIncident(payload: CreateIncidentPayload): Promise<Incident> {
    const netInfo = await NetInfo.fetch();
    
    if (!netInfo.isConnected || !netInfo.isInternetReachable) {
      // Offline mode: queue in SQLite
      const id = await queueIncident(payload);
      return {
        _id: `offline-${id}`,
        ...payload,
        status: 'pending',
        reportedAt: new Date().toISOString(),
        isOffline: true,
      } as Incident;
    }

    try {
      const { data } = await api.post<IncidentSingleResponse>(
        '/incidents',
        payload
      );
      return mapIncident(data.data);
    } catch (error) {
      if (error instanceof ApiError && error.code === 'NETWORK_ERROR') {
        const id = await queueIncident(payload);
        return {
          _id: `offline-${id}`,
          ...payload,
          status: 'pending',
          reportedAt: new Date().toISOString(),
          isOffline: true,
        } as Incident;
      }
      throw error;
    }
  },

  /**
   * Get all incidents, optionally filtered by status or type.
   */
  async getIncidents(params?: {
    status?: IncidentStatus;
    incidentType?: IncidentType;
  }): Promise<Incident[]> {
    const { data } = await api.get<IncidentListResponse>('/incidents', {
      params,
    });
    return (data.data || []).map(mapIncident);
  },

  /**
   * Get a single incident by ID.
   */
  async getIncidentById(id: string): Promise<Incident> {
    const { data } = await api.get<IncidentSingleResponse>(
      `/incidents/${id}`
    );
    return mapIncident(data.data);
  },

  /**
   * Update the status of an incident.
   */
  async updateStatus(
    id: string,
    status: IncidentStatus
  ): Promise<Incident> {
    const { data } = await api.patch<IncidentSingleResponse>(
      `/incidents/${id}/status`,
      { status }
    );
    return mapIncident(data.data);
  },

  /**
   * Delete an incident.
   */
  async deleteIncident(id: string): Promise<void> {
    await api.delete(`/incidents/${id}`);
  },
};
