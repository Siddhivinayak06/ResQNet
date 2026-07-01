import { Router } from 'express';
import {
  createCivicIssue,
  getAllCivicIssues,
  getCivicIssueById,
  updateCivicIssueStatus,
  upvoteCivicIssue,
  addComment,
} from '../controllers/civicIssueController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validator.js';
import {
  createCivicIssueSchema,
  updateCivicIssueStatusSchema,
  idParamSchema,
} from '../utils/schemas.js';

const router = Router();

// Public routes
router.get('/', getAllCivicIssues);
router.get('/:id', validate({ params: idParamSchema }), getCivicIssueById);

// Protected routes (Citizens)
router.post('/', protect, validate({ body: createCivicIssueSchema }), createCivicIssue);
router.post('/:id/upvote', protect, validate({ params: idParamSchema }), upvoteCivicIssue);
router.post('/:id/comments', protect, validate({ params: idParamSchema }), addComment);

// Admin/Official routes
router.patch(
  '/:id/status',
  protect,
  authorize('department_admin', 'super_admin'),
  validate({ params: idParamSchema, body: updateCivicIssueStatusSchema }),
  updateCivicIssueStatus
);

export default router;
