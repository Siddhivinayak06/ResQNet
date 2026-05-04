import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';
import { incidentService, CreateIncidentPayload } from '../services/incidentService';

// ─── Types ───────────────────────────────────────────────────
interface QueuedReport extends CreateIncidentPayload {
  queuedAt: string;
  id: string; // local UUID for deduplication
}

const QUEUE_KEY = 'resqnet_offline_queue';

// ─── Queue Management ────────────────────────────────────────

/**
 * Get all pending reports from the offline queue.
 */
export async function getQueuedReports(): Promise<QueuedReport[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as QueuedReport[];
  } catch {
    return [];
  }
}

/**
 * Save a report to the offline queue.
 */
export async function enqueueReport(
  payload: CreateIncidentPayload
): Promise<QueuedReport> {
  const queue = await getQueuedReports();
  const report: QueuedReport = {
    ...payload,
    queuedAt: new Date().toISOString(),
    id: `offline_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  };
  queue.push(report);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  return report;
}

/**
 * Remove a report from the queue after successful sync.
 */
async function dequeueReport(id: string): Promise<void> {
  const queue = await getQueuedReports();
  const filtered = queue.filter((r) => r.id !== id);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
}

/**
 * Clear the entire queue.
 */
export async function clearQueue(): Promise<void> {
  await AsyncStorage.removeItem(QUEUE_KEY);
}

// ─── Network Check ───────────────────────────────────────────

/**
 * Check if the device is currently online.
 */
export async function isOnline(): Promise<boolean> {
  try {
    const state = await Network.getNetworkStateAsync();
    return state.isConnected === true && state.isInternetReachable !== false;
  } catch {
    return false;
  }
}

// ─── Sync ────────────────────────────────────────────────────

export interface SyncResult {
  synced: number;
  failed: number;
  remaining: number;
}

/**
 * Attempt to sync all queued reports with the backend.
 * Returns the number of successfully synced and remaining reports.
 */
export async function syncQueuedReports(): Promise<SyncResult> {
  const online = await isOnline();
  if (!online) {
    const queue = await getQueuedReports();
    return { synced: 0, failed: 0, remaining: queue.length };
  }

  const queue = await getQueuedReports();
  if (queue.length === 0) {
    return { synced: 0, failed: 0, remaining: 0 };
  }

  let synced = 0;
  let failed = 0;

  for (const report of queue) {
    try {
      await incidentService.reportIncident({
        incidentType: report.incidentType,
        description: report.description,
        latitude: report.latitude,
        longitude: report.longitude,
      });
      await dequeueReport(report.id);
      synced++;
    } catch {
      failed++;
    }
  }

  const remaining = (await getQueuedReports()).length;
  return { synced, failed, remaining };
}

/**
 * Submit a report — tries the API first, falls back to offline queue.
 * Returns true if submitted online, false if queued offline.
 */
export async function submitOrQueue(
  payload: CreateIncidentPayload
): Promise<{ online: boolean; report?: any }> {
  const online = await isOnline();

  if (online) {
    try {
      const report = await incidentService.reportIncident(payload);
      return { online: true, report };
    } catch {
      // API failed even though online — queue it
      await enqueueReport(payload);
      return { online: false };
    }
  }

  // Offline — queue it
  await enqueueReport(payload);
  return { online: false };
}
