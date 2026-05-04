import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../hooks/useAuth';
import { incidentService, Incident } from '../../services/incidentService';
import { ApiError } from '../../services/api';
import { socketService, SocketIncidentPayload } from '../../services/socket';
import { getCurrentLocation, LocationData } from '../../utils/location';
import { syncQueuedReports, getQueuedReports } from '../../utils/offlineQueue';
import { notificationService } from '../../services/notificationService';
import IncidentCard from '../../components/IncidentCard';
import IncidentMap from '../../components/IncidentMap';
import IncidentDetailModal from '../../components/IncidentDetailModal';
import SOSButton from '../../components/SOSButton';
import { colors, radius } from '../../theme/colors';

type Props = NativeStackScreenProps<any, 'Home'>;

const MAP_HEIGHT = Dimensions.get('window').height * 0.32;

// ─── Skeleton ────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <View style={skStyles.card}>
      <View style={skStyles.row}>
        <View style={[skStyles.bar, { width: 112 }]} />
        <View style={[skStyles.bar, { width: 64, borderRadius: 999 }]} />
      </View>
      <View style={[skStyles.bar, { width: '100%', marginBottom: 8 }]} />
      <View style={[skStyles.bar, { width: '75%' }]} />
    </View>
  );
}
const skStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.dark800, borderWidth: 1, borderColor: colors.dark700,
    borderRadius: 16, padding: 16, marginBottom: 12,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  bar: { backgroundColor: colors.dark700, height: 12, borderRadius: 8 },
});

