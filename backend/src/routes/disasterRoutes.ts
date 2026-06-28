import { Router } from 'express';
import { createDisaster, getDisasters, getDisasterById, updateDisaster } from '../controllers/disasterController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.route('/')
  .post(protect, authorize('admin'), createDisaster)
  .get(protect, getDisasters);

router.route('/:id')
  .get(protect, getDisasterById)
  .patch(protect, authorize('admin'), updateDisaster);

export default router;
