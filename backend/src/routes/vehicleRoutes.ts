import { Router } from 'express';
import { createVehicle, getVehicles, getVehicleById, updateVehicleLocation } from '../controllers/vehicleController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.route('/')
  .post(protect, authorize('admin', 'hospital'), createVehicle)
  .get(protect, getVehicles);

router.route('/:id')
  .get(protect, getVehicleById)
  .patch(protect, updateVehicleLocation);

export default router;
