import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for demo purposes (replace with MongoDB in production)
let reports: any[] = [];

// Detect severity from description keywords
function detectSeverity(description: string): 'high' | 'medium' | 'low' {
  const highKeywords = ['fire', 'explosion', 'crash', 'accident', 'critical', 'severe', 'danger'];
  const mediumKeywords = ['injury', 'injury', 'injured', 'bleeding', 'fracture', 'burns'];
  
  const lowerDesc = description.toLowerCase();
  
  if (highKeywords.some(keyword => lowerDesc.includes(keyword))) {
    return 'high';
  }
  if (mediumKeywords.some(keyword => lowerDesc.includes(keyword))) {
    return 'medium';
  }
  return 'low';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { description, latitude, longitude, photo } = body;
    
    if (!description || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const newReport = {
      id: Math.random().toString(36).substr(2, 9),
      description,
      latitude,
      longitude,
      timestamp: new Date().toISOString(),
      severity: detectSeverity(description),
      status: 'open',
      photo: photo || null,
    };
    
    reports.push(newReport);
    
    return NextResponse.json(newReport, { status: 201 });
  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json(
      { error: 'Failed to create report' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}
