import express from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { ResponderProfile } from '../models/ResponderProfile.js';
import { HospitalProfile } from '../models/HospitalProfile.js';
import { signAuthToken } from '../utils/jwt.js';

const router = express.Router();

const validRoles = ['citizen', 'responder', 'hospital', 'admin'];

function getCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000,
  };
}

router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role, phone, location } = req.body;

    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role selected' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      role,
      phone: phone || null,
      location: location || null,
      isActive: true,
    });

    if (role === 'responder') {
      await ResponderProfile.create({
        userId: user._id,
        location: location || 'Unassigned Zone',
      });
    }

    if (role === 'hospital') {
      const hospitalProfile = await HospitalProfile.create({
        userId: user._id,
        name,
        phone: phone || 'N/A',
        address: 'Address not set',
      });

      user.hospitalId = hospitalProfile._id.toString();
      await user.save();
    }

    const token = signAuthToken(user);
    const safeUser = user.toSafeObject();

    res.cookie('auth_token', token, getCookieOptions());

    return res.status(201).json({
      token,
      user: safeUser,
    });
  } catch (error) {
    console.error('Register route error:', error);
    return res.status(500).json({ error: 'Failed to register user' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'User account is inactive' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signAuthToken(user);
    const safeUser = user.toSafeObject();

    res.cookie('auth_token', token, getCookieOptions());

    return res.json({
      token,
      user: safeUser,
    });
  } catch (error) {
    console.error('Login route error:', error);
    return res.status(500).json({ error: 'Failed to log in' });
  }
});

router.post('/logout', async (req, res) => {
  res.cookie('auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
  });

  return res.json({ success: true });
});

export default router;
