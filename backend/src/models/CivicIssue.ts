import mongoose, { Schema, type Document, type Types } from 'mongoose';
import type {
  CivicIssueCategory,
  CivicIssueStatus,
  IncidentSeverity,
  GeoPoint,
  TimelineEntry,
  AIAnalysis,
  Evidence,
} from '../types/index.js';

export interface ICivicIssue extends Document {
  _id: Types.ObjectId;
  category: CivicIssueCategory;
  description: string;
  location: GeoPoint;
  address: string | null;
  severity: IncidentSeverity; // Reusing IncidentSeverity (critical, high, medium, low)
  status: CivicIssueStatus;

  // AI enrichment
  aiPriorityScore: number;
  aiAnalysis: AIAnalysis | null;

  // People & Assignment
  reporterId: Types.ObjectId | null;
  assignedDepartment: Types.ObjectId | null; // Ref to Department
  upvotes: Types.ObjectId[]; // Array of User IDs who also reported this / upvoted
  
  // Evidence & media
  evidence: Evidence[];
  imageUrl: string | null;

  // Timeline
  timeline: TimelineEntry[];

  // Metadata
  resolvedAt: Date | null;
  tags: string[];
  isVerified: boolean;
  duplicateOfId: Types.ObjectId | null;

  // Comments
  comments: {
    user: Types.ObjectId;
    text: string;
    timestamp: Date;
  }[];

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
    duplicateOf: { type: Schema.Types.ObjectId, ref: 'CivicIssue', default: null },
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

const civicIssueSchema = new Schema<ICivicIssue>(
  {
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'pothole', 'garbage', 'streetlight', 'water_leakage', 
        'sewage', 'illegal_dumping', 'damaged_road', 
        'fallen_tree', 'traffic_signal', 'property_damage', 'other'
      ],
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
      index: '2dsphere',
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
      enum: ['reported', 'under_review', 'assigned', 'in_progress', 'resolved', 'closed'],
      default: 'reported',
      index: true,
    },

    // AI
    aiPriorityScore: { type: Number, min: 0, max: 100, default: 50 },
    aiAnalysis: { type: aiAnalysisSchema, default: null },

    // People & Assignment
    reporterId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    assignedDepartment: { type: Schema.Types.ObjectId, ref: 'Department', default: null, index: true },
    upvotes: [{ type: Schema.Types.ObjectId, ref: 'User' }],

    // Evidence
    evidence: { type: [evidenceSchema], default: [] },
    imageUrl: { type: String, default: null },

    // Timeline
    timeline: { type: [timelineEntrySchema], default: [] },

    // Metadata
    resolvedAt: { type: Date, default: null },
    tags: { type: [String], default: [] },
    isVerified: { type: Boolean, default: false },
    duplicateOfId: { type: Schema.Types.ObjectId, ref: 'CivicIssue', default: null },
    
    // Comments
    comments: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        text: { type: String, required: true },
        timestamp: { type: Date, default: Date.now }
      }
    ]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ─── Compound Indexes ────────────────────────────────────────
civicIssueSchema.index({ status: 1, severity: 1, createdAt: -1 });
civicIssueSchema.index({ category: 1, status: 1 });
civicIssueSchema.index({ reporterId: 1, createdAt: -1 });
civicIssueSchema.index({ createdAt: -1 });
civicIssueSchema.index({ description: 'text', tags: 'text' });

// ─── Pre-save: auto-add timeline entry on creation ──────────
civicIssueSchema.pre('save', function (next) {
  if (this.isNew) {
    this.timeline.push({
      timestamp: new Date(),
      action: 'issue_reported',
      performedBy: this.reporterId,
      details: 'Civic issue was reported',
    });
  }
  next();
});

export const CivicIssue = mongoose.model<ICivicIssue>('CivicIssue', civicIssueSchema);
