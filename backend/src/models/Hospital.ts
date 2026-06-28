// ─────────────────────────────────────────────────────────────
// ResQNet — Hospital Model
// Tracks hospital capacity, bed availability, doctor schedules,
// blood bank inventory, and ambulance fleet.
// ─────────────────────────────────────────────────────────────

import mongoose, { Schema, type Document, type Types } from 'mongoose';
import type { GeoPoint, BedAvailability, BloodBank } from '../types/index.js';

export interface IHospital extends Document {
  _id: Types.ObjectId;
  name: string;
  location: GeoPoint;
  address: string;
  phone: string;
  email: string | null;
  adminUserId: Types.ObjectId | null;

  // Capacity
  beds: BedAvailability;
  bloodBank: BloodBank;

  // Staff
  doctors: {
    name: string;
    specialization: string;
    isAvailable: boolean;
    phone: string;
  }[];

  // Ambulances
  ambulances: Types.ObjectId[];

  // Emergency queue
  emergencyQueue: {
    incidentId: Types.ObjectId;
    patientName: string;
    severity: string;
    estimatedArrival: Date | null;
    status: 'incoming' | 'arrived' | 'treated' | 'admitted' | 'discharged';
    addedAt: Date;
  }[];

  // Status
  isActive: boolean;
  isAcceptingEmergencies: boolean;
  rating: number;
  specializations: string[];

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

const doctorSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    specialization: { type: String, required: true, trim: true },
    isAvailable: { type: Boolean, default: true },
    phone: { type: String, trim: true, default: '' },
  },
  { _id: true },
);

const emergencyQueueSchema = new Schema(
  {
    incidentId: { type: Schema.Types.ObjectId, ref: 'Incident', required: true },
    patientName: { type: String, default: 'Unknown' },
    severity: { type: String, enum: ['critical', 'high', 'medium', 'low'], default: 'medium' },
    estimatedArrival: { type: Date, default: null },
    status: {
      type: String,
      enum: ['incoming', 'arrived', 'treated', 'admitted', 'discharged'],
      default: 'incoming',
    },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const hospitalSchema = new Schema<IHospital>(
  {
    name: {
      type: String,
      required: [true, 'Hospital name is required'],
      trim: true,
      index: true,
    },
    location: {
      type: geoPointSchema,
      required: true,
      index: '2dsphere',
    },
    address: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, default: null },
    adminUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },

    beds: {
      total: { type: Number, default: 0, min: 0 },
      available: { type: Number, default: 0, min: 0 },
      icu: {
        total: { type: Number, default: 0, min: 0 },
        available: { type: Number, default: 0, min: 0 },
      },
      ventilator: {
        total: { type: Number, default: 0, min: 0 },
        available: { type: Number, default: 0, min: 0 },
      },
    },

    bloodBank: {
      'A+': { type: Number, default: 0 },  'A-': { type: Number, default: 0 },
      'B+': { type: Number, default: 0 },  'B-': { type: Number, default: 0 },
      'AB+': { type: Number, default: 0 }, 'AB-': { type: Number, default: 0 },
      'O+': { type: Number, default: 0 },  'O-': { type: Number, default: 0 },
    },

    doctors: { type: [doctorSchema], default: [] },
    ambulances: [{ type: Schema.Types.ObjectId, ref: 'Vehicle' }],
    emergencyQueue: { type: [emergencyQueueSchema], default: [] },

    isActive: { type: Boolean, default: true },
    isAcceptingEmergencies: { type: Boolean, default: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    specializations: { type: [String], default: [] },
  },
  { timestamps: true },
);

hospitalSchema.index({ isActive: 1, isAcceptingEmergencies: 1 });
hospitalSchema.index({ 'beds.available': -1 });

export const Hospital = mongoose.model<IHospital>('Hospital', hospitalSchema);
