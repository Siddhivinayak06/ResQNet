// ─────────────────────────────────────────────────────────────
// ResQNet — Resource Model
// Tracks emergency equipment, supplies, and assets allocated
// to incidents, hospitals, or responders.
// ─────────────────────────────────────────────────────────────

import mongoose, { Schema, type Document, type Types } from 'mongoose';
import type { GeoPoint } from '../types/index.js';

export interface IResource extends Document {
  _id: Types.ObjectId;
  type: 'equipment' | 'medical_supply' | 'food' | 'water' | 'shelter' | 'clothing' | 'other';
  name: string;
  description: string;
  quantity: number;
  unit: string;

  // Location & assignment
  location: GeoPoint;
  assignedTo: {
    entityType: 'incident' | 'hospital' | 'shelter' | 'vehicle';
    entityId: Types.ObjectId;
  } | null;

  // Status
  status: 'available' | 'allocated' | 'in_transit' | 'consumed' | 'damaged';
  condition: 'new' | 'good' | 'fair' | 'poor';

  // Tracking
  lastCheckedAt: Date;
  managedBy: Types.ObjectId | null;

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

const resourceSchema = new Schema<IResource>(
  {
    type: {
      type: String,
      enum: ['equipment', 'medical_supply', 'food', 'water', 'shelter', 'clothing', 'other'],
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, default: 'unit', trim: true },

    location: { type: geoPointSchema, required: true, index: '2dsphere' },
    assignedTo: {
      entityType: { type: String, enum: ['incident', 'hospital', 'shelter', 'vehicle'] },
      entityId: { type: Schema.Types.ObjectId },
    },

    status: {
      type: String,
      enum: ['available', 'allocated', 'in_transit', 'consumed', 'damaged'],
      default: 'available',
      index: true,
    },
    condition: {
      type: String,
      enum: ['new', 'good', 'fair', 'poor'],
      default: 'good',
    },

    lastCheckedAt: { type: Date, default: Date.now },
    managedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

resourceSchema.index({ type: 1, status: 1 });

export const Resource = mongoose.model<IResource>('Resource', resourceSchema);
