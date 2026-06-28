// ─────────────────────────────────────────────────────────────
// ResQNet — Vehicle Model
// Tracks emergency vehicles (ambulances, fire trucks, police
// cars, helicopters) with real-time GPS and dispatch status.
// ─────────────────────────────────────────────────────────────

import mongoose, { Schema, type Document, type Types } from 'mongoose';
import type { VehicleType, VehicleStatus, GeoPoint } from '../types/index.js';

export interface IVehicle extends Document {
  _id: Types.ObjectId;
  type: VehicleType;
  registrationNumber: string;
  name: string;
  currentLocation: GeoPoint;
  status: VehicleStatus;

  // Assignment
  assignedIncident: Types.ObjectId | null;
  assignedHospital: Types.ObjectId | null;
  crew: Types.ObjectId[];

  // Tracking
  gpsHistory: {
    location: GeoPoint;
    speed: number;
    heading: number;
    timestamp: Date;
  }[];

  // Equipment
  equipment: string[];
  fuelLevel: number; // 0-100 percentage

  // Metadata
  lastMaintenanceAt: Date | null;
  isActive: boolean;

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

const gpsHistorySchema = new Schema(
  {
    location: { type: geoPointSchema, required: true },
    speed: { type: Number, default: 0 },
    heading: { type: Number, default: 0 },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false },
);

const vehicleSchema = new Schema<IVehicle>(
  {
    type: {
      type: String,
      enum: ['ambulance', 'fire_truck', 'police_car', 'helicopter', 'boat'],
      required: [true, 'Vehicle type is required'],
      index: true,
    },
    registrationNumber: {
      type: String,
      required: [true, 'Registration number is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: { type: String, trim: true, default: '' },
    currentLocation: {
      type: geoPointSchema,
      required: true,
      index: '2dsphere',
    },
    status: {
      type: String,
      enum: ['available', 'dispatched', 'en_route', 'on_scene', 'returning', 'maintenance'],
      default: 'available',
      index: true,
    },

    assignedIncident: { type: Schema.Types.ObjectId, ref: 'Incident', default: null },
    assignedHospital: { type: Schema.Types.ObjectId, ref: 'Hospital', default: null },
    crew: [{ type: Schema.Types.ObjectId, ref: 'User' }],

    gpsHistory: {
      type: [gpsHistorySchema],
      default: [],
      // Only keep last 100 GPS points in the document; older data goes to a separate collection
      validate: {
        validator: (arr: unknown[]) => arr.length <= 500,
        message: 'GPS history exceeds maximum stored points',
      },
    },

    equipment: { type: [String], default: [] },
    fuelLevel: { type: Number, default: 100, min: 0, max: 100 },
    lastMaintenanceAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

vehicleSchema.index({ type: 1, status: 1 });
vehicleSchema.index({ assignedIncident: 1 });

export const Vehicle = mongoose.model<IVehicle>('Vehicle', vehicleSchema);
