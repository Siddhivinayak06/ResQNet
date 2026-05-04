// Demo data for testing and presentations
// These can be used to pre-populate the dashboard

export const demoReports = [
  {
    id: 'demo-1',
    description: 'Multi-vehicle collision on Highway 101. Traffic backed up for 2 miles. Three vehicles involved.',
    latitude: 37.7749,
    longitude: -122.4194,
    timestamp: new Date(Date.now() - 5 * 60000).toISOString(), // 5 minutes ago
    severity: 'high' as const,
    status: 'open',
  },
  {
    id: 'demo-2',
    description: 'Building fire reported at downtown office complex. Multiple floors affected. Smoke visible from miles away.',
    latitude: 37.7851,
    longitude: -122.3949,
    timestamp: new Date(Date.now() - 12 * 60000).toISOString(), // 12 minutes ago
    severity: 'high' as const,
    status: 'open',
  },
  {
    id: 'demo-3',
    description: 'Person injured after fall from construction site. Conscious but unable to move legs.',
    latitude: 37.7744,
    longitude: -122.4172,
    timestamp: new Date(Date.now() - 25 * 60000).toISOString(), // 25 minutes ago
    severity: 'high' as const,
    status: 'in-progress',
  },
  {
    id: 'demo-4',
    description: 'Bicycle accident in Golden Gate Park. Minor injuries, bleeding from head. Conscious.',
    latitude: 37.7694,
    longitude: -122.4862,
    timestamp: new Date(Date.now() - 45 * 60000).toISOString(), // 45 minutes ago
    severity: 'medium' as const,
    status: 'closed',
  },
  {
    id: 'demo-5',
    description: 'Medical emergency. Person experiencing chest pain and shortness of breath. Age 65+.',
    latitude: 37.7880,
    longitude: -122.3995,
    timestamp: new Date(Date.now() - 8 * 60000).toISOString(), // 8 minutes ago
    severity: 'high' as const,
    status: 'in-progress',
  },
  {
    id: 'demo-6',
    description: 'Pedestrian struck by vehicle at intersection. Person conscious, possible fractures.',
    latitude: 37.7868,
    longitude: -122.3995,
    timestamp: new Date(Date.now() - 15 * 60000).toISOString(), // 15 minutes ago
    severity: 'high' as const,
    status: 'open',
  },
  {
    id: 'demo-7',
    description: 'Carbon monoxide alarm activated in residential building. Multiple residents evacuated.',
    latitude: 37.7742,
    longitude: -122.4157,
    timestamp: new Date(Date.now() - 35 * 60000).toISOString(), // 35 minutes ago
    severity: 'high' as const,
    status: 'in-progress',
  },
  {
    id: 'demo-8',
    description: 'Workplace injury. Person cut with machinery, bleeding controlled. Waiting for transport.',
    latitude: 37.7814,
    longitude: -122.3878,
    timestamp: new Date(Date.now() - 20 * 60000).toISOString(), // 20 minutes ago
    severity: 'medium' as const,
    status: 'open',
  },
  {
    id: 'demo-9',
    description: 'Allergic reaction at restaurant. Person with difficulty breathing. EpiPen administered.',
    latitude: 37.7935,
    longitude: -122.3977,
    timestamp: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
    severity: 'high' as const,
    status: 'open',
  },
  {
    id: 'demo-10',
    description: 'Minor cut at home. Bleeding stopped. Person comfortable and stable.',
    latitude: 37.7896,
    longitude: -122.3996,
    timestamp: new Date(Date.now() - 100 * 60000).toISOString(), // 100 minutes ago
    severity: 'low' as const,
    status: 'closed',
  },
];

