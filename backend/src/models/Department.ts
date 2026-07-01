import mongoose, { Schema, type Document, type Types } from 'mongoose';
import type { DepartmentType, GeoPoint } from '../types/index.js';

export interface IDepartment extends Document {
  _id: Types.ObjectId;
  name: string;
  type: DepartmentType;
  description: string;
  
  // Contact & Location
  contactEmail: string;
  contactPhone: string;
  headquartersLocation: GeoPoint;
  
  // Settings & Assignment
  isAutoAssignEnabled: boolean;
  handledCategories: string[]; // e.g., ['pothole', 'damaged_road']
  
  // Stats (could be updated by cron/analytics jobs)
  activeIssuesCount: number;
  resolvedIssuesCount: number;
  averageResolutionTimeMinutes: number;
  
  createdAt: Date;
  updatedAt: Date;
}

const geoPointSchema = new Schema<GeoPoint>(
  {
    type: { type: String, enum: ['Point'], default: 'Point', required: true },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  { _id: false },
);

const departmentSchema = new Schema<IDepartment>(
  {
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      required: true,
      enum: ['police', 'fire', 'medical', 'water', 'electricity', 'municipal', 'traffic', 'forest', 'other'],
      index: true,
    },
    description: { type: String, default: '', trim: true },
    
    contactEmail: { type: String, required: true, trim: true },
    contactPhone: { type: String, required: true, trim: true },
    headquartersLocation: { type: geoPointSchema, required: true },
    
    isAutoAssignEnabled: { type: Boolean, default: true },
    handledCategories: { type: [String], default: [] },
    
    activeIssuesCount: { type: Number, default: 0 },
    resolvedIssuesCount: { type: Number, default: 0 },
    averageResolutionTimeMinutes: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  },
);

export const Department = mongoose.model<IDepartment>('Department', departmentSchema);
