import type { Request, Response, NextFunction } from 'express';
import { Resource } from '../models/index.js';
import { createGeoPoint } from '../utils/geo.js';
import { AppError } from '../middleware/errorHandler.js';

export const createResource = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, type, quantity, provider, latitude, longitude } = req.body;
    const resource = await Resource.create({
      name,
      type,
      quantity: quantity || 1,
      provider,
      location: latitude && longitude ? createGeoPoint(latitude, longitude) : undefined,
    });
    res.status(201).json({ success: true, data: resource });
  } catch (error) {
    next(error);
  }
};

export const getResources = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { latitude, longitude, radius, type, status } = req.query;
    let filter: Record<string, unknown> = {};

    if (type) filter.type = type;
    if (status) filter.status = status;
    if (latitude && longitude) {
      filter.location = {
        $near: {
          $geometry: createGeoPoint(Number(latitude), Number(longitude)),
          $maxDistance: (Number(radius) || 10) * 1000,
        },
      };
    }

    const resources = await Resource.find(filter);
    res.status(200).json({ success: true, count: resources.length, data: resources });
  } catch (error) {
    next(error);
  }
};

export const updateResource = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const resource = await Resource.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!resource) throw new AppError('Resource not found', 404, 'RESOURCE_NOT_FOUND');
    res.status(200).json({ success: true, data: resource });
  } catch (error) {
    next(error);
  }
};
