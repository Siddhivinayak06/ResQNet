// ─────────────────────────────────────────────────────────────
// ResQNet — Validation Schemas
// Zod schemas for all API request validation.
// ─────────────────────────────────────────────────────────────

import { z } from 'zod';

// ─── Auth Schemas ────────────────────────────────────────────

export const registerSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(8).max(128),
  role: z.enum(['citizen', 'responder', 'volunteer', 'admin', 'hospital_admin', 'police_admin', 'fire_admin']).default('citizen'),
  phoneNumber: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// ─── Incident Schemas ────────────────────────────────────────

export const createIncidentSchema = z.object({
  incidentType: z.enum(['accident', 'fire', 'medical', 'disaster', 'crime', 'hazmat', 'rescue', 'other']),
  description: z.string().min(10).max(5000).trim(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().optional(),
  severity: z.enum(['critical', 'high', 'medium', 'low']).default('medium'),
  imageUrl: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
});

export const updateIncidentStatusSchema = z.object({
  status: z.enum(['pending', 'verified', 'assigned', 'in_progress', 'resolved', 'closed', 'false_alarm']),
});

export const assignIncidentSchema = z.object({
  responderIds: z.array(z.string()).min(1),
  vehicleIds: z.array(z.string()).optional(),
});

// ─── Hospital Schemas ────────────────────────────────────────

export const createHospitalSchema = z.object({
  name: z.string().min(2).max(200).trim(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().min(5).trim(),
  phone: z.string().min(5).trim(),
  email: z.string().email().optional(),
  specializations: z.array(z.string()).optional(),
  beds: z.object({
    total: z.number().int().min(0),
    available: z.number().int().min(0),
    icu: z.object({
      total: z.number().int().min(0),
      available: z.number().int().min(0),
    }).optional(),
    ventilator: z.object({
      total: z.number().int().min(0),
      available: z.number().int().min(0),
    }).optional(),
  }).optional(),
});

export const updateBedsSchema = z.object({
  total: z.number().int().min(0).optional(),
  available: z.number().int().min(0).optional(),
  icu: z.object({
    total: z.number().int().min(0),
    available: z.number().int().min(0),
  }).optional(),
  ventilator: z.object({
    total: z.number().int().min(0),
    available: z.number().int().min(0),
  }).optional(),
});

// ─── Vehicle Schemas ─────────────────────────────────────────

export const createVehicleSchema = z.object({
  type: z.enum(['ambulance', 'fire_truck', 'police_car', 'helicopter', 'boat']),
  registrationNumber: z.string().min(2).max(20).trim(),
  name: z.string().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  equipment: z.array(z.string()).optional(),
});

export const updateVehicleLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  speed: z.number().min(0).optional(),
  heading: z.number().min(0).max(360).optional(),
});

// ─── Disaster Schemas ────────────────────────────────────────

export const createDisasterSchema = z.object({
  type: z.enum(['flood', 'earthquake', 'cyclone', 'wildfire', 'chemical_leak', 'pandemic', 'tsunami', 'landslide']),
  name: z.string().min(3).max(200).trim(),
  description: z.string().min(10).max(5000).trim(),
  severity: z.enum(['catastrophic', 'severe', 'moderate', 'minor']).default('moderate'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  affectedRadius: z.number().min(0.1).max(500).default(10),
  estimatedAffected: z.number().int().min(0).optional(),
});

// ─── Medical Profile Schemas ─────────────────────────────────

export const updateMedicalProfileSchema = z.object({
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  height: z.number().min(0).max(300).optional(),
  weight: z.number().min(0).max(500).optional(),
  dateOfBirth: z.string().datetime().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  allergies: z.array(z.string()).optional(),
  medications: z.array(z.string()).optional(),
  chronicConditions: z.array(z.string()).optional(),
  organDonor: z.boolean().optional(),
  specialInstructions: z.string().max(1000).optional(),
});

// ─── Query Schemas ───────────────────────────────────────────

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().optional(),
  search: z.string().optional(),
});

export const nearbyQuerySchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(0.1).max(50).default(5),
});

export const idParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format'),
});
