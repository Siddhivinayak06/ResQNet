// ─────────────────────────────────────────────────────────────
// ResQNet — Volunteer Model
// Tracks volunteer profiles, skills, certifications,
// availability, ratings, and mission history.
// ─────────────────────────────────────────────────────────────

import mongoose, { Schema, type Document, type Types } from 'mongoose';
import type { GeoPoint } from '../types/index.js';

export interface IVolunteer extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;

  // Skills & qualifications
  skills: string[];
  certifications: {
    name: string;
    issuedBy: string;
    issuedAt: Date;
    expiresAt: Date | null;
    verified: boolean;
  }[];

  // Availability
  isAvailable: boolean;
  availabilitySchedule: {
    dayOfWeek: number; // 0 = Sunday
    startTime: string; // "08:00"
    endTime: string;   // "18:00"
  }[];
  maxDistanceKm: number;
  currentLocation: GeoPoint | null;

  // Performance
  rating: number;
  totalMissions: number;
  completedMissions: number;
  hoursContributed: number;

  // Status
  isActive: boolean;
  isVerified: boolean;
  joinedAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

const geoPointSchema = new Schema(
  {
    type: { type: String, enum: ['Point'], default: 'Point', required: true },
    coordinates: { type: [Number], required: true },
  },
  { _id: false },
);

const certificationSchema = new Schema(
  {
    name: { type: String, required: true },
    issuedBy: { type: String, required: true },
    issuedAt: { type: Date, required: true },
    expiresAt: { type: Date, default: null },
    verified: { type: Boolean, default: false },
  },
  { _id: true },
);

const availabilitySchema = new Schema(
  {
    dayOfWeek: { type: Number, min: 0, max: 6, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
  },
  { _id: false },
);

const volunteerSchema = new Schema<IVolunteer>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    skills: { type: [String], default: [] },
    certifications: { type: [certificationSchema], default: [] },

    isAvailable: { type: Boolean, default: true, index: true },
    availabilitySchedule: { type: [availabilitySchema], default: [] },
    maxDistanceKm: { type: Number, default: 10, min: 1, max: 100 },
    currentLocation: { type: geoPointSchema, default: null, index: '2dsphere' },

    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalMissions: { type: Number, default: 0 },
    completedMissions: { type: Number, default: 0 },
    hoursContributed: { type: Number, default: 0 },

    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

volunteerSchema.index({ isAvailable: 1, isActive: 1 });
volunteerSchema.index({ skills: 1 });

export const Volunteer = mongoose.model<IVolunteer>('Volunteer', volunteerSchema);
