// ─────────────────────────────────────────────────────────────
// ResQNet — Auth Routes
// ─────────────────────────────────────────────────────────────

import { Router } from 'express';
import { register, login, refresh, logout, getProfile, updateProfile } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import { registerSchema, loginSchema, refreshTokenSchema } from '../utils/schemas.js';

const router = Router();

// Public routes (rate limited)
router.post('/register', authRateLimiter, validate({ body: registerSchema }), register);
router.post('/login', authRateLimiter, validate({ body: loginSchema }), login);
router.post('/refresh', validate({ body: refreshTokenSchema }), refresh);

// Protected routes
router.post('/logout', protect, logout);
router.get('/profile', protect, getProfile);
router.patch('/profile', protect, updateProfile);

export default router;
