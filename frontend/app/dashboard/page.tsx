'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { useAuth } from '@/lib/auth-context';
import CitizenDashboard from '@/components/dashboards/citizen-dashboard';
import ResponderDashboard from '@/components/dashboards/responder-dashboard';
import HospitalDashboard from '@/components/dashboards/hospital-dashboard';
import AdminDashboard from '@/components/dashboards/admin-dashboard';
import { Loader2, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api-client';
import { disconnectSocketClient, getSocketClient } from '@/lib/socket-client';

import { Report, Responder, Hospital } from '@/lib/auth-types';

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, logout, isLoading: authLoading } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [responders, setResponders] = useState<Responder[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      // Use setTimeout to ensure router is initialized
      const timer = setTimeout(() => {
        router.push('/login');
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [user, authLoading, router]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const fetchData = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      const [reportsRes, respondersRes, hospitalsRes] = await Promise.all([
        apiFetch('/incidents', { token }),
        apiFetch('/volunteers', { token }), // Or /responders if implemented, but /volunteers matches the backend plan
        apiFetch('/hospitals', { token }),
      ]);

      if (reportsRes.ok) {
        setReports(await reportsRes.json());
      }
      if (respondersRes.ok) {
        setResponders(await respondersRes.json());
      }
      if (hospitalsRes.ok) {
        setHospitals(await hospitalsRes.json());
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    fetchData();

    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [token, fetchData]);

  useEffect(() => {
    if (!token || !user) {
      return;
    }

    const socket = getSocketClient(token);
    const onRealtimeUpdate = () => {
      fetchData();
    };

    socket.on('newIncident', onRealtimeUpdate);
    socket.on('incidentUpdated', onRealtimeUpdate);

    return () => {
      socket.off('newIncident', onRealtimeUpdate);
      socket.off('incidentUpdated', onRealtimeUpdate);
      disconnectSocketClient();
    };
  }, [token, user, fetchData]);

  const handleAcceptReport = useCallback(
    async (reportId: string) => {
      if (!token) {
        return;
      }

      try {
        const assignResponse = await apiFetch(`/incidents/${reportId}/assign`, {
          method: 'POST',
          body: JSON.stringify({}),
          token,
        });

        if (!assignResponse.ok) {
          const assignError = await assignResponse.json().catch(() => ({ error: 'Failed to accept report' }));
          throw new Error(assignError.error || 'Failed to accept report');
        }

        const statusResponse = await apiFetch(`/incidents/${reportId}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'active' }),
          token,
        });

        if (!statusResponse.ok) {
          const statusError = await statusResponse.json().catch(() => ({ error: 'Failed to start report handling' }));
          throw new Error(statusError.error || 'Failed to start report handling');
        }

        await fetchData();
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to accept report';
        setError(message);
      }
    },
    [fetchData, token]
  );

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const getDashboardTitle = () => {
    switch (user.role) {
      case 'citizen':
        return 'My Emergency Reports';
      case 'volunteer':
        return 'Active Emergencies';
      case 'admin':
        return 'System Administration';
      default:
        return 'Emergency Dashboard';
    }
  };

  const renderDashboard = () => {
    switch (user.role) {
      case 'citizen':
        return <CitizenDashboard reports={reports} loading={loading} />;
      case 'volunteer':
        return (
          <ResponderDashboard
            reports={reports}
            responders={responders}
            loading={loading}
            onAcceptReport={handleAcceptReport}
          />
        );
      case 'admin':
        return <AdminDashboard reports={reports} responders={responders} hospitals={hospitals} loading={loading} />;
      default:
        return <CitizenDashboard reports={reports} loading={loading} />;
    }
  };

  return (
    <DashboardLayout
      title={getDashboardTitle()}
      description={`Welcome, ${user.name} (${user.role})`}
      actions={
        <Button onClick={handleLogout} variant="outline" className="gap-2">
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      }
    >
      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {renderDashboard()}
    </DashboardLayout>
  );
}
