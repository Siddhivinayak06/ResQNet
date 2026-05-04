import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { getAllResponders, updateResponder, initializeDatabase } from '@/lib/database';

initializeDatabase();

function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  const cookies = request.headers.get('cookie');
  if (cookies) {
    const tokenCookie = cookies.split(';').find(c => c.trim().startsWith('auth_token='));
    if (tokenCookie) {
      return tokenCookie.split('=')[1];
    }
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    const decoded = token ? verifyToken(token) : null;

    if (!decoded || !['admin', 'hospital', 'responder'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const responders = getAllResponders();
    return NextResponse.json(responders);
  } catch (error) {
    console.error('Get responders error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    const decoded = token ? verifyToken(token) : null;

    if (!decoded || decoded.role !== 'responder') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { latitude, longitude, status } = body;

    const updated = updateResponder(decoded.userId, {
      latitude,
      longitude,
      status,
      lastUpdated: new Date().toISOString(),
    });

    if (!updated) {
      return NextResponse.json({ error: 'Responder not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update responder error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
