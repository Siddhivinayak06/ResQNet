export const incidentTypeConfig = {
  fire: { label: 'Fire', color: '#ef4444' },
  accident: { label: 'Accident', color: '#f97316' },
  medical: { label: 'Medical', color: '#3b82f6' },
  disaster: { label: 'Disaster', color: '#8b5cf6' },
  unknown: { label: 'Unknown', color: '#64748b' },
} as const;

export type IncidentType = keyof typeof incidentTypeConfig;

export interface IncidentMapItem {
  id: string;
  type: IncidentType;
  typeLabel: string;
  description: string;
  status: string;
  reportedAt: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}
