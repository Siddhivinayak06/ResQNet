// ─────────────────────────────────────────────────────────────
// ResQNet — Incident Routes
// ─────────────────────────────────────────────────────────────

import { Router } from 'express';
import {
  createIncident,
  getIncidents,
  getIncidentById,
  updateIncidentStatus,
  assignIncident,
  getNearbyIncidents,
  getIncidentStats,
  deleteIncident,
} from '../controllers/incidentController.js';
import { protect, optionalAuth } from '../middleware/auth.js';
import { authorize, requirePermission } from '../middleware/rbac.js';
import { validate } from '../middleware/validator.js';
import {
  createIncidentSchema,
  updateIncidentStatusSchema,
  assignIncidentSchema,
  nearbyQuerySchema,
  paginationQuerySchema,
  idParamSchema,
} from '../utils/schemas.js';

const router = Router();

// Public/semi-public routes
router.get('/stats', getIncidentStats);
router.get('/nearby', validate({ query: nearbyQuerySchema }), getNearbyIncidents);
router.get('/', validate({ query: paginationQuerySchema }), getIncidents);
router.get('/:id', validate({ params: idParamSchema }), getIncidentById);

// Protected routes
router.post('/', optionalAuth, validate({ body: createIncidentSchema }), createIncident);

// Admin/responder routes
router.patch(
  '/:id/status',
  protect,
  authorize('admin', 'super_admin', 'responder', 'police_admin', 'fire_admin'),
  validate({ params: idParamSchema, body: updateIncidentStatusSchema }),
  updateIncidentStatus,
);

router.post(
  '/:id/assign',
  protect,
  requirePermission('incident:assign'),
  validate({ params: idParamSchema, body: assignIncidentSchema }),
  assignIncident,
);

router.delete(
  '/:id',
  protect,
  authorize('admin', 'super_admin'),
  validate({ params: idParamSchema }),
  deleteIncident,
);

export default router;
