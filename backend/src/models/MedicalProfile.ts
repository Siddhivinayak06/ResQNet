// ─────────────────────────────────────────────────────────────
// ResQNet — MedicalProfile Model
// Stores citizen health data for emergency responders —
// blood group, allergies, medical history, insurance, etc.
// ─────────────────────────────────────────────────────────────

import mongoose, { Schema, type Document, type Types } from 'mongoose';
import type { BloodGroup, MedicalRecord, InsuranceInfo } from '../types/index.js';

export interface IMedicalProfile extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;

  // Vitals
  bloodGroup: BloodGroup | null;
  height: number | null;    // cm
  weight: number | null;    // kg
  dateOfBirth: Date | null;
  gender: 'male' | 'female' | 'other' | null;

  // Medical data
  allergies: string[];
  medications: string[];
  medicalHistory: MedicalRecord[];
  chronicConditions: string[];
  disabilities: string[];

  // Insurance
  insurance: InsuranceInfo | null;

  // Emergency preferences
  organDonor: boolean;
  dnr: boolean; // Do Not Resuscitate
  specialInstructions: string;

  // Digital ID
  qrCodeData: string | null;

  createdAt: Date;
  updatedAt: Date;
}

const medicalRecordSchema = new Schema(
  {
    condition: { type: String, required: true },
    diagnosedAt: { type: Date, required: true },
    notes: { type: String, default: '' },
  },
  { _id: true },
);

const insuranceSchema = new Schema(
  {
    provider: { type: String, required: true },
    policyNumber: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { _id: false },
);

const medicalProfileSchema = new Schema<IMedicalProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },

    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', null],
      default: null,
    },
    height: { type: Number, default: null, min: 0 },
    weight: { type: Number, default: null, min: 0 },
    dateOfBirth: { type: Date, default: null },
    gender: { type: String, enum: ['male', 'female', 'other', null], default: null },

    allergies: { type: [String], default: [] },
    medications: { type: [String], default: [] },
    medicalHistory: { type: [medicalRecordSchema], default: [] },
    chronicConditions: { type: [String], default: [] },
    disabilities: { type: [String], default: [] },

    insurance: { type: insuranceSchema, default: null },

    organDonor: { type: Boolean, default: false },
    dnr: { type: Boolean, default: false },
    specialInstructions: { type: String, default: '', maxlength: 1000 },

    qrCodeData: { type: String, default: null },
  },
  { timestamps: true },
);

export const MedicalProfile = mongoose.model<IMedicalProfile>('MedicalProfile', medicalProfileSchema);
