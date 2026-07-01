import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Pressable,
  Alert,
  StyleSheet,
  TextInput,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../hooks/useAuth';
import { incidentService, Incident, mapIncident } from '../../services/incidentService';
import { civicIssueService, CivicIssue } from '../../services/civicIssueService';
import { ApiError } from '../../services/api';
import { socketService, SocketIncidentPayload } from '../../services/socket';
import { getCurrentLocation, LocationData } from '../../utils/location';
import { syncQueuedReports, getQueuedReports } from '../../utils/offlineQueue';
import { notificationService } from '../../services/notificationService';
import IncidentCard from '../../components/IncidentCard';
import IncidentMap from '../../components/IncidentMap';
import IncidentDetailModal from '../../components/IncidentDetailModal';
import SOSButton from '../../components/SOSButton';
import { colors, radius, spacing } from '../../theme/colors';
import { typography, shared } from '../../theme/styles';

type Props = NativeStackScreenProps<any, 'Home'>;

const MAP_HEIGHT = Dimensions.get('window').height * 0.32;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const FadeInView = ({ children, delay = 0, style, down = false }: any) => {
  const anim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [down ? -20 : 20, 0],
  });

  return (
    <Animated.View style={[style, { opacity: anim, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
};

// ─── Quick Action Card Component ───
const QuickActionCard = ({ emoji, label, onPress, delay }: { emoji: string; label: string; onPress: () => void; delay: number }) => {
  const scale = React.useRef(new Animated.Value(1)).current;
  
  return (
    <FadeInView delay={delay} style={{ flex: 1 }}>
      <AnimatedPressable
        onPress={onPress}
        onPressIn={() => Animated.spring(scale, { toValue: 0.95, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
        style={[styles.quickCard, { transform: [{ scale }] }]}
      >
        <Text style={{ fontSize: 24, marginBottom: spacing.xs }}>{emoji}</Text>
        <Text style={styles.quickLabel}>{label}</Text>
      </AnimatedPressable>
    </FadeInView>
  );
};

// ─── Skeleton ───
function SkeletonCard() {
  return (
    <FadeInView delay={0} style={skStyles.card}>
      <View style={skStyles.row}>
        <View style={[skStyles.bar, { width: 112 }]} />
        <View style={[skStyles.bar, { width: 64, borderRadius: radius.full }]} />
      </View>
      <View style={[skStyles.bar, { width: '100%', marginBottom: spacing.sm }]} />
      <View style={[skStyles.bar, { width: '75%' }]} />
    </FadeInView>
  );
}
const skStyles = StyleSheet.create({
  card: { ...shared.cardGlass, marginBottom: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  bar: { backgroundColor: colors.dark800, height: 12, borderRadius: radius.sm },
});

export default function HomeScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [civicIssues, setCivicIssues] = useState<CivicIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queueCount, setQueueCount] = useState(0);
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [showMap, setShowMap] = useState(true);
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('All');

  const CATEGORIES = ['All', 'Accident', 'Fire', 'Medical', 'Disaster', 'Crime', 'Hazmat', 'Rescue', 'Other'];

  const fetchIncidents = useCallback(async () => {
    try {
      setError(null);
      const [incidentsData, civicData] = await Promise.all([
        incidentService.getIncidents(),
        civicIssueService.getCivicIssues()
      ]);
      setIncidents(incidentsData);
      setCivicIssues(civicData);
    } catch (err) {
      if (err instanceof ApiError) setError(err.code === 'NETWORK_ERROR' ? 'Cannot reach server.' : err.message);
      else setError('Failed to load incidents.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    getCurrentLocation().then(setUserLocation).catch(() => {});
  }, []);

  useEffect(() => {
    fetchIncidents();
    syncQueuedReports().then((r) => setQueueCount(r.remaining));
    getQueuedReports().then((q) => setQueueCount(q.length));
    notificationService.register().then((state) => {
      if (state.token) notificationService.sendTokenToBackend(state.token);
    });
  }, [fetchIncidents]);

  useEffect(() => {
    socketService.connect();
    const unsubNew = socketService.onNewIncident((data: SocketIncidentPayload) => {
      const newIncident = mapIncident(data);
      setIncidents((prev) => (prev.find((i) => i._id === newIncident._id) ? prev : [newIncident, ...prev]));
    });

    const unsubUpdated = socketService.onIncidentUpdated((data: SocketIncidentPayload) => {
      const updatedIncident = mapIncident(data);
      setIncidents((prev) =>
        prev.map((i) => (i._id === updatedIncident._id ? { ...i, ...updatedIncident } : i))
      );
    });

    return () => { unsubNew(); unsubUpdated(); socketService.disconnect(); };
  }, []);

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

  const activeCount = incidents.filter((i) => ['verified', 'assigned', 'in_progress'].includes(i.status)).length;
  const pendingCount = incidents.filter((i) => i.status === 'pending').length;

  const filteredIncidents = incidents.filter(i => {
    const matchesSearch = i.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          i.incidentType.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'All' || i.incidentType.toLowerCase() === activeFilter.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  return (
    <SafeAreaView style={shared.screen}>
      <FadeInView down delay={0} style={styles.headerSection}>
        <View>
          <Text style={typography.caption}>Welcome back,</Text>
          <Text style={typography.h2}>{user?.name || 'User'}</Text>
        </View>
        <TouchableOpacity style={styles.mapToggle} onPress={() => setShowMap(!showMap)} activeOpacity={0.7}>
          <Text style={{ fontSize: 16 }}>{showMap ? '📋' : '🗺️'}</Text>
          <Text style={styles.mapToggleText}>{showMap ? 'List' : 'Map'}</Text>
        </TouchableOpacity>
      </FadeInView>

      <FadeInView delay={100}>
        {showMap && (
          <View style={styles.mapContainer}>
            <IncidentMap 
              incidents={incidents} 
              civicIssues={civicIssues}
              userLocation={userLocation} 
              onMarkerPress={setSelectedIncident} 
            />
          </View>
        )}

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.red900_30, borderColor: colors.red700_50 }]}>
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
      </FadeInView>

      <FadeInView delay={150} style={styles.filterSection}>
        <TextInput 
          style={styles.searchInput}
          placeholder="Search incidents..."
          placeholderTextColor={colors.dark400}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity 
              key={cat} 
              onPress={() => setActiveFilter(cat)}
              style={[styles.filterChip, activeFilter === cat && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, activeFilter === cat && styles.filterTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </FadeInView>

      <View style={styles.quickRow}>
        <QuickActionCard emoji="🚨" label="Report" onPress={() => navigation.navigate('RequestHelp')} delay={200} />
        <QuickActionCard emoji="🏙️" label="Civic" onPress={() => navigation.navigate('ReportCivicIssue')} delay={230} />
        <QuickActionCard emoji="🏥" label="First Aid" onPress={() => navigation.navigate('FirstAid')} delay={260} />
        <QuickActionCard emoji="📞" label="Contacts" onPress={() => navigation.navigate('EmergencyContacts')} delay={300} />
      </View>

      {queueCount > 0 && (
        <FadeInView delay={350} style={styles.queueBanner}>
          <Text style={styles.queueText}>📡 {queueCount} report{queueCount > 1 ? 's' : ''} pending sync</Text>
          <TouchableOpacity onPress={onRefresh} style={styles.queueBtn}>
            <Text style={styles.queueBtnText}>Sync Now</Text>
          </TouchableOpacity>
        </FadeInView>
      )}

      <FadeInView delay={400} style={styles.sectionHeader}>
        <Text style={typography.sectionTitle}>Recent Incidents</Text>
        <TouchableOpacity onPress={onRefresh} disabled={refreshing}>
          <Text style={styles.refreshText}>{refreshing ? 'Refreshing...' : 'Refresh'}</Text>
        </TouchableOpacity>
      </FadeInView>

      {error && (
        <FadeInView delay={0} style={shared.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={onRefresh} style={{ marginTop: spacing.sm, alignItems: 'center' }}>
            <Text style={styles.retryText}>Tap to retry</Text>
          </TouchableOpacity>
        </FadeInView>
      )}

      {loading ? (
        <View style={{ paddingHorizontal: spacing.lg }}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : (
        <FlatList
          data={filteredIncidents}
          keyExtractor={(item) => item._id}
          renderItem={({ item, index }) => (
            <FadeInView delay={450 + index * 50}>
              <IncidentCard incident={item} onPress={() => setSelectedIncident(item)} />
            </FadeInView>
          )}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 120 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary500} />}
          ListEmptyComponent={
            !error ? (
              <FadeInView delay={450} style={styles.emptySection}>
                <Text style={{ fontSize: 40, marginBottom: spacing.md }}>🎉</Text>
                <Text style={typography.h3}>No incidents reported</Text>
                <Text style={typography.caption}>Pull down to refresh</Text>
              </FadeInView>
            ) : null
          }
        />
      )}

      <IncidentDetailModal visible={selectedIncident !== null} incident={selectedIncident} userLocation={userLocation} onClose={() => setSelectedIncident(null)} />

      <View style={styles.floatingSOS}>
        <SOSButton size={72} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mapToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark900,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.dark800,
  },
  mapToggleText: { color: colors.white, fontSize: 13, fontWeight: '600', marginLeft: spacing.xs },
  
  mapContainer: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    height: MAP_HEIGHT,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.dark800,
  },

  statsRow: { flexDirection: 'row', paddingHorizontal: spacing.lg, gap: spacing.sm, marginBottom: spacing.md },
  statCard: { flex: 1, borderWidth: 1, borderRadius: radius.lg, padding: spacing.sm, alignItems: 'center' },
  statLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { color: colors.white, fontSize: 22, fontWeight: '900', marginTop: spacing.xs },

  quickRow: { flexDirection: 'row', paddingHorizontal: spacing.lg, gap: spacing.sm, marginBottom: spacing.lg },
  quickCard: {
    ...shared.cardGlass,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.xl,
  },
  quickLabel: { color: colors.white, fontSize: 12, fontWeight: '600' },

  filterSection: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  searchInput: {
    backgroundColor: colors.dark900,
    color: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.dark800,
    marginBottom: spacing.sm,
  },
  filterScroll: { marginBottom: spacing.xs },
  filterContent: { gap: spacing.xs },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.dark800,
    borderWidth: 1,
    borderColor: colors.dark700,
  },
  filterChipActive: { backgroundColor: colors.primary500, borderColor: colors.primary400 },
  filterText: { color: colors.dark200, fontSize: 12, fontWeight: '600' },
  filterTextActive: { color: colors.white },

  floatingSOS: { position: 'absolute', bottom: 24, alignSelf: 'center' },

  queueBanner: {
    marginHorizontal: spacing.lg, marginBottom: spacing.md,
    backgroundColor: colors.amber900_30, borderWidth: 1, borderColor: colors.amber700_40,
    borderRadius: radius.md, padding: spacing.md, flexDirection: 'row', alignItems: 'center',
  },
  queueText: { color: colors.warning, fontSize: 13, flex: 1, fontWeight: '500' },
  queueBtn: { backgroundColor: colors.warning, paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.full },
  queueBtnText: { color: colors.white, fontSize: 12, fontWeight: '700' },

  sectionHeader: { paddingHorizontal: spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  refreshText: { color: colors.primary400, fontSize: 14, fontWeight: '600' },

  errorText: { color: colors.primary300, fontSize: 13, textAlign: 'center' },
  retryText: { color: colors.primary400, fontSize: 12, fontWeight: '700' },

  emptySection: { alignItems: 'center', paddingVertical: spacing['4xl'] },
});
