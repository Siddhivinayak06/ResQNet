// ─────────────────────────────────────────────────────────────
// ResQNet — AuditLog Model
// Immutable audit trail of all significant system actions.
// Used for compliance, debugging, and security analysis.
// ─────────────────────────────────────────────────────────────

import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface IAuditLog extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId | null;
  userEmail: string;
  userRole: string;
  action: string;
  resource: string;
  resourceId: string | null;
  method: string;
  path: string;
  statusCode: number;
  ipAddress: string;
  userAgent: string;
  details: Record<string, unknown>;
  duration: number; // ms
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    userEmail: { type: String, default: 'anonymous' },
    userRole: { type: String, default: 'unknown' },
    action: { type: String, required: true, index: true },
    resource: { type: String, required: true, index: true },
    resourceId: { type: String, default: null },
    method: { type: String, required: true },
    path: { type: String, required: true },
    statusCode: { type: Number, required: true },
    ipAddress: { type: String, default: 'unknown' },
    userAgent: { type: String, default: '' },
    details: { type: Schema.Types.Mixed, default: {} },
    duration: { type: Number, default: 0 },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    // Audit logs are immutable — no updates or deletes
    strict: true,
  },
);

// TTL index: auto-delete logs older than 90 days
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
