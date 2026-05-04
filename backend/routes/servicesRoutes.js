import express from 'express';
import { getNearbyServices } from '../controllers/servicesController.js';
import rateLimiter from '../middleware/rateLimiter.js';

const router = express.Router();

// Rate limit: max 30 requests per minute per IP
const servicesLimiter = rateLimiter({
  windowMs: 60 * 1000,
  maxHits: 30,
  message: 'Too many service lookups. Please try again shortly.',
});

router.get('/nearby', servicesLimiter, getNearbyServices);

export default router;
