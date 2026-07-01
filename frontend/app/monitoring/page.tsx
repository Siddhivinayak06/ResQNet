'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2, RefreshCw, ShieldAlert, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { IncidentType } from '@/lib/auth-types';
import { getApiBaseUrl } from '@/lib/api-client';
import { disconnectSocketClient, getSocketClient } from '@/lib/socket-client';
import dynamic from 'next/dynamic';
import Sidebar from '@/components/layout/sidebar';
import BottomTabs from '@/components/layout/bottom-tabs';
import { MapItem, MarkerType, SeverityLevel } from '@/components/monitoring/live-city-map';

const LiveCityMap = dynamic(() => import('@/components/monitoring/live-city-map'), { ssr: false });

type FilterType = 'all' | IncidentType;

interface ApiIncident {
  id?: string;
  _id?: string;
  incidentType?: string;
  type?: string;
  description?: string;
  status?: string;
  latitude?: number;
  longitude?: number;
  reportedAt?: string;
  timestamp?: string;
  createdAt?: string;
  location?: {
    coordinates?: [number, number];
  };
}

const orderedIncidentTypes: IncidentType[] = ['fire', 'accident', 'medical', 'disaster'];

function normalizeIncidentType(value?: string): IncidentType {
  const normalized = value?.toLowerCase();
  if (normalized === 'fire') return 'fire';
  if (normalized === 'accident') return 'accident';
  if (normalized === 'medical') return 'medical';
  if (normalized === 'disaster') return 'disaster';
  return 'other';
}

function resolveCoordinates(incident: ApiIncident) {
  if (typeof incident.latitude === 'number' && typeof incident.longitude === 'number') {
    return { lat: incident.latitude, lng: incident.longitude };
  }

  const coordinates = incident.location?.coordinates;
  if (Array.isArray(coordinates) && coordinates.length === 2) {
    return { lat: coordinates[1], lng: coordinates[0] };
  }

  return null;
}

function normalizeIncident(incident: ApiIncident): MapItem | null {
  const coordinates = resolveCoordinates(incident);
  if (!coordinates) return null;
  const reportedAt = incident.reportedAt ?? incident.timestamp ?? incident.createdAt ?? new Date().toISOString();
  
  return {
    id: incident.id ?? incident._id ?? `inc-${coordinates.lat}-${coordinates.lng}`,
    type: 'incident' as MarkerType,
    title: (incident.incidentType ?? incident.type ?? 'Emergency').toUpperCase(),
    description: incident.description?.trim() || 'No description provided.',
    lat: coordinates.lat,
    lng: coordinates.lng,
    severity: 'high' as SeverityLevel, // We can map this if backend supports it
    status: incident.status ?? 'unconfirmed',
    timestamp: reportedAt,
  };
}

function normalizeCivicIssue(issue: any): MapItem | null {
  if (!issue.location?.coordinates) return null;
  const [lng, lat] = issue.location.coordinates;
  return {
    id: issue._id ?? `civic-${lat}-${lng}`,
    type: 'civic' as MarkerType,
    title: (issue.category ?? 'Civic Issue').replace('_', ' ').toUpperCase(),
    description: issue.description?.trim() || 'No description',
    lat,
    lng,
    status: issue.status,
    timestamp: issue.reportedAt ?? issue.createdAt,
  };
}

function normalizeUser(user: any): MapItem | null {
  if (!user.location?.coordinates) return null;
  const [lng, lat] = user.location.coordinates;
  return {
    id: user._id,
    type: user.role === 'volunteer' ? 'volunteer' : 'admin',
    title: user.name,
    description: `Role: ${user.role} | Phone: ${user.phone}`,
    lat,
    lng,
    status: user.status,
  };
}

