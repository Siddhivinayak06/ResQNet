import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { getAllReports, createReport, updateReport, initializeDatabase } from '@/lib/database';
import { EmergencyReport } from '@/lib/auth-types';

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

    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reports = getAllReports();
    const filteredReports =
      decoded.role === 'citizen'
        ? reports.filter(r => r.reportedBy === decoded.userId)
        : decoded.role === 'responder'
          ? reports.filter(r => r.status !== 'resolved' || r.assignedTo === decoded.userId)
          : reports;

    return NextResponse.json(filteredReports);
  } catch (error) {
    console.error('Get reports error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    const decoded = token ? verifyToken(token) : null;

    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { description, latitude, longitude, severity, photo } = body;

    if (!description || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: 'Description and location are required' },
        { status: 400 }
      );
    }

    const report: EmergencyReport = {
      id: `report-${Date.now()}`,
      description,
      latitude,
      longitude,
      timestamp: new Date().toISOString(),
      severity: severity || 'medium',
      status: 'open',
      reportedBy: decoded.userId,
      photo: photo || undefined,
    };

    const createdReport = createReport(report);
    return NextResponse.json(createdReport, { status: 201 });
  } catch (error) {
    console.error('Create report error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
