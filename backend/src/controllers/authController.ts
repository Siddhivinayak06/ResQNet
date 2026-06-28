// ─────────────────────────────────────────────────────────────
// ResQNet — Auth Controller
// Handles registration, login, token refresh, logout,
// profile retrieval, and password management.
// ─────────────────────────────────────────────────────────────

import type { Request, Response, NextFunction } from 'express';
import { User } from '../models/index.js';
import { generateTokenPair, storeRefreshToken, verifyRefreshToken, blacklistToken } from '../utils/tokenManager.js';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../config/logger.js';
import type { AuthenticatedRequest } from '../types/index.js';

/**
 * @desc    Register a new user
 * @route   POST /api/v1/auth/register
 */
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password, role, phoneNumber } = req.body;

    // Check for existing user
    const existing = await User.findOne({ email });
    if (existing) {
      throw new AppError('An account with this email already exists', 409, 'AUTH_EMAIL_EXISTS');
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'citizen',
      phoneNumber: phoneNumber || null,
    });

    // Generate tokens
    const tokens = generateTokenPair({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    // Store refresh token
    await storeRefreshToken(user._id.toString(), tokens.refreshToken);

    logger.info(`New user registered: ${email} (${role || 'citizen'})`);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: user.toJSON(),
        ...tokens,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login user and return tokens
 * @route   POST /api/v1/auth/login
 */
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user with password field
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      throw new AppError('Invalid email or password', 401, 'AUTH_INVALID_CREDENTIALS');
    }

    // Check account lock
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new AppError(
        `Account locked. Try again in ${minutesLeft} minutes.`,
        423,
        'AUTH_ACCOUNT_LOCKED',
      );
    }

    if (!user.isActive) {
      throw new AppError('Account has been deactivated', 403, 'AUTH_ACCOUNT_DISABLED');
    }

    // Verify password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      // Increment failed attempts
      user.loginAttempts = (user.loginAttempts || 0) + 1;

      // Lock after 5 failed attempts for 15 minutes
      if (user.loginAttempts >= 5) {
        user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
        user.loginAttempts = 0;
      }

      await user.save();
      throw new AppError('Invalid email or password', 401, 'AUTH_INVALID_CREDENTIALS');
    }

    // Reset failed attempts on successful login
    user.loginAttempts = 0;
    user.lockedUntil = null;
    user.lastLoginAt = new Date();
    await user.save();

    // Generate tokens
    const tokens = generateTokenPair({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    await storeRefreshToken(user._id.toString(), tokens.refreshToken);

    logger.info(`User logged in: ${email}`);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.toJSON(),
        ...tokens,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Refresh access token
 * @route   POST /api/v1/auth/refresh
 */
export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    const userId = await verifyRefreshToken(refreshToken);
    if (!userId) {
      throw new AppError('Invalid or expired refresh token', 401, 'AUTH_INVALID_REFRESH');
    }

    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      throw new AppError('User not found or inactive', 401, 'AUTH_USER_INVALID');
    }

    // Generate new token pair (rotation)
    const tokens = generateTokenPair({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    await storeRefreshToken(user._id.toString(), tokens.refreshToken);

    res.status(200).json({
      success: true,
      data: tokens,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout user (blacklist access token)
 * @route   POST /api/v1/auth/logout
 */
export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      await blacklistToken(token);
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/v1/auth/profile
 */
export const getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = (req as AuthenticatedRequest).user;

    const user = await User.findById(id).populate('medicalProfileId');
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user profile
 * @route   PATCH /api/v1/auth/profile
 */
export const updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = (req as AuthenticatedRequest).user;
    const { name, phoneNumber, avatar, emergencyContacts } = req.body;

    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = name;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (emergencyContacts) updateData.emergencyContacts = emergencyContacts;

    const user = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
