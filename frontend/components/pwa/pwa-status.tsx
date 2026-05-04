'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowDownToLine, Cloud, CloudOff } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import {
  getPendingIncidentCount,
  OFFLINE_REPORTS_UPDATED_EVENT,
  syncOfflineIncidents,
} from '@/lib/offline';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export default function PwaStatus({ compact = false }: { compact?: boolean }) {
  const { token } = useAuth();
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  const refreshPendingCount = useCallback(async () => {
    try {
      const count = await getPendingIncidentCount();
      setPendingCount(count);
    } catch (error) {
      console.error('Failed to read offline incident count:', error);
    }
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) {
      return;
    }

    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((error) => {
        console.log('Service worker registration failed:', error);
      });
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setInstallPrompt(null);
    };

    const handleOnline = async () => {
      setIsOnline(true);
      await syncOfflineIncidents(token);
      refreshPendingCount();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    const handleOfflineUpdate = () => {
      refreshPendingCount();
    };

    const handleServiceWorkerMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'SYNC_REPORTS' || event.data?.type === 'SYNC_INCIDENTS') {
        await syncOfflineIncidents(token);
        refreshPendingCount();
      }
    };

    setIsOnline(navigator.onLine);
    refreshPendingCount();

    if (navigator.onLine) {
      syncOfflineIncidents(token).then(refreshPendingCount).catch((error) => {
        console.error('Failed to sync offline incidents:', error);
      });
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener(OFFLINE_REPORTS_UPDATED_EVENT, handleOfflineUpdate);

    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener(OFFLINE_REPORTS_UPDATED_EVENT, handleOfflineUpdate);
      if (navigator.serviceWorker) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
    };
  }, [refreshPendingCount, token]);

  const containerClasses = compact
    ? 'flex flex-wrap items-center gap-2 text-xs'
    : 'flex items-center gap-3 text-sm';

  return (
    <div className={containerClasses}>
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
          isOnline ? 'bg-emerald-500/15 text-emerald-200' : 'bg-rose-500/15 text-rose-200'
        }`}
      >
        {isOnline ? <Cloud className="h-3.5 w-3.5" /> : <CloudOff className="h-3.5 w-3.5" />}
        {isOnline ? 'Online' : 'Offline'}
      </span>
      <span className="inline-flex items-center rounded-full bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-200">
        Pending {pendingCount}
      </span>
      {installPrompt && (
        <button
          type="button"
          onClick={handleInstall}
          className="inline-flex items-center gap-1 rounded-full border border-slate-700 px-2.5 py-1 text-xs font-semibold text-slate-200 hover:border-slate-500"
        >
          <ArrowDownToLine className="h-3.5 w-3.5" />
          Install
        </button>
      )}
    </div>
  );
}