export default function MonitoringPage() {
  const router = useRouter();
  const { user, token, isLoading: authLoading } = useAuth();
  const [mapItems, setMapItems] = useState<MapItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  const fetchMapData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const [incidentsRes, civicRes, usersRes] = await Promise.all([
        axios.get(`${getApiBaseUrl()}/incidents`, { headers, withCredentials: true }).catch(() => ({ data: [] })),
        axios.get(`${getApiBaseUrl()}/civic-issues`, { headers, withCredentials: true }).catch(() => ({ data: { data: [] } })),
        axios.get(`${getApiBaseUrl()}/users`, { headers, withCredentials: true }).catch(() => ({ data: { data: [] } }))
      ]);

      const incPayload = Array.isArray(incidentsRes.data) ? incidentsRes.data : Array.isArray(incidentsRes.data?.incidents) ? incidentsRes.data.incidents : [];
      const civPayload = Array.isArray(civicRes.data?.data) ? civicRes.data.data : [];
      const usrPayload = Array.isArray(usersRes.data?.data) ? usersRes.data.data : [];

      const normalizedInc = incPayload.map(normalizeIncident).filter(Boolean) as MapItem[];
      const normalizedCiv = civPayload.map(normalizeCivicIssue).filter(Boolean) as MapItem[];
      const normalizedUsr = usrPayload.map(normalizeUser).filter(Boolean) as MapItem[];

      setMapItems([...normalizedInc, ...normalizedCiv, ...normalizedUsr]);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch map data:', err);
      setError('Unable to load map data right now.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchMapData();
  }, [fetchMapData]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const socket = getSocketClient(token);
    setIsLive(socket.connected);

    const handleConnect = () => setIsLive(true);
    const handleDisconnect = () => setIsLive(false);
    const handleRealtimeUpdate = () => fetchMapData();

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('newIncident', handleRealtimeUpdate);
    socket.on('incidentUpdated', handleRealtimeUpdate);
    socket.on('newCivicIssue', handleRealtimeUpdate);
    socket.on('civicIssueUpdated', handleRealtimeUpdate);
    
    // For live location updates, we update state directly to avoid API spam
    const handleLocationUpdate = (payload: any) => {
      setMapItems(prev => {
        const userId = payload.userId;
        const exists = prev.find(i => i.id === userId);
        const lng = payload.location.coordinates[0];
        const lat = payload.location.coordinates[1];
        
        if (exists) {
          return prev.map(i => i.id === userId ? { ...i, lat, lng } : i);
        } else {
          // If the user isn't in the list yet, we'll fetch map data or just ignore
          // since fetchMapData pulls all online users.
          return prev;
        }
      });
    };
    socket.on('locationUpdate', handleLocationUpdate);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('newIncident', handleRealtimeUpdate);
      socket.off('incidentUpdated', handleRealtimeUpdate);
      socket.off('newCivicIssue', handleRealtimeUpdate);
      socket.off('civicIssueUpdated', handleRealtimeUpdate);
      socket.off('locationUpdate', handleLocationUpdate);
      disconnectSocketClient();
    };
  }, [fetchMapData, token, user]);

  const activeIncidentsCount = useMemo(() => mapItems.filter(i => i.type === 'incident').length, [mapItems]);

  const lastUpdatedLabel = lastUpdated
    ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '--';

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-6 w-6 animate-spin text-rose-500" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* Desktop Sidebar (Admins only) */}
      {user && user.role !== 'citizen' && user.role !== 'volunteer' && (
        <div className="hidden lg:flex w-[260px] shrink-0 border-r border-slate-900">
          <div className="sticky top-0 h-screen w-full bg-slate-950 overflow-hidden">
            <Sidebar />
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col md:flex-row min-w-0 pb-[80px] lg:pb-0">
        <aside className="flex w-full flex-col gap-6 border-b border-slate-900 bg-slate-950/90 px-5 py-6 md:w-80 md:border-b-0 md:border-r">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-lg shadow-rose-900/30">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-rose-300">ResQNet</p>
                <h1 className="text-xl font-semibold text-white">Live Incident Monitor</h1>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1">
                {isLive ? (
                  <>
                    <Wifi className="h-3.5 w-3.5 text-emerald-400" />
                    Live updates connected
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3.5 w-3.5 text-rose-400" />
                    Live updates offline
                  </>
                )}
              </span>
              <span>Last update {lastUpdatedLabel}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <span className="text-2xl font-semibold text-white">{activeIncidentsCount}</span>
              active emergencies tracked
            </div>
            <Button
              variant="outline"
              onClick={fetchMapData}
              className="w-full justify-center gap-2 border-slate-800 bg-slate-950 text-slate-100 hover:bg-slate-900"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh map
            </Button>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            </div>
          )}

          <div className="mt-auto rounded-xl border border-slate-900 bg-slate-950/60 px-4 py-3 text-xs text-slate-400">
            Monitor incoming incidents, civic issues, and dispatch resources in real time. Map updates automatically.
          </div>
        </aside>

        <section className="relative flex-1">
          <div className="absolute inset-0">
            <LiveCityMap items={mapItems} />
          </div>

          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
              <div className="flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm text-slate-200">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading incidents...
              </div>
            </div>
          )}

          {!isLoading && mapItems.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 pointer-events-none">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 px-6 py-4 text-sm text-slate-200">
                No data available on the map.
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Mobile Bottom Navigation (Citizens/Volunteers only) */}
      {user && (user.role === 'citizen' || user.role === 'volunteer') && <BottomTabs />}
    </div>
  );
}
