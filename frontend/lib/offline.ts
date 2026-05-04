// IndexedDB wrapper for offline emergency reports
import { apiFetch } from './api-client';

const DB_NAME = 'EmergencyResponseDB';
const STORE_NAME = 'reports';
const DB_VERSION = 1;

export const OFFLINE_REPORTS_UPDATED_EVENT = 'resqnet:offline-reports-updated';

export interface OfflineIncident {
  id: string;
  incidentType: string;
  description: string;
  latitude: number;
  longitude: number;
  reportedAt: string;
  status: string;
  photoDataUrl?: string;
  synced?: boolean;
}

let db: IDBDatabase;

function notifyOfflineReportsUpdated() {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new Event(OFFLINE_REPORTS_UPDATED_EVENT));
}

export async function initializeDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const newDB = (event.target as IDBOpenDBRequest).result;
      if (!newDB.objectStoreNames.contains(STORE_NAME)) {
        newDB.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

export async function saveIncidentOffline(report: OfflineIncident): Promise<void> {
  if (!db) await initializeDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add({ ...report, synced: false });

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      notifyOfflineReportsUpdated();
      resolve();
    };
  });
}

export async function getOfflineIncidents(): Promise<OfflineIncident[]> {
  if (!db) await initializeDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

export async function deleteOfflineIncident(id: string): Promise<void> {
  if (!db) await initializeDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      notifyOfflineReportsUpdated();
      resolve();
    };
  });
}

export async function getPendingIncidentCount(): Promise<number> {
  if (typeof indexedDB === 'undefined') {
    return 0;
  }

  const offlineReports = await getOfflineIncidents();
  return offlineReports.filter((report) => !report.synced).length;
}

export async function syncOfflineIncidents(token?: string | null): Promise<void> {
  if (typeof navigator === 'undefined' || !navigator.onLine) {
    return;
  }

  const offlineReports = await getOfflineIncidents();
  const unsynced = offlineReports.filter((report) => !report.synced);

  for (const report of unsynced) {
    try {
      const response = await apiFetch('/api/incidents', {
        method: 'POST',
        body: JSON.stringify({
          incidentType: report.incidentType,
          description: report.description,
          latitude: report.latitude,
          longitude: report.longitude,
          reportedAt: report.reportedAt,
          status: report.status,
          photo: report.photoDataUrl || null,
        }),
        token,
      });

      if (response.ok) {
        await deleteOfflineIncident(report.id);
      }
    } catch (error) {
      console.error('Failed to sync report:', error);
    }
  }

  notifyOfflineReportsUpdated();
}

// Legacy export names for compatibility
export const saveReportOffline = saveIncidentOffline;
export const getOfflineReports = getOfflineIncidents;
export const deleteOfflineReport = deleteOfflineIncident;
export const syncOfflineReports = syncOfflineIncidents;
