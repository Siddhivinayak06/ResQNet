// ─────────────────────────────────────────────────────────────
// ResQNet — Route Index (v1)
// Central router that mounts all domain routes under /api/v1.
// ─────────────────────────────────────────────────────────────

import { Router } from 'express';
import authRoutes from './authRoutes.js';
import incidentRoutes from './incidentRoutes.js';
import hospitalRoutes from './hospitalRoutes.js';
import volunteerRoutes from './volunteerRoutes.js';
import vehicleRoutes from './vehicleRoutes.js';
import resourceRoutes from './resourceRoutes.js';
import disasterRoutes from './disasterRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import adminRoutes from './adminRoutes.js';
import civicIssueRoutes from './civicIssueRoutes.js';
import departmentRoutes from './departmentRoutes.js';
const router = Router();

// Mount all v1 routes
router.use('/auth', authRoutes);
router.use('/incidents', incidentRoutes);
router.use('/hospitals', hospitalRoutes);
router.use('/volunteers', volunteerRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/resources', resourceRoutes);
router.use('/disasters', disasterRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);
router.use('/civic-issues', civicIssueRoutes);
router.use('/departments', departmentRoutes);

export default router;
