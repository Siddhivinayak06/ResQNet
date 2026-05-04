'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2, RefreshCw, ShieldAlert, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { getApiBaseUrl } from '@/lib/api-client';
import { disconnectSocketClient, getSocketClient } from '@/lib/socket-client';
import IncidentMap, {
  IncidentMapItem,
  IncidentType,
  incidentTypeConfig,
} from '@/components/monitoring/incident-map';

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
  return 'unknown';
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

function normalizeIncident(incident: ApiIncident): IncidentMapItem | null {
  const coordinates = resolveCoordinates(incident);
  if (!coordinates) {
    return null;
  }

  const type = normalizeIncidentType(incident.incidentType ?? incident.type);
  const config = incidentTypeConfig[type] ?? incidentTypeConfig.unknown;
  const reportedAt = incident.reportedAt ?? incident.timestamp ?? incident.createdAt ?? new Date().toISOString();

  return {
    id: incident.id ?? incident._id ?? `${coordinates.lat}-${coordinates.lng}-${reportedAt}`,
    type,
    typeLabel: config.label,
    description: incident.description?.trim() || 'No description provided.',
    status: incident.status ?? 'unconfirmed',
    reportedAt,
    coordinates,
  };
}

export default function MonitoringPage() {
  const router = useRouter();
  const { user, token, isLoading: authLoading } = useAuth();
  const [incidents, setIncidents] = useState<IncidentMapItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  const fetchIncidents = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await axios.get(`${getApiBaseUrl()}/api/incidents`, {
        headers,
        withCredentials: true,
      });

      const payload = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.incidents)
          ? response.data.incidents
          : [];

      const normalized = payload
        .map((incident: ApiIncident) => normalizeIncident(incident))
        .filter((incident: IncidentMapItem | null): incident is IncidentMapItem => Boolean(incident));

      setIncidents(normalized);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch incidents:', err);
      setError('Unable to load incidents right now.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const socket = getSocketClient(token);
    setIsLive(socket.connected);

    const handleConnect = () => setIsLive(true);
    const handleDisconnect = () => setIsLive(false);
    const handleRealtimeUpdate = () => fetchIncidents();

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('incident:created', handleRealtimeUpdate);
    socket.on('incident:updated', handleRealtimeUpdate);
    socket.on('report:created', handleRealtimeUpdate);
    socket.on('report:updated', handleRealtimeUpdate);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('incident:created', handleRealtimeUpdate);
      socket.off('incident:updated', handleRealtimeUpdate);
      socket.off('report:created', handleRealtimeUpdate);
      socket.off('report:updated', handleRealtimeUpdate);
      disconnectSocketClient();
    };
  }, [fetchIncidents, token, user]);

  const counts = useMemo(() => {
    const initial: Record<IncidentType, number> = {
      fire: 0,
      accident: 0,
      medical: 0,
      disaster: 0,
      unknown: 0,
    };

    incidents.forEach((incident) => {
      initial[incident.type] = (initial[incident.type] ?? 0) + 1;
    });

    return initial;
  }, [incidents]);

  const filteredIncidents = useMemo(() => {
    if (activeFilter === 'all') {
      return incidents;
    }

    return incidents.filter((incident) => incident.type === activeFilter);
  }, [activeFilter, incidents]);

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
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flex h-screen flex-col md:flex-row">
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
              <span className="text-2xl font-semibold text-white">{incidents.length}</span>
              active incidents tracked
            </div>
            <Button
              variant="outline"
              onClick={fetchIncidents}
              className="w-full justify-center gap-2 border-slate-800 bg-slate-950 text-slate-100 hover:bg-slate-900"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh feed
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

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Filters</p>
            <div className="grid gap-2">
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm transition ${
                  activeFilter === 'all'
                    ? 'border-white/20 bg-white/10 text-white'
                    : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                  All incidents
                </span>
                <span className="text-xs text-slate-400">{incidents.length}</span>
              </button>
              {orderedIncidentTypes.map((type) => {
                const config = incidentTypeConfig[type];
                const isActive = activeFilter === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setActiveFilter(type)}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm transition ${
                      isActive
                        ? 'border-white/20 bg-white/10 text-white'
                        : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: config.color }} />
                      {config.label}
                    </span>
                    <span className="text-xs text-slate-400">{counts[type]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-auto rounded-xl border border-slate-900 bg-slate-950/60 px-4 py-3 text-xs text-slate-400">
            Monitor incoming incidents and dispatch resources in real time. Incident data updates automatically when new reports arrive.
          </div>
        </aside>

        <section className="relative flex-1">
          <div className="absolute inset-0">
            <IncidentMap incidents={filteredIncidents} />
          </div>

          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
              <div className="flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm text-slate-200">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading incidents...
              </div>
            </div>
          )}

          {!isLoading && filteredIncidents.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 px-6 py-4 text-sm text-slate-200">
                No incidents match the selected filter.
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
