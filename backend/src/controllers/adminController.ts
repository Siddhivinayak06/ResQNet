import type { Request, Response, NextFunction } from 'express';
import { User, Incident, Hospital, Volunteer } from '../models/index.js';

export const getSystemStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const totalUsers = await User.countDocuments();
    const totalIncidents = await Incident.countDocuments();
    const activeIncidents = await Incident.countDocuments({ status: { $in: ['pending', 'assigned', 'in-progress'] } });
    const totalHospitals = await Hospital.countDocuments({ isActive: true });
    const activeVolunteers = await Volunteer.countDocuments({ status: 'available' });

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalIncidents,
        activeIncidents,
        totalHospitals,
        activeVolunteers,
      }
    });
  } catch (error) {
    next(error);
  }
};
