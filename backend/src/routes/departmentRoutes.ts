import { Router } from 'express';
import {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
} from '../controllers/departmentController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validator.js';
import {
  createDepartmentSchema,
  idParamSchema,
} from '../utils/schemas.js';

const router = Router();

// Public routes
router.get('/', getAllDepartments);
router.get('/:id', validate({ params: idParamSchema }), getDepartmentById);

// Admin-only routes
router.post(
  '/',
  protect,
  authorize('super_admin'),
  validate({ body: createDepartmentSchema }),
  createDepartment
);

export default router;
