import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface IDepartmentAssignment extends Document {
  _id: Types.ObjectId;
  departmentId: Types.ObjectId;
  issueId: Types.ObjectId | null; // Can link to CivicIssue
  incidentId: Types.ObjectId | null; // Can link to Incident
  
  assignedAt: Date;
  acknowledgedAt: Date | null;
  resolvedAt: Date | null;
  
  status: 'assigned' | 'acknowledged' | 'in_progress' | 'resolved' | 'escalated';
  
  priority: 'critical' | 'high' | 'medium' | 'low';
  
  // SLA tracking
  slaDeadline: Date | null;
  slaBreached: boolean;
  
  notes: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const departmentAssignmentSchema = new Schema<IDepartmentAssignment>(
  {
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
    issueId: { type: Schema.Types.ObjectId, ref: 'CivicIssue', default: null, index: true },
    incidentId: { type: Schema.Types.ObjectId, ref: 'Incident', default: null, index: true },
    
    assignedAt: { type: Date, default: Date.now },
    acknowledgedAt: { type: Date, default: null },
    resolvedAt: { type: Date, default: null },
    
    status: {
      type: String,
      enum: ['assigned', 'acknowledged', 'in_progress', 'resolved', 'escalated'],
      default: 'assigned',
      index: true,
    },
    
    priority: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low'],
      default: 'medium',
    },
    
    slaDeadline: { type: Date, default: null },
    slaBreached: { type: Boolean, default: false },
    
    notes: { type: String, default: '', trim: true },
  },
  {
    timestamps: true,
  },
);

// Ensure that either issueId or incidentId is provided
departmentAssignmentSchema.pre('validate', function(next) {
  if (!this.issueId && !this.incidentId) {
    next(new Error('Either issueId or incidentId must be provided for a DepartmentAssignment.'));
  } else {
    next();
  }
});

export const DepartmentAssignment = mongoose.model<IDepartmentAssignment>('DepartmentAssignment', departmentAssignmentSchema);
