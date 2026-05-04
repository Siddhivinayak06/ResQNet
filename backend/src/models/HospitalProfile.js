import mongoose from 'mongoose';

const { Schema } = mongoose;

const hospitalProfileSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      default: 'Address not set',
    },
    phone: {
      type: String,
      default: 'N/A',
    },
    latitude: {
      type: Number,
      default: 0,
    },
    longitude: {
      type: Number,
      default: 0,
    },
    emergencyCapacity: {
      type: Number,
      default: 20,
    },
    currentPatients: {
      type: Number,
      default: 0,
    },
    specializations: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const HospitalProfile =
  mongoose.models.HospitalProfile || mongoose.model('HospitalProfile', hospitalProfileSchema);
