// ─────────────────────────────────────────────────────────────
// ResQNet — Incident Model
// Core entity of the platform. Tracks emergency incidents from
// report through resolution with full timeline, AI analysis,
// responder assignments, and evidence attachments.
// ─────────────────────────────────────────────────────────────

import mongoose, { Schema, type Document, type Types } from 'mongoose';
import type {
  IncidentType,
  IncidentStatus,
  IncidentSeverity,
  GeoPoint,
  TimelineEntry,
  AIAnalysis,
  Evidence,
} from '../types/index.js';

export interface IIncident extends Document {
  _id: Types.ObjectId;
  incidentType: IncidentType;
  description: string;
  location: GeoPoint;
  address: string | null;
  severity: IncidentSeverity;
  status: IncidentStatus;

  // AI enrichment
  aiPriorityScore: number;
  aiAnalysis: AIAnalysis | null;

  // People
  reporterId: Types.ObjectId | null;
  assignedResponders: Types.ObjectId[];
  assignedVehicles: Types.ObjectId[];

  // Evidence & media
  evidence: Evidence[];
  imageUrl: string | null;

  // Timeline
  timeline: TimelineEntry[];

  // Metadata
  resolvedAt: Date | null;
  estimatedResponseTime: number | null; // minutes
  tags: string[];
  isVerified: boolean;
  duplicateOfId: Types.ObjectId | null;

  createdAt: Date;
  updatedAt: Date;
}

const geoPointSchema = new Schema<GeoPoint>(
  {
    type: { type: String, enum: ['Point'], default: 'Point', required: true },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: (coords: number[]) =>
          coords.length === 2 &&
          coords[0] >= -180 && coords[0] <= 180 &&
          coords[1] >= -90 && coords[1] <= 90,
        message: 'Coordinates must be [longitude, latitude] within valid ranges',
      },
    },
  },
  { _id: false },
);

const timelineEntrySchema = new Schema<TimelineEntry>(
  {
    timestamp: { type: Date, default: Date.now },
    action: { type: String, required: true },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    details: { type: String, default: '' },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false },
);

const aiAnalysisSchema = new Schema<AIAnalysis>(
  {
    severityScore: { type: Number, min: 0, max: 100, default: 50 },
    predictedCategory: { type: String, default: '' },
    summary: { type: String, default: '' },
    duplicateOf: { type: Schema.Types.ObjectId, ref: 'Incident', default: null },
    fakeScore: { type: Number, min: 0, max: 1, default: 0 },
    sentiment: { type: String, default: 'neutral' },
    keywords: { type: [String], default: [] },
    analyzedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const evidenceSchema = new Schema<Evidence>(
  {
    type: { type: String, enum: ['image', 'video', 'audio', 'document'], required: true },
    url: { type: String, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    uploadedAt: { type: Date, default: Date.now },
    aiAnalysis: { type: Schema.Types.Mixed, default: null },
  },
  { _id: false },
);

const incidentSchema = new Schema<IIncident>(
  {
    incidentType: {
      type: String,
      required: [true, 'Incident type is required'],
      enum: ['accident', 'fire', 'medical', 'disaster', 'crime', 'hazmat', 'rescue', 'other'],
      trim: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [5000, 'Description must not exceed 5000 characters'],
    },
    location: {
      type: geoPointSchema,
      required: [true, 'Location is required'],
      index: '2dsphere', // Enable geospatial queries
    },
    address: { type: String, default: null, trim: true },
    severity: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low'],
      default: 'medium',
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'verified', 'assigned', 'in_progress', 'resolved', 'closed', 'false_alarm'],
      default: 'pending',
      index: true,
    },

    // AI
    aiPriorityScore: { type: Number, min: 0, max: 100, default: 50 },
    aiAnalysis: { type: aiAnalysisSchema, default: null },

    // People
    reporterId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    assignedResponders: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    assignedVehicles: [{ type: Schema.Types.ObjectId, ref: 'Vehicle' }],

    // Evidence
    evidence: { type: [evidenceSchema], default: [] },
    imageUrl: { type: String, default: null },

    // Timeline
    timeline: { type: [timelineEntrySchema], default: [] },

    // Metadata
    resolvedAt: { type: Date, default: null },
    estimatedResponseTime: { type: Number, default: null },
    tags: { type: [String], default: [] },
    isVerified: { type: Boolean, default: false },
    duplicateOfId: { type: Schema.Types.ObjectId, ref: 'Incident', default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ─── Compound Indexes ────────────────────────────────────────
incidentSchema.index({ status: 1, severity: 1, createdAt: -1 });
incidentSchema.index({ incidentType: 1, status: 1 });
incidentSchema.index({ reporterId: 1, createdAt: -1 });
incidentSchema.index({ createdAt: -1 });

// Full-text search on description and tags
incidentSchema.index({ description: 'text', tags: 'text' });

// ─── Pre-save: auto-add timeline entry on creation ──────────
incidentSchema.pre('save', function (next) {
  if (this.isNew) {
    this.timeline.push({
      timestamp: new Date(),
      action: 'incident_created',
      performedBy: this.reporterId,
      details: 'Incident was reported',
    });
  }
  next();
});

export const Incident = mongoose.model<IIncident>('Incident', incidentSchema);
