import mongoose from 'mongoose';

const { Schema } = mongoose;

const emergencyReportSchema = new Schema(
  {
    description: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    severity: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium',
      index: true,
    },
    status: {
      type: String,
      enum: ['open', 'assigned', 'in-progress', 'resolved'],
      default: 'open',
      index: true,
    },
    photo: {
      type: String,
      default: null,
    },
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignedToHospital: {
      type: Schema.Types.ObjectId,
      ref: 'HospitalProfile',
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

emergencyReportSchema.index({ location: '2dsphere' });

export const EmergencyReport =
  mongoose.models.EmergencyReport || mongoose.model('EmergencyReport', emergencyReportSchema);
