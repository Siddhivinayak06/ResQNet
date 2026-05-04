import api from './api';

// ─── Types ───────────────────────────────────────────────────
export type IncidentType = 'accident' | 'fire' | 'medical' | 'disaster';
export type IncidentStatus = 'pending' | 'active' | 'resolved';

export interface Incident {
  _id: string;
  incidentType: IncidentType;
  description: string;
  latitude: number;
  longitude: number;
  imageUrl?: string;
  status: IncidentStatus;
  reportedAt: string;
  reporterId?: string;
}

export interface CreateIncidentPayload {
  incidentType: IncidentType;
  description: string;
  latitude: number;
  longitude: number;
}

interface IncidentListResponse {
  success: boolean;
  count: number;
  data: Incident[];
}

interface IncidentSingleResponse {
  success: boolean;
  data: Incident;
}

// ─── Service ─────────────────────────────────────────────────
export const incidentService = {
  /**
   * Create a new incident report.
   */
  async reportIncident(payload: CreateIncidentPayload): Promise<Incident> {
    const { data } = await api.post<IncidentSingleResponse>(
      '/api/incidents',
      payload
    );
    return data.data;
  },

  /**
   * Get all incidents, optionally filtered by status or type.
   */
  async getIncidents(params?: {
    status?: IncidentStatus;
    incidentType?: IncidentType;
  }): Promise<Incident[]> {
    const { data } = await api.get<IncidentListResponse>('/api/incidents', {
      params,
    });
    return data.data || [];
  },

  /**
   * Get a single incident by ID.
   */
  async getIncidentById(id: string): Promise<Incident> {
    const { data } = await api.get<IncidentSingleResponse>(
      `/api/incidents/${id}`
    );
    return data.data;
  },

  /**
   * Update the status of an incident.
   */
  async updateStatus(
    id: string,
    status: IncidentStatus
  ): Promise<Incident> {
    const { data } = await api.patch<IncidentSingleResponse>(
      `/api/incidents/${id}`,
      { status }
    );
    return data.data;
  },

  /**
   * Delete an incident.
   */
  async deleteIncident(id: string): Promise<void> {
    await api.delete(`/api/incidents/${id}`);
  },

  /**
   * Upload an image for an incident.
   */
  async uploadImage(id: string, formData: FormData): Promise<string> {
    const { data } = await api.post(`/api/incidents/${id}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data?.imageUrl || '';
  },

  /**
   * Get nearby emergency services (hospitals, police, fire stations).
   */
  async getNearbyServices(
    latitude: number,
    longitude: number,
    radius?: number
  ) {
    const { data } = await api.get('/api/services/nearby', {
      params: { latitude, longitude, radius },
    });
    return data.data || [];
  },
};
