import type { Request, Response, NextFunction } from 'express';
import { Vehicle } from '../models/index.js';
import { createGeoPoint } from '../utils/geo.js';
import { AppError } from '../middleware/errorHandler.js';

export const createVehicle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { type, licensePlate, capacity, equipment, hospitalId, latitude, longitude } = req.body;
    const vehicle = await Vehicle.create({
      type,
      licensePlate,
      capacity: capacity || 1,
      equipment: equipment || [],
      hospitalId,
      currentLocation: latitude && longitude ? createGeoPoint(latitude, longitude) : undefined,
    });
    res.status(201).json({ success: true, data: vehicle });
  } catch (error) {
    next(error);
  }
};

export const getVehicles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { latitude, longitude, radius, status, type } = req.query;
    let filter: Record<string, unknown> = {};

    if (status) filter.status = status;
    if (type) filter.type = type;
    if (latitude && longitude) {
      filter.currentLocation = {
        $near: {
          $geometry: createGeoPoint(Number(latitude), Number(longitude)),
          $maxDistance: (Number(radius) || 10) * 1000,
        },
      };
    }

    const vehicles = await Vehicle.find(filter).populate('hospitalId', 'name');
    res.status(200).json({ success: true, count: vehicles.length, data: vehicles });
  } catch (error) {
    next(error);
  }
};

export const getVehicleById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate('hospitalId', 'name');
    if (!vehicle) throw new AppError('Vehicle not found', 404, 'VEHICLE_NOT_FOUND');
    res.status(200).json({ success: true, data: vehicle });
  } catch (error) {
    next(error);
  }
};

export const updateVehicleLocation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { latitude, longitude, status } = req.body;
    let updateData: any = {};
    if (status) updateData.status = status;
    if (latitude && longitude) updateData.currentLocation = createGeoPoint(latitude, longitude);

    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!vehicle) throw new AppError('Vehicle not found', 404, 'VEHICLE_NOT_FOUND');
    res.status(200).json({ success: true, data: vehicle });
  } catch (error) {
    next(error);
  }
};
