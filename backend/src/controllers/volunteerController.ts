import type { Request, Response, NextFunction } from 'express';
import { Volunteer } from '../models/index.js';
import { createGeoPoint } from '../utils/geo.js';
import { AppError } from '../middleware/errorHandler.js';

export const createVolunteer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId, skills, availability, latitude, longitude } = req.body;
    const volunteer = await Volunteer.create({
      userId,
      skills: skills || [],
      availability: availability || {},
      currentLocation: latitude && longitude ? createGeoPoint(latitude, longitude) : undefined,
    });
    res.status(201).json({ success: true, data: volunteer });
  } catch (error) {
    next(error);
  }
};

export const getVolunteers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { latitude, longitude, radius, status } = req.query;
    let filter: Record<string, unknown> = {};

    if (status) filter.status = status;
    if (latitude && longitude) {
      filter.currentLocation = {
        $near: {
          $geometry: createGeoPoint(Number(latitude), Number(longitude)),
          $maxDistance: (Number(radius) || 10) * 1000,
        },
      };
    }

    const volunteers = await Volunteer.find(filter).populate('userId', 'name phone email');
    res.status(200).json({ success: true, count: volunteers.length, data: volunteers });
  } catch (error) {
    next(error);
  }
};

export const getVolunteerById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const volunteer = await Volunteer.findById(req.params.id).populate('userId', 'name phone email');
    if (!volunteer) throw new AppError('Volunteer not found', 404, 'VOLUNTEER_NOT_FOUND');
    res.status(200).json({ success: true, data: volunteer });
  } catch (error) {
    next(error);
  }
};

export const updateVolunteerStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, latitude, longitude } = req.body;
    let updateData: any = { status };
    if (latitude && longitude) updateData.currentLocation = createGeoPoint(latitude, longitude);

    const volunteer = await Volunteer.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!volunteer) throw new AppError('Volunteer not found', 404, 'VOLUNTEER_NOT_FOUND');
    res.status(200).json({ success: true, data: volunteer });
  } catch (error) {
    next(error);
  }
};
