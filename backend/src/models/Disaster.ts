// ─────────────────────────────────────────────────────────────
// ResQNet — Disaster Model
// Tracks large-scale disaster events (floods, earthquakes,
// wildfires, etc.) with shelter management, relief ops,
// and missing persons registry.
// ─────────────────────────────────────────────────────────────

import mongoose, { Schema, type Document, type Types } from 'mongoose';
import type { DisasterType, GeoPoint, GeoPolygon, Shelter, MissingPerson } from '../types/index.js';

export interface IDisaster extends Document {
  _id: Types.ObjectId;
  type: DisasterType;
  name: string;
  description: string;
  severity: 'catastrophic' | 'severe' | 'moderate' | 'minor';
  status: 'active' | 'monitoring' | 'contained' | 'resolved';

  // Geography
  epicenter: GeoPoint;
  affectedArea: GeoPolygon | null;
  affectedRadius: number; // km

  // Infrastructure
  shelters: Shelter[];
  relatedIncidents: Types.ObjectId[];

  // Relief operations
  reliefOps: {
    type: 'food' | 'water' | 'medical' | 'rescue' | 'evacuation' | 'shelter';
    description: string;
    assignedTeams: Types.ObjectId[];
    status: 'planned' | 'in_progress' | 'completed';
    startedAt: Date | null;
    completedAt: Date | null;
  }[];

  // Missing persons
  missingPersons: MissingPerson[];

  // Donations
  donations: {
    donorName: string;
    type: 'money' | 'food' | 'clothing' | 'medical' | 'other';
    amount: number;
    unit: string;
    receivedAt: Date;
  }[];

  // Weather integration
  weatherData: Record<string, unknown>;

  // Statistics
  estimatedAffected: number;
  confirmedCasualties: number;
  rescuedCount: number;

  startedAt: Date;
  resolvedAt: Date | null;

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

const geoPolygonSchema = new Schema(
  {
    type: { type: String, enum: ['Polygon'], default: 'Polygon', required: true },
    coordinates: { type: [[[Number]]], required: true },
  },
  { _id: false },
);

const shelterSchema = new Schema(
  {
    name: { type: String, required: true },
    location: { type: geoPointSchema, required: true },
    capacity: { type: Number, required: true },
    currentOccupancy: { type: Number, default: 0 },
    facilities: { type: [String], default: [] },
    contactPhone: { type: String, default: '' },
  },
  { _id: true },
);

const missingPersonSchema = new Schema(
  {
    name: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true },
    description: { type: String, default: '' },
    lastSeenLocation: { type: geoPointSchema, required: true },
    lastSeenAt: { type: Date, required: true },
    photoUrl: { type: String, default: null },
    status: { type: String, enum: ['missing', 'found', 'deceased'], default: 'missing' },
    reportedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { _id: true },
);

const reliefOpSchema = new Schema(
  {
    type: { type: String, enum: ['food', 'water', 'medical', 'rescue', 'evacuation', 'shelter'], required: true },
    description: { type: String, default: '' },
    assignedTeams: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    status: { type: String, enum: ['planned', 'in_progress', 'completed'], default: 'planned' },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { _id: true },
);

const donationSchema = new Schema(
  {
    donorName: { type: String, default: 'Anonymous' },
    type: { type: String, enum: ['money', 'food', 'clothing', 'medical', 'other'], required: true },
    amount: { type: Number, required: true },
    unit: { type: String, default: 'unit' },
    receivedAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const disasterSchema = new Schema<IDisaster>(
  {
    type: {
      type: String,
      enum: ['flood', 'earthquake', 'cyclone', 'wildfire', 'chemical_leak', 'pandemic', 'tsunami', 'landslide'],
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    severity: {
      type: String,
      enum: ['catastrophic', 'severe', 'moderate', 'minor'],
      default: 'moderate',
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'monitoring', 'contained', 'resolved'],
      default: 'active',
      index: true,
    },

    epicenter: { type: geoPointSchema, required: true, index: '2dsphere' },
    affectedArea: { type: geoPolygonSchema, default: null },
    affectedRadius: { type: Number, default: 10 },

    shelters: { type: [shelterSchema], default: [] },
    relatedIncidents: [{ type: Schema.Types.ObjectId, ref: 'Incident' }],
    reliefOps: { type: [reliefOpSchema], default: [] },
    missingPersons: { type: [missingPersonSchema], default: [] },
    donations: { type: [donationSchema], default: [] },

    weatherData: { type: Schema.Types.Mixed, default: {} },

    estimatedAffected: { type: Number, default: 0 },
    confirmedCasualties: { type: Number, default: 0 },
    rescuedCount: { type: Number, default: 0 },

    startedAt: { type: Date, default: Date.now },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

disasterSchema.index({ status: 1, type: 1, createdAt: -1 });

export const Disaster = mongoose.model<IDisaster>('Disaster', disasterSchema);
