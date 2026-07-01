'use client';

import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap, Polyline } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import { Search, Filter, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';





// Mock routing since we don't have a real routing service
// Draws a simple straight line between two points

export type MarkerType = 'incident' | 'civic' | 'volunteer' | 'admin';
export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low';

export interface MapItem {
  id: string;
  type: MarkerType;
  title: string;
  description: string;
  lat: number;
  lng: number;
  severity?: SeverityLevel; // For incidents
  status?: string;
  timestamp?: string;
}

const SEVERITY_COLORS = {
  critical: '#ef4444', // red
  high: '#f97316',     // orange
  medium: '#eab308',   // yellow
  low: '#3b82f6',      // blue
};

const iconCache = new Map<string, L.DivIcon>();

function getCustomIcon(type: MarkerType, severity?: SeverityLevel) {
  const cacheKey = `${type}-${severity || 'none'}`;
  
  if (iconCache.has(cacheKey)) {
    return iconCache.get(cacheKey)!;
  }

  let color = '#64748b'; // default slate
  let iconHtml = '';

  if (type === 'incident') {
    color = severity ? SEVERITY_COLORS[severity] : SEVERITY_COLORS.low;
    iconHtml = `<div style="width:20px;height:20px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 10px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;font-size:10px;">🚨</div>`;
  } else if (type === 'civic') {
    color = '#8b5cf6'; // purple
    iconHtml = `<div style="width:20px;height:20px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 10px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;font-size:10px;">🏙️</div>`;
  } else if (type === 'volunteer') {
    color = '#10b981'; // emerald
    iconHtml = `<div style="width:20px;height:20px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 10px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;font-size:10px;">👤</div>`;
  } else if (type === 'admin') {
    color = '#0ea5e9'; // sky
    iconHtml = `<div style="width:24px;height:24px;border-radius:4px;background:${color};border:2px solid #fff;box-shadow:0 0 10px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;font-size:12px;">🏥</div>`;
  }

  const icon = L.divIcon({
    className: 'guardianx-marker',
    html: iconHtml,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });

  iconCache.set(cacheKey, icon);
  return icon;
}

function MapBoundsController({ points }: { points: Array<[number, number]> }) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) return;
    try {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
    } catch (e) {}
  }, [map, points]);

  return null;
}