// ─── Screen ──────────────────────────────────────────────────
export default function HomeScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queueCount, setQueueCount] = useState(0);
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [showMap, setShowMap] = useState(true);

  // ── Fetch incidents ──
  const fetchIncidents = useCallback(async () => {
    try {
      setError(null);
      const data = await incidentService.getIncidents();
      setIncidents(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.code === 'NETWORK_ERROR' ? 'Cannot reach server.' : err.message);
      } else {
        setError('Failed to load incidents.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ── Get user location ──
  useEffect(() => {
    getCurrentLocation()
      .then(setUserLocation)
      .catch(() => {}); // Permission denied — map will use defaults
  }, []);

  // ── Initial fetch + offline sync ──
  useEffect(() => {
    fetchIncidents();
    syncQueuedReports().then((r) => setQueueCount(r.remaining));
    getQueuedReports().then((q) => setQueueCount(q.length));
    // Register push notifications
    notificationService.register().then((state) => {
      if (state.token) notificationService.sendTokenToBackend(state.token);
    });
  }, [fetchIncidents]);

  // ── Socket.io real-time updates ──
  useEffect(() => {
    socketService.connect();

    const unsubNew = socketService.onNewIncident((data: SocketIncidentPayload) => {
      // Add new incident to the top of the list
      const newIncident: Incident = {
        _id: data.incidentId,
        incidentType: data.incidentType as Incident['incidentType'],
        description: data.description,
        latitude: data.latitude,
        longitude: data.longitude,
        status: 'pending',
        reportedAt: data.timestamp || new Date().toISOString(),
      };
      setIncidents((prev) => {
        // Avoid duplicates
        if (prev.find((i) => i._id === newIncident._id)) return prev;
        return [newIncident, ...prev];
      });
    });

    const unsubUpdated = socketService.onIncidentUpdated((data: SocketIncidentPayload) => {
      setIncidents((prev) =>
        prev.map((i) =>
          i._id === data.incidentId
            ? {
                ...i,
                status: (data.status as Incident['status']) || i.status,
                description: data.description || i.description,
              }
            : i
        )
      );
    });

    return () => {
      unsubNew();
      unsubUpdated();
      socketService.disconnect();
    };
  }, []);

  // ── Auto-refresh every 30s ──
  useEffect(() => {
    const interval = setInterval(fetchIncidents, 30000);
    return () => clearInterval(interval);
  }, [fetchIncidents]);

  const onRefresh = async () => {
    setRefreshing(true);
    const syncResult = await syncQueuedReports();
    setQueueCount(syncResult.remaining);
    if (syncResult.synced > 0) Alert.alert('Synced', `${syncResult.synced} offline report(s) submitted.`);
    fetchIncidents();
  };

  const activeCount = incidents.filter((i) => i.status === 'active').length;
  const pendingCount = incidents.filter((i) => i.status === 'pending').length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerSection}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
        </View>
        <TouchableOpacity
          style={styles.mapToggle}
          onPress={() => setShowMap(!showMap)}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 16 }}>{showMap ? '📋' : '🗺️'}</Text>
          <Text style={styles.mapToggleText}>{showMap ? 'List' : 'Map'}</Text>
        </TouchableOpacity>
      </View>

      {/* Map */}
      {showMap && (
        <View style={styles.mapContainer}>
          <IncidentMap
            incidents={incidents}
            userLocation={userLocation}
            onMarkerPress={setSelectedIncident}
          />
        </View>
      )}

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: 'rgba(127,29,29,0.2)', borderColor: 'rgba(185,28,28,0.3)' }]}>
          <Text style={[styles.statLabel, { color: colors.primary400 }]}>Active</Text>
          <Text style={styles.statValue}>{activeCount}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.amber900_30, borderColor: colors.amber700_40 }]}>
          <Text style={[styles.statLabel, { color: colors.warning }]}>Pending</Text>
          <Text style={styles.statValue}>{pendingCount}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.blue900_20, borderColor: 'rgba(30,64,175,0.3)' }]}>
          <Text style={[styles.statLabel, { color: colors.info }]}>Total</Text>
          <Text style={styles.statValue}>{incidents.length}</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickRow}>
        <TouchableOpacity
          style={styles.quickCard}
          onPress={() => navigation.navigate('RequestHelp')}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 22 }}>🚨</Text>
          <Text style={styles.quickLabel}>Report</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickCard}
          onPress={() => navigation.navigate('FirstAid')}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Open First Aid Guide"
        >
          <Text style={{ fontSize: 22 }}>🏥</Text>
          <Text style={styles.quickLabel}>First Aid</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickCard}
          onPress={() => navigation.navigate('EmergencyContacts')}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Open Emergency Contacts"
        >
          <Text style={{ fontSize: 22 }}>📞</Text>
          <Text style={styles.quickLabel}>Contacts</Text>
        </TouchableOpacity>
      </View>

      {/* Queue Banner */}
      {queueCount > 0 && (
        <View style={styles.queueBanner}>
          <Text style={styles.queueText}>📡 {queueCount} report{queueCount > 1 ? 's' : ''} pending sync</Text>
          <TouchableOpacity onPress={onRefresh} style={styles.queueBtn}>
            <Text style={styles.queueBtnText}>Sync Now</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Incidents</Text>
        <TouchableOpacity onPress={onRefresh} disabled={refreshing}>
          <Text style={styles.refreshText}>{refreshing ? 'Refreshing...' : 'Refresh'}</Text>
        </TouchableOpacity>
      </View>

      {/* Error */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={onRefresh} style={{ marginTop: 8, alignItems: 'center' }}>
            <Text style={styles.retryText}>Tap to retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Incident List */}
      {loading ? (
        <View style={{ paddingHorizontal: 24 }}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : (
        <FlatList
          data={incidents}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <IncidentCard
              incident={item}
              onPress={() => setSelectedIncident(item)}
            />
          )}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary500} colors={[colors.primary500]} />
          }
          ListEmptyComponent={
            !error ? (
              <View style={styles.emptySection}>
                <Text style={{ fontSize: 36, marginBottom: 12 }}>🎉</Text>
                <Text style={styles.emptyTitle}>No incidents reported</Text>
                <Text style={styles.emptyHint}>Pull down to refresh</Text>
              </View>
            ) : null
          }
        />
      )}

      {/* Detail Modal */}
      <IncidentDetailModal
        visible={selectedIncident !== null}
        incident={selectedIncident}
        userLocation={userLocation}
        onClose={() => setSelectedIncident(null)}
      />

      {/* Floating SOS */}
      <View style={styles.floatingSOS}>
        <SOSButton size={70} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.dark950 },

  headerSection: {
    paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  greeting: { color: colors.dark400, fontSize: 14 },
  userName: { color: colors.white, fontSize: 24, fontWeight: 'bold' },
  mapToggle: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.dark800, paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.dark700,
  },
  mapToggleText: { color: colors.dark300, fontSize: 12, fontWeight: '600', marginLeft: 6 },

  mapContainer: {
    marginHorizontal: 24, marginBottom: 12,
    height: MAP_HEIGHT, borderRadius: radius.xl,
    overflow: 'hidden',
  },

  statsRow: { flexDirection: 'row', paddingHorizontal: 24, gap: 12, marginBottom: 8 },
  statCard: { flex: 1, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10 },
  statLabel: { fontSize: 11, fontWeight: '600' },
  statValue: { color: colors.white, fontSize: 18, fontWeight: 'bold' },

  quickRow: {
    flexDirection: 'row', paddingHorizontal: 24, gap: 10, marginBottom: 8,
  },
  quickCard: {
    flex: 1, backgroundColor: colors.dark900, borderWidth: 1, borderColor: colors.dark700,
    borderRadius: radius.md, paddingVertical: 14, alignItems: 'center',
  },
  quickLabel: { color: colors.dark300, fontSize: 11, fontWeight: '600', marginTop: 4 },

  floatingSOS: {
    position: 'absolute', bottom: 20, alignSelf: 'center',
  },

  queueBanner: {
    marginHorizontal: 24, marginBottom: 8,
    backgroundColor: colors.amber900_30, borderWidth: 1, borderColor: colors.amber700_40,
    borderRadius: radius.md, padding: 12, flexDirection: 'row', alignItems: 'center',
  },
  queueText: { color: '#fcd34d', fontSize: 13, flex: 1 },
  queueBtn: { backgroundColor: colors.amber700_40, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  queueBtnText: { color: '#fef3c7', fontSize: 11, fontWeight: '600' },

  sectionHeader: { paddingHorizontal: 24, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  sectionTitle: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
  refreshText: { color: colors.primary400, fontSize: 14 },

  errorBanner: {
    marginHorizontal: 24, marginBottom: 8,
    backgroundColor: colors.red900_30, borderWidth: 1, borderColor: colors.red700_50,
    borderRadius: radius.md, padding: 12,
  },
  errorText: { color: colors.primary300, fontSize: 13, textAlign: 'center' },
  retryText: { color: colors.primary400, fontSize: 11, fontWeight: '600' },

  emptySection: { alignItems: 'center', paddingVertical: 48 },
  emptyTitle: { color: colors.dark400, fontSize: 16, fontWeight: '600' },
  emptyHint: { color: colors.dark600, fontSize: 13, marginTop: 4 },
});
