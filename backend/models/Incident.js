import mongoose from 'mongoose';

const incidentSchema = new mongoose.Schema(
  {
    incidentType: {
      type: String,
      required: [true, 'Incident type is required'],
      enum: {
        values: ['accident', 'fire', 'medical', 'disaster'],
        message: '{VALUE} is not a valid incident type. Must be one of: accident, fire, medical, disaster',
      },
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters long'],
      maxlength: [2000, 'Description must not exceed 2000 characters'],
    },
    latitude: {
      type: Number,
      required: [true, 'Latitude is required'],
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90'],
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required'],
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180'],
    },
    imageUrl: {
      type: String,
      default: null,
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'active', 'resolved'],
        message: '{VALUE} is not a valid status. Must be one of: pending, active, resolved',
      },
      default: 'pending',
      index: true,
    },
    reportedAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
    reporterId: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for common query patterns
incidentSchema.index({ incidentType: 1, status: 1 });
incidentSchema.index({ reportedAt: -1 });

const Incident = mongoose.model('Incident', incidentSchema);

export default Incident;
