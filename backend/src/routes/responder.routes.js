import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/authorizeRoles.js';
import { ResponderProfile } from '../models/ResponderProfile.js';
import { emitToRoles } from '../services/socket.js';

const router = express.Router();

router.get('/', authenticate, authorizeRoles('admin', 'hospital', 'responder'), async (req, res) => {
  try {
    const responderProfiles = await ResponderProfile.find().populate('userId', 'name role');

    const responders = responderProfiles.map((profile) => ({
      id: profile.userId?._id?.toString() || profile.userId?.toString(),
      name: profile.userId?.name || 'Responder',
      role: 'responder',
      location: profile.location,
      latitude: profile.latitude,
      longitude: profile.longitude,
      status: profile.status,
      lastUpdated: profile.lastUpdated,
    }));

    return res.json(responders);
  } catch (error) {
    console.error('Get responders route error:', error);
    return res.status(500).json({ error: 'Failed to fetch responders' });
  }
});

router.patch('/me/status', authenticate, authorizeRoles('responder'), async (req, res) => {
  try {
    const { status, latitude, longitude, location } = req.body;

    const updatedProfile = await ResponderProfile.findOneAndUpdate(
      { userId: req.user.id },
      {
        ...(status ? { status } : {}),
        ...(latitude !== undefined ? { latitude: Number(latitude) } : {}),
        ...(longitude !== undefined ? { longitude: Number(longitude) } : {}),
        ...(location ? { location } : {}),
        lastUpdated: new Date(),
      },
      {
        new: true,
        upsert: true,
      }
    ).populate('userId', 'name role');

    const payload = {
      id: updatedProfile.userId?._id?.toString() || updatedProfile.userId?.toString(),
      name: updatedProfile.userId?.name || req.user.name,
      role: 'responder',
      location: updatedProfile.location,
      latitude: updatedProfile.latitude,
      longitude: updatedProfile.longitude,
      status: updatedProfile.status,
      lastUpdated: updatedProfile.lastUpdated,
    };

    emitToRoles('responder:updated', payload, ['admin', 'hospital', 'responder']);

    return res.json(payload);
  } catch (error) {
    console.error('Update responder status route error:', error);
    return res.status(500).json({ error: 'Failed to update responder status' });
  }
});

export default router;
