import express from 'express';
import {
  createIncident,
  getAllIncidents,
  getIncidentById,
  updateIncidentStatus,
  deleteIncident,
} from '../controllers/incidentController.js';
import { validateIncident, validateStatusUpdate } from '../middleware/validate.js';
import { protect } from '../middleware/auth.js';
import rateLimiter from '../middleware/rateLimiter.js';

// Rate limit: max 5 incident reports per minute per IP
const incidentCreateLimiter = rateLimiter({
  windowMs: 60 * 1000,
  maxHits: 5,
  message: 'Too many incident reports. Please wait before submitting again.',
});

const router = express.Router();

router.route('/')
  .post(protect, incidentCreateLimiter, validateIncident, createIncident)
  .get(getAllIncidents);

router.route('/:id')
  .get(getIncidentById)
  .patch(protect, validateStatusUpdate, updateIncidentStatus)
  .delete(protect, deleteIncident);

export default router;
