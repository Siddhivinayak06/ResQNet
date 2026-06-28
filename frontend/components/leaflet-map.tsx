'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with Next.js/Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons based on severity/type
const createCustomIcon = (color: string) => {
  return new L.DivIcon({
    className: 'custom-icon',
    html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const icons = {
  medical: createCustomIcon('#3b82f6'),
  fire: createCustomIcon('#ef4444'),
  accident: createCustomIcon('#f59e0b'),
  disaster: createCustomIcon('#eab308'),
  default: createCustomIcon('#64748b'),
};

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

export default function LeafletMap({ reports }: MapProps) {
  // Center roughly on an average or default position
  const defaultCenter: [number, number] = reports.length > 0 
    ? [reports[0].latitude, reports[0].longitude] 
    : [19.076, 72.8777];

  return (
    <div className="w-full bg-slate-900 rounded-lg overflow-hidden border border-slate-700 h-96 relative">
      <MapContainer 
        center={defaultCenter} 
        zoom={12} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        {reports.map((report) => {
          const icon = icons[report.incidentType as keyof typeof icons] || icons.default;
          
          return (
            <Marker 
              key={report._id} 
              position={[report.latitude, report.longitude]} 
              icon={icon}
            >
              <Popup className="custom-popup">
                <div className="text-slate-800 p-1">
                  <h3 className="font-bold text-sm capitalize mb-1">
                    {report.incidentType} Emergency
                  </h3>
                  <p className="text-xs mb-2 line-clamp-2">{report.description}</p>
                  <div className="text-xs text-slate-500">
                    <p>Status: <span className="font-semibold">{report.status}</span></p>
                    <p>Severity: <span className="font-semibold">{report.severity}</span></p>
                    <p>Time: {new Date(report.reportedAt).toLocaleTimeString()}</p>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
