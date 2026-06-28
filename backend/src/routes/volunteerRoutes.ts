import { Router } from 'express';
import { createVolunteer, getVolunteers, getVolunteerById, updateVolunteerStatus } from '../controllers/volunteerController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.route('/')
  .post(protect, createVolunteer)
  .get(protect, getVolunteers);

router.route('/:id')
  .get(protect, getVolunteerById)
  .patch(protect, updateVolunteerStatus);

export default router;
