// ─────────────────────────────────────────────────────────────
// ResQNet — Shared TypeScript Type Definitions
// Central type definitions used across the entire backend.
// ─────────────────────────────────────────────────────────────

import type { Request } from 'express';
import type { Types } from 'mongoose';

// ─── User & Auth ─────────────────────────────────────────────

/** All supported user roles in the platform */
export type UserRole =
  | 'citizen'
  | 'responder'
  | 'volunteer'
  | 'admin'
  | 'hospital_admin'
  | 'police_admin'
  | 'fire_admin'
  | 'super_admin';

/** Device registration for push notifications */
export interface DeviceInfo {
  deviceId: string;
  platform: 'ios' | 'android' | 'web';
  pushToken: string | null;
  lastActive: Date;
}

/** Two-factor authentication config */
export interface TwoFactorConfig {
  enabled: boolean;
  secret: string | null;
  backupCodes: string[];
}

/** JWT payload embedded in access tokens */
export interface JWTPayload {
  id: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

/** Authenticated request — `req.user` is populated after auth middleware */
export interface AuthenticatedRequest extends Request {
  user: JWTPayload;
}

/** Token pair returned on login/refresh */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// ─── GeoJSON ─────────────────────────────────────────────────

/** GeoJSON Point for single-location entities (incidents, vehicles, etc.) */
export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

/** GeoJSON Polygon for area-based entities (disaster zones, geofences) */
export interface GeoPolygon {
  type: 'Polygon';
  coordinates: [number, number][][];
}

// ─── Incidents ───────────────────────────────────────────────

export type IncidentType =
  | 'accident'
  | 'fire'
  | 'medical'
  | 'disaster'
  | 'crime'
  | 'hazmat'
  | 'rescue'
  | 'other';

export type IncidentStatus =
  | 'pending'
  | 'verified'
  | 'assigned'
  | 'in_progress'
  | 'resolved'
  | 'closed'
  | 'false_alarm';

export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low';

/** Single entry in an incident's timeline */
export interface TimelineEntry {
  timestamp: Date;
  action: string;
  performedBy: Types.ObjectId | null;
  details: string;
  metadata?: Record<string, unknown>;
}

/** AI analysis results attached to an incident */
export interface AIAnalysis {
  severityScore: number;       // 0–100
  predictedCategory: string;
  summary: string;
  duplicateOf: Types.ObjectId | null;
  fakeScore: number;           // 0–1 probability of being fake
  sentiment: string;
  keywords: string[];
  analyzedAt: Date;
}

/** Evidence attached to an incident (photos, videos, audio) */
export interface Evidence {
  type: 'image' | 'video' | 'audio' | 'document';
  url: string;
  uploadedBy: Types.ObjectId;
  uploadedAt: Date;
  aiAnalysis?: Record<string, unknown>;
}

// ─── Hospital ────────────────────────────────────────────────

export interface BedAvailability {
  total: number;
  available: number;
  icu: { total: number; available: number };
  ventilator: { total: number; available: number };
}

export interface BloodBank {
  'A+': number;  'A-': number;
  'B+': number;  'B-': number;
  'AB+': number; 'AB-': number;
  'O+': number;  'O-': number;
}

// ─── Vehicles ────────────────────────────────────────────────

export type VehicleType = 'ambulance' | 'fire_truck' | 'police_car' | 'helicopter' | 'boat';
export type VehicleStatus = 'available' | 'dispatched' | 'en_route' | 'on_scene' | 'returning' | 'maintenance';

// ─── Notifications ───────────────────────────────────────────

export type NotificationChannel = 'push' | 'sms' | 'email' | 'whatsapp' | 'telegram' | 'in_app';
export type NotificationPriority = 'critical' | 'high' | 'normal' | 'low';

// ─── Disasters ───────────────────────────────────────────────

export type DisasterType =
  | 'flood'
  | 'earthquake'
  | 'cyclone'
  | 'wildfire'
  | 'chemical_leak'
  | 'pandemic'
  | 'tsunami'
  | 'landslide';

export interface Shelter {
  name: string;
  location: GeoPoint;
  capacity: number;
  currentOccupancy: number;
  facilities: string[];
  contactPhone: string;
}

export interface MissingPerson {
  name: string;
  age: number;
  gender: string;
  description: string;
  lastSeenLocation: GeoPoint;
  lastSeenAt: Date;
  photoUrl: string | null;
  status: 'missing' | 'found' | 'deceased';
  reportedBy: Types.ObjectId;
}

// ─── Medical Profile ─────────────────────────────────────────

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export interface MedicalRecord {
  condition: string;
  diagnosedAt: Date;
  notes: string;
}

export interface InsuranceInfo {
  provider: string;
  policyNumber: string;
  expiresAt: Date;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  isPrimary: boolean;
}

// ─── API Responses ───────────────────────────────────────────

/** Standard API success response envelope */
export interface APIResponse<T = unknown> {
  success: true;
  message?: string;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

/** Standard API error response envelope */
export interface APIErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: Record<string, string[]>;
}

// ─── Pagination ──────────────────────────────────────────────

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─── Socket Events ───────────────────────────────────────────

/** Server → Client events */
export interface ServerToClientEvents {
  newIncident: (data: Record<string, unknown>) => void;
  incidentUpdated: (data: Record<string, unknown>) => void;
  incidentAssigned: (data: Record<string, unknown>) => void;
  message: (data: Record<string, unknown>) => void;
  typing: (data: { userId: string; incidentId: string }) => void;
  locationUpdate: (data: { userId: string; location: GeoPoint; timestamp: Date }) => void;
  etaUpdate: (data: { vehicleId: string; eta: number; distance: number }) => void;
  vehiclePosition: (data: { vehicleId: string; location: GeoPoint }) => void;
  presenceUpdate: (data: { userId: string; status: string }) => void;
  notification: (data: Record<string, unknown>) => void;
  callOffer: (data: Record<string, unknown>) => void;
  callAnswer: (data: Record<string, unknown>) => void;
  callIce: (data: Record<string, unknown>) => void;
  callEnd: (data: { callId: string }) => void;
  broadcast: (data: { message: string; severity: string }) => void;
}

/** Client → Server events */
export interface ClientToServerEvents {
  subscribeIncident: (incidentId: string) => void;
  unsubscribeIncident: (incidentId: string) => void;
  sendMessage: (data: { incidentId: string; content: string; type: string }) => void;
  startTyping: (data: { incidentId: string }) => void;
  stopTyping: (data: { incidentId: string }) => void;
  updateLocation: (data: { latitude: number; longitude: number }) => void;
  updatePresence: (data: { status: string }) => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  callOffer: (data: Record<string, unknown>) => void;
  callAnswer: (data: Record<string, unknown>) => void;
  callIce: (data: Record<string, unknown>) => void;
  callEnd: (data: { callId: string; targetUserId: string }) => void;
}