export default function LiveCityMap({ items }: { items: MapItem[] }) {
  // Fix for React 18 Strict Mode and Fast Refresh: synchronously clear _leaflet_id before render
  if (typeof window !== 'undefined') {
    const wrapper = document.getElementById('live-city-map-wrapper');
    if (wrapper && wrapper.firstElementChild) {
      (wrapper.firstElementChild as any)._leaflet_id = null;
    }
  }
  const [activeFilters, setActiveFilters] = useState<Record<MarkerType, boolean>>({
    incident: true,
    civic: true,
    volunteer: true,
    admin: true,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<MapItem | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const toggleFilter = (type: MarkerType) => {
    setActiveFilters(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (!activeFilters[item.type]) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return item.title.toLowerCase().includes(query) || item.description.toLowerCase().includes(query);
      }
      return true;
    });
  }, [items, activeFilters, searchQuery]);

  const points = useMemo(() => filteredItems.map(i => [i.lat, i.lng] as [number, number]), [filteredItems]);
  const fallbackCenter = useMemo<[number, number]>(() => points.length > 0 ? points[0] : [19.076, 72.8777], [points]);

  // Mock Route calculation (straight line from a selected incident to nearest volunteer/hospital)
  // In a real app, you'd use Leaflet Routing Machine or OSRM API here.
  const routePoints = useMemo(() => {
    if (!selectedItem || selectedItem.type !== 'incident') return null;
    
    // Find nearest volunteer or admin
    let nearest: MapItem | null = null;
    let minDistance = Infinity;
    
    items.forEach(item => {
      if (item.type === 'volunteer' || item.type === 'admin') {
        const dist = Math.sqrt(Math.pow(item.lat - selectedItem.lat, 2) + Math.pow(item.lng - selectedItem.lng, 2));
        if (dist < minDistance) {
          minDistance = dist;
          nearest = item;
        }
      }
    });

    if (nearest) {
      const target = nearest as MapItem;
      return [
        [target.lat, target.lng] as [number, number],
        [selectedItem.lat, selectedItem.lng] as [number, number]
      ];
    }
    return null;
  }, [selectedItem, items]);

  return (
    <div id="live-city-map-wrapper" className="relative w-full h-[600px] rounded-xl overflow-hidden border border-slate-700 shadow-2xl">
      {/* Top Controls Overlay */}
      <div className="absolute top-4 left-4 right-4 z-[400] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pointer-events-none">
        
        {/* Search Bar */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-lg p-2 flex items-center pointer-events-auto shadow-lg w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 mx-2" />
          <input 
            type="text" 
            placeholder="Search map..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none text-white focus:outline-none w-full text-sm"
          />
        </div>

        {/* Filter Pills */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-lg p-2 flex items-center gap-2 pointer-events-auto shadow-lg flex-wrap">
          <Layers className="w-4 h-4 text-slate-400 mx-2" />
          <Button 
            size="sm" 
            variant={activeFilters.incident ? 'default' : 'outline'} 
            onClick={() => toggleFilter('incident')}
            className={activeFilters.incident ? 'bg-red-600 hover:bg-red-700' : 'border-slate-600 text-slate-300'}
          >
            🚨 Emergencies
          </Button>
          <Button 
            size="sm" 
            variant={activeFilters.civic ? 'default' : 'outline'} 
            onClick={() => toggleFilter('civic')}
            className={activeFilters.civic ? 'bg-purple-600 hover:bg-purple-700' : 'border-slate-600 text-slate-300'}
          >
            🏙️ Civic Issues
          </Button>
          <Button 
            size="sm" 
            variant={activeFilters.volunteer ? 'default' : 'outline'} 
            onClick={() => toggleFilter('volunteer')}
            className={activeFilters.volunteer ? 'bg-emerald-600 hover:bg-emerald-700' : 'border-slate-600 text-slate-300'}
          >
            👤 Volunteers
          </Button>
          <Button 
            size="sm" 
            variant={activeFilters.admin ? 'default' : 'outline'} 
            onClick={() => toggleFilter('admin')}
            className={activeFilters.admin ? 'bg-sky-600 hover:bg-sky-700' : 'border-slate-600 text-slate-300'}
          >
            🏥 Facilities
          </Button>
        </div>
      </div>

      {isMounted && (
      <MapContainer 
        center={fallbackCenter} 
        zoom={12} 
        className="h-full w-full z-0 bg-slate-900" 
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        <MapBoundsController points={points} />
        
        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={40}
          spiderfyOnMaxZoom={true}
          polygonOptions={{
            fillColor: '#ef4444',
            color: '#ef4444',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.2
          }}
        >
          {filteredItems.map((item) => (
            <Marker
              key={item.id}
              position={[item.lat, item.lng]}
              icon={getCustomIcon(item.type, item.severity)}
              eventHandlers={{
                click: () => setSelectedItem(item)
              }}
            >
              <Popup className="guardianx-popup">
                <div className="space-y-2 text-sm text-slate-800 p-1 min-w-[200px]">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                    <span className="text-base font-bold text-slate-900 uppercase tracking-wide">
                      {item.title}
                    </span>
                  </div>
                  <p className="text-slate-700 py-1">{item.description}</p>
                  <div className="space-y-1 text-xs text-slate-600 bg-slate-50 p-2 rounded">
                    {item.severity && (
                      <p className="flex justify-between">
                        <span className="font-semibold text-slate-700">Severity:</span> 
                        <span className="uppercase" style={{ color: SEVERITY_COLORS[item.severity] || '#000' }}>
                          {item.severity}
                        </span>
                      </p>
                    )}
                    {item.status && (
                      <p className="flex justify-between">
                        <span className="font-semibold text-slate-700">Status:</span> 
                        <span className="uppercase">{item.status}</span>
                      </p>
                    )}
                    <p className="flex justify-between">
                      <span className="font-semibold text-slate-700">Coordinates:</span> 
                      <span>{item.lat.toFixed(4)}, {item.lng.toFixed(4)}</span>
                    </p>
                    {item.timestamp && (
                      <p className="flex justify-between mt-1 pt-1 border-t border-slate-200">
                        <span>{new Date(item.timestamp).toLocaleString()}</span>
                      </p>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>

        {/* Simulated Routing Polyline */}
        {routePoints && (
          <Polyline 
            positions={routePoints} 
            color="#3b82f6" 
            weight={4} 
            dashArray="10, 10" 
            className="animate-pulse"
          />
        )}
      </MapContainer>
      )}
    </div>
  );
}
