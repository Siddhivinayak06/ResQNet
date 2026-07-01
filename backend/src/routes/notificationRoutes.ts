import { Router } from 'express';
import { createNotification, getUserNotifications, markAsRead, markAllAsRead } from '../controllers/notificationController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.route('/')
  .post(authorize('department_admin', 'super_admin'), createNotification)
  .get(getUserNotifications);

router.patch('/read-all', markAllAsRead);

router.route('/:id/read')
  .patch(markAsRead);

export default router;
