import api, { ApiError } from './api';
import NetInfo from '@react-native-community/netinfo';

// ─── Types ───────────────────────────────────────────────────
export type CivicIssueCategory =
  | 'pothole'
  | 'garbage'
  | 'streetlight'
  | 'water_leakage'
  | 'sewage'
  | 'illegal_dumping'
  | 'damaged_road'
  | 'fallen_tree'
  | 'traffic_signal'
  | 'property_damage'
  | 'other';

export type CivicIssueStatus =
  | 'reported'
  | 'under_review'
  | 'assigned'
  | 'in_progress'
  | 'resolved'
  | 'closed';

export interface CivicIssue {
  _id: string;
  category: CivicIssueCategory;
  description: string;
  latitude: number;
  longitude: number;
  address?: string;
  imageUrl?: string;
  status: CivicIssueStatus;
  severity: string;
  reportedAt: string;
  reporterId?: any;
  timeline?: any[];
  comments?: { text: string; user: any; timestamp: string }[];
  isOffline?: boolean;
}

export interface CreateCivicIssuePayload {
  category: CivicIssueCategory;
  description: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  address?: string;
  imageUrl?: string;
}

interface CivicIssueListResponse {
  success: boolean;
  data: any[];
}

interface CivicIssueSingleResponse {
  success: boolean;
  data: any;
}

// ─── Helper ──────────────────────────────────────────────────
export function mapCivicIssue(raw: any): CivicIssue {
  return {
    ...raw,
    latitude: raw.location?.coordinates[1] ?? 0,
    longitude: raw.location?.coordinates[0] ?? 0,
    _id: raw._id,
    reportedAt: raw.createdAt || new Date().toISOString(),
  };
}

// ─── Service ─────────────────────────────────────────────────
export const civicIssueService = {
  /**
   * Create a new civic issue report.
   */
  async reportCivicIssue(payload: CreateCivicIssuePayload): Promise<CivicIssue> {
    const netInfo = await NetInfo.fetch();
    
    if (!netInfo.isConnected || !netInfo.isInternetReachable) {
      throw new Error('Offline civic issue reporting is not yet supported.');
    }

    const { data } = await api.post<CivicIssueSingleResponse>(
      '/civic-issues',
      payload
    );
    return mapCivicIssue(data.data);
  },

  /**
   * Get all civic issues.
   */
  async getCivicIssues(params?: {
    status?: CivicIssueStatus;
    category?: CivicIssueCategory;
  }): Promise<CivicIssue[]> {
    const { data } = await api.get<CivicIssueListResponse>('/civic-issues', {
      params,
    });
    return (data.data || []).map(mapCivicIssue);
  },

  /**
   * Get a single civic issue by ID.
   */
  async getCivicIssueById(id: string): Promise<CivicIssue> {
    const { data } = await api.get<CivicIssueSingleResponse>(
      `/civic-issues/${id}`
    );
    return mapCivicIssue(data.data);
  },

  /**
   * Upvote a civic issue.
   */
  async upvoteCivicIssue(id: string): Promise<CivicIssue> {
    const { data } = await api.post<CivicIssueSingleResponse>(
      `/civic-issues/${id}/upvote`
    );
    return mapCivicIssue(data.data);
  },

  /**
   * Add a comment to a civic issue.
   */
  async addComment(id: string, text: string): Promise<CivicIssue> {
    const { data } = await api.post<CivicIssueSingleResponse>(
      `/civic-issues/${id}/comments`,
      { text }
    );
    return mapCivicIssue(data.data);
  },
};
