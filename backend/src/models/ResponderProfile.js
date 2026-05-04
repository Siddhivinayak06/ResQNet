import mongoose from 'mongoose';

const { Schema } = mongoose;

const responderProfileSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    location: {
      type: String,
      default: 'Unassigned Zone',
    },
    latitude: {
      type: Number,
      default: 0,
    },
    longitude: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['available', 'busy', 'offline'],
      default: 'available',
      index: true,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const ResponderProfile =
  mongoose.models.ResponderProfile || mongoose.model('ResponderProfile', responderProfileSchema);
