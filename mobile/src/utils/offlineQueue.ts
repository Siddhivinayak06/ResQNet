import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';
import { incidentService, CreateIncidentPayload } from '../services/incidentService';

import { civicIssueService, CreateCivicIssuePayload } from '../services/civicIssueService';

// ─── Types ───────────────────────────────────────────────────
interface QueuedReport {
  type: 'incident' | 'civic_issue';
  payload: CreateIncidentPayload | CreateCivicIssuePayload;
  queuedAt: string;
  id: string; // local UUID for deduplication
}

const QUEUE_KEY = '@offline_queue';

/**
 * Get all queued offline reports.
 */
export async function getQueuedReports(): Promise<QueuedReport[]> {
  try {
    const data = await AsyncStorage.getItem(QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Save a report to the offline queue.
 */
export async function enqueueReport(
  type: 'incident' | 'civic_issue',
  payload: CreateIncidentPayload | CreateCivicIssuePayload
): Promise<QueuedReport> {
  const queue = await getQueuedReports();
  const report: QueuedReport = {
    type,
    payload,
    queuedAt: new Date().toISOString(),
    id: `offline_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  };
  queue.push(report);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  return report;
}

/**
 * Remove a specific report from the queue after successful sync.
 */
export async function dequeueReport(id: string): Promise<void> {
  const queue = await getQueuedReports();
  const updated = queue.filter((r) => r.id !== id);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(updated));
}

/**
 * Attempt to sync all queued offline reports if network is available.
 */
export async function syncQueuedReports(): Promise<{ synced: number; failed: number; remaining: number }> {
  const online = await isOnline();
  const queue = await getQueuedReports();

  if (!online || queue.length === 0) {
    return { synced: 0, failed: 0, remaining: queue.length };
  }

  let synced = 0;
  let failed = 0;

  // Filter out extremely old reports (e.g. > 48 hours)
  const now = new Date();
  const validQueue = queue.filter((r) => {
    const ageHours = (now.getTime() - new Date(r.queuedAt).getTime()) / (1000 * 60 * 60);
    return ageHours < 48;
  });

  // If we dropped some due to age, update the storage immediately
  if (validQueue.length < queue.length) {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(validQueue));
  }

  for (const report of validQueue) {
    try {
      if (report.type === 'incident') {
        const payload = report.payload as CreateIncidentPayload;
        await incidentService.reportIncident({
          incidentType: payload.incidentType,
          description: payload.description,
          latitude: payload.latitude,
          longitude: payload.longitude,
          severity: payload.severity,
          imageUrl: payload.imageUrl,
          tags: payload.tags,
        });
      } else if (report.type === 'civic_issue') {
        const payload = report.payload as CreateCivicIssuePayload;
        await civicIssueService.reportCivicIssue(payload);
      }
      await dequeueReport(report.id);
      synced++;
    } catch {
      failed++;
    }
  }

  const remaining = await getQueuedReports();
  return { synced, failed, remaining: remaining.length };
}

/**
 * Check connectivity.
 */
export async function isOnline(): Promise<boolean> {
  try {
    const state = await Network.getNetworkStateAsync();
    return !!(state.isConnected && state.isInternetReachable);
  } catch {
    return false;
  }
}

/**
 * Helper to submit immediately if online, otherwise enqueue.
 * Returns true if submitted online, false if queued offline.
 */
export async function submitOrQueue(
  type: 'incident' | 'civic_issue',
  payload: CreateIncidentPayload | CreateCivicIssuePayload
): Promise<{ online: boolean; report?: any }> {
  const online = await isOnline();

  if (online) {
    try {
      let report;
      if (type === 'incident') {
        report = await incidentService.reportIncident(payload as CreateIncidentPayload);
      } else {
        report = await civicIssueService.reportCivicIssue(payload as CreateCivicIssuePayload);
      }
      return { online: true, report };
    } catch {
      await enqueueReport(type, payload);
      return { online: false };
    }
  }

  await enqueueReport(type, payload);
  return { online: false };
}
