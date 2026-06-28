// ─────────────────────────────────────────────────────────────
// ResQNet — Hospital Controller
// CRUD operations for hospitals, bed management, blood bank,
// doctor availability, and emergency queue management.
// ─────────────────────────────────────────────────────────────

import type { Request, Response, NextFunction } from 'express';
import { Hospital } from '../models/index.js';
import { createGeoPoint } from '../utils/geo.js';
import { AppError } from '../middleware/errorHandler.js';
import type { AuthenticatedRequest } from '../types/index.js';

/**
 * @desc    Create a new hospital
 * @route   POST /api/v1/hospitals
 */
export const createHospital = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, latitude, longitude, address, phone, email, specializations, beds } = req.body;

    const hospital = await Hospital.create({
      name,
      location: createGeoPoint(latitude, longitude),
      address,
      phone,
      email: email || null,
      specializations: specializations || [],
      beds: beds || { total: 0, available: 0, icu: { total: 0, available: 0 }, ventilator: { total: 0, available: 0 } },
    });

    res.status(201).json({ success: true, data: hospital });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all hospitals (with optional nearby filter)
 * @route   GET /api/v1/hospitals
 */
export const getHospitals = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { latitude, longitude, radius } = req.query;
    let filter: Record<string, unknown> = { isActive: true };

    // Nearby filter
    if (latitude && longitude) {
      filter.location = {
        $near: {
          $geometry: createGeoPoint(Number(latitude), Number(longitude)),
          $maxDistance: (Number(radius) || 10) * 1000,
        },
      };
    }

    const hospitals = await Hospital.find(filter).select('-emergencyQueue');

    res.status(200).json({
      success: true,
      count: hospitals.length,
      data: hospitals,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single hospital
 * @route   GET /api/v1/hospitals/:id
 */
export const getHospitalById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) {
      throw new AppError('Hospital not found', 404, 'HOSPITAL_NOT_FOUND');
    }
    res.status(200).json({ success: true, data: hospital });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update bed availability
 * @route   PATCH /api/v1/hospitals/:id/beds
 */
export const updateBeds = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const updateData: Record<string, unknown> = {};
    const { total, available, icu, ventilator } = req.body;

    if (total !== undefined) updateData['beds.total'] = total;
    if (available !== undefined) updateData['beds.available'] = available;
    if (icu) {
      if (icu.total !== undefined) updateData['beds.icu.total'] = icu.total;
      if (icu.available !== undefined) updateData['beds.icu.available'] = icu.available;
    }
    if (ventilator) {
      if (ventilator.total !== undefined) updateData['beds.ventilator.total'] = ventilator.total;
      if (ventilator.available !== undefined) updateData['beds.ventilator.available'] = ventilator.available;
    }

    const hospital = await Hospital.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true },
    );

    if (!hospital) {
      throw new AppError('Hospital not found', 404, 'HOSPITAL_NOT_FOUND');
    }

    res.status(200).json({ success: true, data: hospital });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update blood bank inventory
 * @route   PATCH /api/v1/hospitals/:id/blood
 */
export const updateBloodBank = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const updateData: Record<string, unknown> = {};

    for (const [group, units] of Object.entries(req.body)) {
      if (['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].includes(group)) {
        updateData[`bloodBank.${group}`] = units;
      }
    }

    const hospital = await Hospital.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true },
    );

    if (!hospital) {
      throw new AppError('Hospital not found', 404, 'HOSPITAL_NOT_FOUND');
    }

    res.status(200).json({ success: true, data: hospital.bloodBank });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add to emergency queue
 * @route   POST /api/v1/hospitals/:id/queue
 */
export const addToQueue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { incidentId, patientName, severity, estimatedArrival } = req.body;

    const hospital = await Hospital.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          emergencyQueue: {
            incidentId,
            patientName: patientName || 'Unknown',
            severity: severity || 'medium',
            estimatedArrival: estimatedArrival || null,
            status: 'incoming',
          },
        },
      },
      { new: true },
    );

    if (!hospital) {
      throw new AppError('Hospital not found', 404, 'HOSPITAL_NOT_FOUND');
    }

    res.status(200).json({ success: true, data: hospital.emergencyQueue });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get hospital statistics
 * @route   GET /api/v1/hospitals/stats
 */
export const getHospitalStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const stats = await Hospital.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalHospitals: { $sum: 1 },
          totalBeds: { $sum: '$beds.total' },
          availableBeds: { $sum: '$beds.available' },
          totalICU: { $sum: '$beds.icu.total' },
          availableICU: { $sum: '$beds.icu.available' },
          acceptingEmergencies: { $sum: { $cond: ['$isAcceptingEmergencies', 1, 0] } },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: stats[0] || {
        totalHospitals: 0,
        totalBeds: 0,
        availableBeds: 0,
        totalICU: 0,
        availableICU: 0,
        acceptingEmergencies: 0,
      },
    });
  } catch (error) {
    next(error);
  }
};
