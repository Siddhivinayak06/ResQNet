import NetInfo from '@react-native-community/netinfo';
import { getQueuedIncidents, markIncidentSynced, deleteSyncedIncidents } from './db';
import { incidentService } from './incidentService';

class SyncService {
  private isSyncing = false;

  constructor() {
    // Listen for network changes
    NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable) {
        this.syncPendingIncidents();
      }
    });
  }

  public async syncPendingIncidents() {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      const pendingIncidents = await getQueuedIncidents();
      
      for (const incident of pendingIncidents) {
        try {
          // Attempt to upload the incident to the backend
          await incidentService.reportIncident(incident.payload);
          // Mark as synced if successful
          await markIncidentSynced(incident.id);
        } catch (error) {
          console.error(`Failed to sync incident ${incident.id}:`, error);
          // We will retry on the next network event or app startup
        }
      }

      // Cleanup successful syncs
      await deleteSyncedIncidents();
    } catch (error) {
      console.error('Error during sync process:', error);
    } finally {
      this.isSyncing = false;
    }
  }
}

export const syncService = new SyncService();
