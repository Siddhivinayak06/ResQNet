import { AuthToken, User } from './auth-types';

const SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Simple JWT-like implementation (for demo purposes)
// In production, use jsonwebtoken library with proper signing

export function createToken(user: User): string {
  const token: AuthToken = {
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
  };

  // Simple base64 encoding (NOT secure - for demo only)
  return Buffer.from(JSON.stringify(token)).toString('base64');
}

export function verifyToken(token: string): AuthToken | null {
  try {
    // Simple base64 decoding (NOT secure - for demo only)
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const payload: AuthToken = JSON.parse(decoded);

    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Token expired
    }

    return payload;
  } catch (error) {
    return null;
  }
}

export function extractTokenFromCookie(cookieString: string | undefined): string | null {
  if (!cookieString) return null;

  const cookies = cookieString.split(';').map(c => c.trim());
  const authCookie = cookies.find(c => c.startsWith('auth_token='));

  if (authCookie) {
    return authCookie.split('=')[1];
  }

  return null;
}
