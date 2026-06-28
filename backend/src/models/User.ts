// ─────────────────────────────────────────────────────────────
// ResQNet — User Model
// Supports all platform roles: citizen, responder, volunteer,
// admin, hospital/police/fire admins, super admin.
// Includes OAuth, 2FA, device registration, and medical profile.
// ─────────────────────────────────────────────────────────────

import mongoose, { Schema, type Document, type Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import type { UserRole, DeviceInfo, TwoFactorConfig, EmergencyContact } from '../types/index.js';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phoneNumber: string | null;
  avatar: string | null;

  // OAuth
  oauthProvider: 'google' | 'apple' | null;
  oauthId: string | null;

  // Security
  twoFactor: TwoFactorConfig;
  devices: DeviceInfo[];
  refreshTokens: string[];
  lastLoginAt: Date | null;
  loginAttempts: number;
  lockedUntil: Date | null;

  // Profile
  emergencyContacts: EmergencyContact[];
  medicalProfileId: Types.ObjectId | null;

  // Status
  isActive: boolean;
  isVerified: boolean;

  // Timestamps (from Mongoose)
  createdAt: Date;
  updatedAt: Date;

  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  toSafeJSON(): Record<string, unknown>;
}

const emergencyContactSchema = new Schema<EmergencyContact>(
  {
    name: { type: String, required: true, trim: true },
    relationship: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    isPrimary: { type: Boolean, default: false },
  },
  { _id: false },
);

const deviceInfoSchema = new Schema<DeviceInfo>(
  {
    deviceId: { type: String, required: true },
    platform: { type: String, enum: ['ios', 'android', 'web'], required: true },
    pushToken: { type: String, default: null },
    lastActive: { type: Date, default: Date.now },
  },
  { _id: false },
);

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name must not exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Invalid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Never returned by default
    },
    role: {
      type: String,
      enum: ['citizen', 'responder', 'volunteer', 'admin', 'hospital_admin', 'police_admin', 'fire_admin', 'super_admin'],
      default: 'citizen',
      index: true,
    },
    phoneNumber: { type: String, trim: true, default: null },
    avatar: { type: String, default: null },

    // OAuth
    oauthProvider: { type: String, enum: ['google', 'apple', null], default: null },
    oauthId: { type: String, default: null },

    // Security
    twoFactor: {
      enabled: { type: Boolean, default: false },
      secret: { type: String, default: null, select: false },
      backupCodes: { type: [String], default: [], select: false },
    },
    devices: { type: [deviceInfoSchema], default: [] },
    refreshTokens: { type: [String], default: [], select: false },
    lastLoginAt: { type: Date, default: null },
    loginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },

    // Profile
    emergencyContacts: { type: [emergencyContactSchema], default: [] },
    medicalProfileId: { type: Schema.Types.ObjectId, ref: 'MedicalProfile', default: null },

    // Status
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        Reflect.deleteProperty(ret, 'password');
        Reflect.deleteProperty(ret, '__v');
        Reflect.deleteProperty(ret, 'refreshTokens');
        if (ret.twoFactor) {
          Reflect.deleteProperty(ret.twoFactor, 'secret');
          Reflect.deleteProperty(ret.twoFactor, 'backupCodes');
        }
        return ret;
      },
    },
  },
);

// ─── Indexes ─────────────────────────────────────────────────

userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ oauthProvider: 1, oauthId: 1 });

// ─── Pre-save: hash password ────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ─── Instance methods ────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toSafeJSON = function (): Record<string, unknown> {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  delete obj.refreshTokens;
  return obj;
};

export const User = mongoose.model<IUser>('User', userSchema);
