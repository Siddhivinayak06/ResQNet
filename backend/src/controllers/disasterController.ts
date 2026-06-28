import type { Request, Response, NextFunction } from 'express';
import { Disaster } from '../models/index.js';
import { createGeoPoint } from '../utils/geo.js';
import { AppError } from '../middleware/errorHandler.js';

export const createDisaster = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { type, name, description, severity, latitude, longitude, radius, affectedPopulation } = req.body;
    const disaster = await Disaster.create({
      type,
      name,
      description,
      severity: severity || 'moderate',
      location: latitude && longitude ? createGeoPoint(latitude, longitude) : undefined,
      radius: radius || 5,
      affectedPopulation: affectedPopulation || 0,
      status: 'active',
    });
    res.status(201).json({ success: true, data: disaster });
  } catch (error) {
    next(error);
  }
};

export const getDisasters = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, type, severity } = req.query;
    let filter: Record<string, unknown> = {};

    if (status) filter.status = status;
    if (type) filter.type = type;
    if (severity) filter.severity = severity;

    const disasters = await Disaster.find(filter).sort('-createdAt');
    res.status(200).json({ success: true, count: disasters.length, data: disasters });
  } catch (error) {
    next(error);
  }
};

export const getDisasterById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const disaster = await Disaster.findById(req.params.id);
    if (!disaster) throw new AppError('Disaster not found', 404, 'DISASTER_NOT_FOUND');
    res.status(200).json({ success: true, data: disaster });
  } catch (error) {
    next(error);
  }
};

export const updateDisaster = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const disaster = await Disaster.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!disaster) throw new AppError('Disaster not found', 404, 'DISASTER_NOT_FOUND');
    res.status(200).json({ success: true, data: disaster });
  } catch (error) {
    next(error);
  }
};
