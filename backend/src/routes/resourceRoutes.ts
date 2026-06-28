import { Router } from 'express';
import { createResource, getResources, updateResource } from '../controllers/resourceController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.route('/')
  .post(protect, authorize('admin', 'hospital'), createResource)
  .get(protect, getResources);

router.route('/:id')
  .patch(protect, authorize('admin', 'hospital'), updateResource);

export default router;
