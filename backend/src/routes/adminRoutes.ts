import { Router } from 'express';
import { getSystemStats } from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.use(protect);
router.use(authorize('super_admin'));

router.get('/stats', getSystemStats);

export default router;
