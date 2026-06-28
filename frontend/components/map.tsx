'use client';

import dynamic from 'next/dynamic';

// Leaflet relies on the window object, so we must load it dynamically with ssr: false
const LeafletMap = dynamic(
  () => import('./leaflet-map'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full bg-slate-900 rounded-lg overflow-hidden border border-slate-700 h-96 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-slate-400">Loading Map...</span>
      </div>
    )
  }
);

interface Report {
  _id: string;
  description: string;
  latitude: number;
  longitude: number;
  reportedAt: string;
  severity: string;
  status: string;
  incidentType: string;
}

interface MapProps {
  reports: Report[];
}

export default function MapComponent({ reports }: MapProps) {
  return <LeafletMap reports={reports} />;
}
