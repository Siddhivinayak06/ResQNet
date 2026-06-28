export type UserRole = 'citizen' | 'volunteer' | 'admin';

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  phone?: string;
  location?: string;
  hospitalId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthToken {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
  iat: number;
  exp: number;
}

export interface EmergencyReport {
  id: string;
  description: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  severity: 'high' | 'medium' | 'low';
  status: 'open' | 'assigned' | 'in-progress' | 'resolved';
  reportedBy: string;
  assignedTo?: string;
  assignedToHospital?: string;
  resolvedAt?: string;
  photo?: string;
}

export type Report = EmergencyReport;

export interface Responder {
  id: string;
  name: string;
  role: 'responder';
  location: string;
  latitude: number;
  longitude: number;
  status: 'available' | 'busy' | 'offline';
  currentEmergency?: string;
  lastUpdated: string;
}

export interface Hospital {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  latitude: number;
  longitude: number;
  emergencyCapacity: number;
  currentPatients: number;
  specializations: string[];
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'alert' | 'assignment' | 'update' | 'info';
  read: boolean;
  createdAt: string;
}

export interface AdminStats {
  totalEmergencies: number;
  activeEmergencies: number;
  resolvedEmergencies: number;
  totalResponders: number;
  activeResponders: number;
  totalHospitals: number;
  averageResponseTime: number;
  successRate: number;
}
