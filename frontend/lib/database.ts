import { User, EmergencyReport, Responder, Hospital, Notification } from './auth-types';

// In-memory database (easily replaceable with Supabase/MongoDB)
export const db = {
  users: new Map<string, User>(),
  reports: new Map<string, EmergencyReport>(),
  responders: new Map<string, Responder>(),
  hospitals: new Map<string, Hospital>(),
  notifications: new Map<string, Notification>(),
};

// Initialize with demo data
export function initializeDatabase() {
  // Demo Citizen
  db.users.set('citizen-1', {
    id: 'citizen-1',
    email: 'citizen@example.com',
    password: 'password123', // In production: use hashed passwords
    name: 'John Doe',
    role: 'citizen',
    phone: '555-0001',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Demo Responder
  db.users.set('responder-1', {
    id: 'responder-1',
    email: 'responder@example.com',
    password: 'password123',
    name: 'Alex Emergency',
    role: 'volunteer',
    phone: '555-0002',
    location: 'Downtown Station',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Demo Hospital
  db.users.set('hospital-1', {
    id: 'hospital-1',
    email: 'admin@hospital.com',
    password: 'password123',
    name: 'City Medical Center',
    role: 'department_admin',
    phone: '555-0003',
    hospitalId: 'hospital-1',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Demo Admin
  db.users.set('admin-1', {
    id: 'admin-1',
    email: 'admin@ers.com',
    password: 'password123',
    name: 'System Administrator',
    role: 'super_admin',
    phone: '555-0004',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Demo Responders
  db.responders.set('responder-1', {
    id: 'responder-1',
    name: 'Alex Emergency',
    role: 'responder',
    location: 'Downtown Station',
    latitude: 40.7128,
    longitude: -74.006,
    status: 'available',
    lastUpdated: new Date().toISOString(),
  });

  db.responders.set('responder-2', {
    id: 'responder-2',
    name: 'Sam Rescue',
    role: 'responder',
    location: 'North District',
    latitude: 40.758,
    longitude: -73.9855,
    status: 'available',
    lastUpdated: new Date().toISOString(),
  });

  // Demo Hospitals
  db.hospitals.set('hospital-1', {
    id: 'hospital-1',
    name: 'City Medical Center',
    email: 'admin@hospital.com',
    phone: '555-0003',
    address: '123 Hospital Ave, City',
    latitude: 40.7505,
    longitude: -73.9972,
    emergencyCapacity: 50,
    currentPatients: 25,
    specializations: ['Trauma', 'Cardiology', 'Neurology'],
    createdAt: new Date().toISOString(),
  });

  db.hospitals.set('hospital-2', {
    id: 'hospital-2',
    name: 'General Health Hospital',
    email: 'admin@generalhealth.com',
    phone: '555-0005',
    address: '456 Health St, City',
    latitude: 40.7614,
    longitude: -73.9776,
    emergencyCapacity: 40,
    currentPatients: 18,
    specializations: ['General', 'Orthopedics', 'Pediatrics'],
    createdAt: new Date().toISOString(),
  });
}

// Utility functions
export function getUserByEmail(email: string): User | undefined {
  return Array.from(db.users.values()).find(u => u.email === email);
}

export function getUserById(id: string): User | undefined {
  return db.users.get(id);
}

export function createUser(user: User): User {
  db.users.set(user.id, user);
  return user;
}

export function createReport(report: EmergencyReport): EmergencyReport {
  db.reports.set(report.id, report);
  return report;
}

export function getReportById(id: string): EmergencyReport | undefined {
  return db.reports.get(id);
}

export function getAllReports(): EmergencyReport[] {
  return Array.from(db.reports.values());
}

export function updateReport(id: string, updates: Partial<EmergencyReport>): EmergencyReport | undefined {
  const report = db.reports.get(id);
  if (report) {
    const updated = { ...report, ...updates };
    db.reports.set(id, updated);
    return updated;
  }
  return undefined;
}

export function getAllResponders(): Responder[] {
  return Array.from(db.responders.values());
}

export function updateResponder(id: string, updates: Partial<Responder>): Responder | undefined {
  const responder = db.responders.get(id);
  if (responder) {
    const updated = { ...responder, ...updates };
    db.responders.set(id, updated);
    return updated;
  }
  return undefined;
}

export function getAllHospitals(): Hospital[] {
  return Array.from(db.hospitals.values());
}

export function getHospitalById(id: string): Hospital | undefined {
  return db.hospitals.get(id);
}

export function createNotification(notification: Notification): Notification {
  db.notifications.set(notification.id, notification);
  return notification;
}

export function getUserNotifications(userId: string): Notification[] {
  return Array.from(db.notifications.values()).filter(n => n.userId === userId);
}

export function markNotificationAsRead(id: string): Notification | undefined {
  const notification = db.notifications.get(id);
  if (notification) {
    const updated = { ...notification, read: true };
    db.notifications.set(id, updated);
    return updated;
  }
  return undefined;
}
