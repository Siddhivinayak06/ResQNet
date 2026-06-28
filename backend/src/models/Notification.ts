// ─────────────────────────────────────────────────────────────
// ResQNet — Notification Model
// Multi-channel notification storage. Tracks delivery status
// across push, SMS, email, WhatsApp, Telegram, and in-app.
// ─────────────────────────────────────────────────────────────

import mongoose, { Schema, type Document, type Types } from 'mongoose';
import type { NotificationChannel, NotificationPriority } from '../types/index.js';

export interface INotification extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  body: string;
  type: 'incident' | 'assignment' | 'chat' | 'system' | 'emergency_broadcast' | 'status_update';
  channel: NotificationChannel;
  priority: NotificationPriority;

  // Delivery
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  sentAt: Date | null;
  deliveredAt: Date | null;
  readAt: Date | null;
  failureReason: string | null;

  // Reference
  referenceType: 'incident' | 'chat' | 'disaster' | 'user' | null;
  referenceId: Types.ObjectId | null;

  // Metadata
  data: Record<string, unknown>;
  expiresAt: Date | null;

  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, maxlength: 200 },
    body: { type: String, required: true, maxlength: 1000 },
    type: {
      type: String,
      enum: ['incident', 'assignment', 'chat', 'system', 'emergency_broadcast', 'status_update'],
      required: true,
      index: true,
    },
    channel: {
      type: String,
      enum: ['push', 'sms', 'email', 'whatsapp', 'telegram', 'in_app'],
      default: 'in_app',
    },
    priority: {
      type: String,
      enum: ['critical', 'high', 'normal', 'low'],
      default: 'normal',
    },

    status: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'read', 'failed'],
      default: 'pending',
      index: true,
    },
    sentAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    readAt: { type: Date, default: null },
    failureReason: { type: String, default: null },

    referenceType: { type: String, enum: ['incident', 'chat', 'disaster', 'user', null], default: null },
    referenceId: { type: Schema.Types.ObjectId, default: null },

    data: { type: Schema.Types.Mixed, default: {} },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Fetch user's unread notifications efficiently
notificationSchema.index({ userId: 1, status: 1, createdAt: -1 });
// Auto-expire old notifications
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, sparse: true });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
