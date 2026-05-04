import express from 'express';
import { uploadIncidentImage, uploadAndAttachImage } from '../controllers/uploadController.js';
import { uploadImage } from '../middleware/uploadMiddleware.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Upload an image (returns URL for use when creating an incident)
router.post('/upload', protect, uploadImage, uploadIncidentImage);

// Upload an image and attach it to an existing incident
router.post('/:id/upload', protect, uploadImage, uploadAndAttachImage);

export default router;