// Real city coordinates for various test locations
export const testLocations = {
  sanFrancisco: { lat: 37.7749, lng: -122.4194 },
  newYork: { lat: 40.7128, lng: -74.0060 },
  losAngeles: { lat: 34.0522, lng: -118.2437 },
  chicago: { lat: 41.8781, lng: -87.6298 },
  boston: { lat: 42.3601, lng: -71.0589 },
  seattle: { lat: 47.6062, lng: -122.3321 },
  denver: { lat: 39.7392, lng: -104.9903 },
  austin: { lat: 30.2672, lng: -97.7431 },
  miami: { lat: 25.7617, lng: -80.1918 },
  portland: { lat: 45.5152, lng: -122.6784 },
};

// Emergency keywords for AI severity detection
export const emergencyKeywords = {
  high: [
    'fire',
    'explosion',
    'crash',
    'accident',
    'critical',
    'severe',
    'danger',
    'collapse',
    'trap',
    'unconscious',
    'overdose',
    'gunshot',
    'bleeding',
    'cardiac',
    'stroke',
  ],
  medium: [
    'injury',
    'injured',
    'fracture',
    'broken',
    'dislocated',
    'poisoned',
    'dizzy',
    'confused',
    'allergic',
    'difficulty breathing',
    'chest pain',
    'seizure',
  ],
  low: [
    'help',
    'assistance',
    'advice',
    'stuck',
    'lost',
    'confused',
    'minor',
    'small',
    'bruise',
    'scrape',
  ],
};

// First aid keywords to auto-suggest content
export const firstAidSuggestions = {
  cpr: ['unconscious', 'not breathing', 'no pulse', 'cardiac arrest'],
  bleeding: ['bleeding', 'wound', 'cut', 'laceration', 'hemorrhage'],
  burns: ['burn', 'fire', 'scalding', 'sunburn'],
  fracture: ['fracture', 'broken', 'dislocation', 'sprain', 'strain'],
  choking: ['choking', 'asphyxiation', 'airway'],
  shock: ['shock', 'pale', 'cold', 'clammy', 'rapid pulse'],
  poisoning: ['poisoned', 'overdose', 'ingestion', 'exposure'],
  headInjury: ['head', 'neck', 'spine', 'trauma', 'concussion'],
};

// Statistics for dashboard
export const generateDashboardStats = (reports: any[]) => {
  return {
    total: reports.length,
    highSeverity: reports.filter(r => r.severity === 'high').length,
    mediumSeverity: reports.filter(r => r.severity === 'medium').length,
    lowSeverity: reports.filter(r => r.severity === 'low').length,
    open: reports.filter(r => r.status === 'open').length,
    inProgress: reports.filter(r => r.status === 'in-progress').length,
    closed: reports.filter(r => r.status === 'closed').length,
  };
};

// Helper to load demo data into API
export async function loadDemoData() {
  try {
    const response = await fetch('/api/reports/demo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reports: demoReports }),
    });
    return response.ok;
  } catch (error) {
    console.error('Failed to load demo data:', error);
    return false;
  }
}

// Helper to clear all reports
export async function clearAllReports() {
  try {
    const response = await fetch('/api/reports/clear', {
      method: 'DELETE',
    });
    return response.ok;
  } catch (error) {
    console.error('Failed to clear reports:', error);
    return false;
  }
}

// Generate random report for testing
export function generateRandomReport() {
  const locations = Object.values(testLocations);
  const descriptions = [
    'Emergency reported',
    'Urgent assistance needed',
    'Person in distress',
    'Medical emergency',
    'Accident reported',
  ];
  const severities: ('high' | 'medium' | 'low')[] = ['high', 'medium', 'low'];

  const randomLocation = locations[Math.floor(Math.random() * locations.length)];
  const randomDescription = descriptions[Math.floor(Math.random() * descriptions.length)];
  const randomSeverity = severities[Math.floor(Math.random() * severities.length)];

  return {
    id: Math.random().toString(36).substr(2, 9),
    description: randomDescription,
    latitude: randomLocation.lat + (Math.random() - 0.5) * 0.1,
    longitude: randomLocation.lng + (Math.random() - 0.5) * 0.1,
    timestamp: new Date().toISOString(),
    severity: randomSeverity,
    status: 'open',
  };
}
