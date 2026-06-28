// ─────────────────────────────────────────────────────────────
// ResQNet — ChatMessage Model
// Stores real-time messages between users within incident
// contexts. Supports text, voice notes, and media.
// ─────────────────────────────────────────────────────────────

import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface IChatMessage extends Document {
  _id: Types.ObjectId;
  incidentId: Types.ObjectId;
  senderId: Types.ObjectId;
  receiverId: Types.ObjectId | null; // null = group message
  roomId: string;

  // Content
  content: string;
  type: 'text' | 'image' | 'audio' | 'video' | 'location' | 'system';
  mediaUrl: string | null;

  // Status
  status: 'sent' | 'delivered' | 'read';
  deliveredAt: Date | null;
  readAt: Date | null;

  // Metadata
  replyTo: Types.ObjectId | null;
  isEdited: boolean;
  isDeleted: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const chatMessageSchema = new Schema<IChatMessage>(
  {
    incidentId: {
      type: Schema.Types.ObjectId,
      ref: 'Incident',
      required: true,
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    roomId: {
      type: String,
      required: true,
      index: true,
    },

    content: { type: String, required: true, maxlength: 5000 },
    type: {
      type: String,
      enum: ['text', 'image', 'audio', 'video', 'location', 'system'],
      default: 'text',
    },
    mediaUrl: { type: String, default: null },

    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent',
    },
    deliveredAt: { type: Date, default: null },
    readAt: { type: Date, default: null },

    replyTo: { type: Schema.Types.ObjectId, ref: 'ChatMessage', default: null },
    isEdited: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Index for fetching chat history efficiently
chatMessageSchema.index({ roomId: 1, createdAt: -1 });
chatMessageSchema.index({ incidentId: 1, createdAt: -1 });

export const ChatMessage = mongoose.model<IChatMessage>('ChatMessage', chatMessageSchema);
