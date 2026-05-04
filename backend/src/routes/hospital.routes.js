import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { HospitalProfile } from '../models/HospitalProfile.js';

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const hospitals = await HospitalProfile.find().populate('userId', 'email');

    const response = hospitals.map((hospital) => ({
      id: hospital._id.toString(),
      userId: hospital.userId?._id?.toString() || hospital.userId?.toString(),
      name: hospital.name,
      email: hospital.userId?.email || null,
      phone: hospital.phone,
      address: hospital.address,
      latitude: hospital.latitude,
      longitude: hospital.longitude,
      emergencyCapacity: hospital.emergencyCapacity,
      currentPatients: hospital.currentPatients,
      specializations: hospital.specializations,
      createdAt: hospital.createdAt,
    }));

    return res.json(response);
  } catch (error) {
    console.error('Get hospitals route error:', error);
    return res.status(500).json({ error: 'Failed to fetch hospitals' });
  }
});

export default router;
