'use client';

import 'leaflet/dist/leaflet.css';

import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';



import { IncidentMapItem, IncidentType, incidentTypeConfig } from './types';

const iconCache = new Map<IncidentType, L.DivIcon>();

function getMarkerIcon(type: IncidentType) {
  const cached = iconCache.get(type);
  if (cached) {
    return cached;
  }

  const color = incidentTypeConfig[type]?.color ?? incidentTypeConfig.unknown.color;
  const icon = L.divIcon({
    className: 'resqnet-marker',
    html: `<div style="width:18px;height:18px;border-radius:9999px;background:${color};border:2px solid #ffffff;box-shadow:0 6px 16px rgba(15,23,42,0.35);"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -12],
  });

  iconCache.set(type, icon);
  return icon;
}

function MapBoundsController({ points }: { points: Array<[number, number]> }) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) {
      return;
    }

    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
  }, [map, points]);

  return null;
}

export default function IncidentMap({ incidents }: { incidents: IncidentMapItem[] }) {
  // Fix for React 18 Strict Mode and Fast Refresh: synchronously clear _leaflet_id before render
  if (typeof window !== 'undefined') {
    const wrapper = document.getElementById('incident-map-wrapper');
    if (wrapper && wrapper.firstElementChild) {
      (wrapper.firstElementChild as any)._leaflet_id = null;
    }
  }
  const points = useMemo(
    () => incidents.map((incident) => [incident.coordinates.lat, incident.coordinates.lng] as [number, number]),
    [incidents],
  );

  const fallbackCenter = useMemo<[number, number]>(() => {
    if (incidents.length > 0) {
      return [incidents[0].coordinates.lat, incidents[0].coordinates.lng];
    }

    return [37.7749, -122.4194];
  }, [incidents]);

  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Map container initialized properly by React-Leaflet v4 natively

  if (!isMounted) return <div className="h-full w-full bg-slate-900 rounded-lg animate-pulse" />;

  return (
    <div id="incident-map-wrapper" className="h-full w-full relative">
      <MapContainer 
      center={fallbackCenter} 
      zoom={12} 
      className="h-full w-full" 
      scrollWheelZoom
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapBoundsController points={points} />
      {incidents.map((incident) => {
        const config = incidentTypeConfig[incident.type] ?? incidentTypeConfig.unknown;
        const formattedTime = Number.isNaN(Date.parse(incident.reportedAt))
          ? 'Unknown'
          : new Date(incident.reportedAt).toLocaleString();

        return (
          <Marker
            key={incident.id}
            position={[incident.coordinates.lat, incident.coordinates.lng]}
            icon={getMarkerIcon(incident.type)}
          >
            <Popup>
              <div className="space-y-2 text-sm text-slate-700">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: config.color }}
                  />
                  <span className="text-base font-semibold text-slate-900">{incident.typeLabel}</span>
                </div>
                <p className="text-slate-700">{incident.description}</p>
                <div className="space-y-1 text-xs text-slate-600">
                  <p>
                    <span className="font-semibold text-slate-700">Coordinates:</span>{' '}
                    {incident.coordinates.lat.toFixed(5)}, {incident.coordinates.lng.toFixed(5)}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-700">Reported:</span> {formattedTime}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-700">Status:</span> {incident.status}
                  </p>
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
