import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByEmail, initializeDatabase } from '@/lib/database';
import { createToken } from '@/lib/jwt';
import { User, UserRole } from '@/lib/auth-types';
import { v4 as uuidv4 } from 'crypto';

initializeDatabase();

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role } = await request.json();

    if (!email || !password || !name || !role) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (!['user', 'volunteer', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const existingUser = getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }

    // Simple ID generation (replace with crypto in production)
    const id = `${role}-${Date.now()}`;

    const newUser: User = {
      id,
      email,
      password, // In production: hash with bcrypt
      name,
      role: role as UserRole,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const user = createUser(newUser);
    const token = createToken(user);
    const { password: _, ...userWithoutPassword } = user;

    const response = NextResponse.json({
      token,
      user: userWithoutPassword,
    });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
