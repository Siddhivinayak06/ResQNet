// ─────────────────────────────────────────────────────────────
// ResQNet — Hospital Routes
// ─────────────────────────────────────────────────────────────

import { Router } from 'express';
import {
  createHospital,
  getHospitals,
  getHospitalById,
  updateBeds,
  updateBloodBank,
  addToQueue,
  getHospitalStats,
} from '../controllers/hospitalController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validator.js';
import { createHospitalSchema, updateBedsSchema, idParamSchema } from '../utils/schemas.js';

const router = Router();

// Public routes
router.get('/stats', getHospitalStats);
router.get('/', getHospitals);
router.get('/:id', validate({ params: idParamSchema }), getHospitalById);

// Admin-only creation
router.post(
  '/',
  protect,
  authorize('admin', 'super_admin'),
  validate({ body: createHospitalSchema }),
  createHospital,
);

// Hospital admin routes
router.patch(
  '/:id/beds',
  protect,
  authorize('hospital_admin', 'admin', 'super_admin'),
  validate({ params: idParamSchema, body: updateBedsSchema }),
  updateBeds,
);

router.patch(
  '/:id/blood',
  protect,
  authorize('hospital_admin', 'admin', 'super_admin'),
  validate({ params: idParamSchema }),
  updateBloodBank,
);

router.post(
  '/:id/queue',
  protect,
  authorize('hospital_admin', 'responder', 'admin', 'super_admin'),
  validate({ params: idParamSchema }),
  addToQueue,
);

export default router;
