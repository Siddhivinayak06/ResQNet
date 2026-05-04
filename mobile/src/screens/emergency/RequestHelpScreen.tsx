import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { IncidentType } from '../../services/incidentService';
import { ApiError } from '../../services/api';
import {
  getCurrentLocation,
  LocationData,
  LocationStatus,
  LocationError,
  formatCoordinates,
} from '../../utils/location';
import { submitOrQueue, getQueuedReports, syncQueuedReports } from '../../utils/offlineQueue';
import { colors, radius } from '../../theme/colors';

type Props = NativeStackScreenProps<any, 'RequestHelp'>;

const INCIDENT_TYPES: { value: IncidentType; emoji: string; label: string }[] = [
  { value: 'medical', emoji: '🏥', label: 'Medical' },
  { value: 'fire', emoji: '🔥', label: 'Fire' },
  { value: 'accident', emoji: '🚗', label: 'Accident' },
  { value: 'disaster', emoji: '🌊', label: 'Disaster' },
];

// ─── Location Card ───────────────────────────────────────────
function LocationCard({
  status,
  location,
  onRetry,
}: {
  status: LocationStatus;
  location: LocationData | null;
  onRetry: () => void;
}) {
  const configs: Record<LocationStatus, { icon: string; text: string; color: string }> = {
    idle: { icon: '📍', text: 'Detecting location...', color: colors.dark400 },
    requesting: { icon: '🔄', text: 'Getting GPS coordinates...', color: colors.warning },
    granted: {
      icon: '✅',
      text: location ? `Location: ${formatCoordinates(location.latitude, location.longitude)}` : 'Acquired',
      color: colors.success,
    },
    denied: { icon: '⚠️', text: 'Permission denied', color: colors.danger },
    error: { icon: '❌', text: 'Location unavailable', color: colors.danger },
  };
  const c = configs[status];

  return (
    <View style={[locStyles.card, { borderColor: `${c.color}40` }]}>
      <Text style={{ fontSize: 22, marginRight: 12 }}>{c.icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={locStyles.title}>Location</Text>
        <Text style={[locStyles.status, { color: c.color }]}>{c.text}</Text>
        {location?.accuracy && status === 'granted' && (
          <Text style={locStyles.accuracy}>Accuracy: ±{Math.round(location.accuracy)}m</Text>
        )}
      </View>
      {(status === 'denied' || status === 'error') && (
        <TouchableOpacity onPress={onRetry} style={locStyles.retryBtn}>
          <Text style={locStyles.retryText}>Retry</Text>
        </TouchableOpacity>
      )}
      {status === 'requesting' && <ActivityIndicator size="small" color={colors.warning} />}
    </View>
  );
}
const locStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.dark900, borderWidth: 1, borderRadius: 16,
    padding: 16, flexDirection: 'row', alignItems: 'center',
  },
  title: { color: colors.white, fontSize: 14, fontWeight: '600' },
  status: { fontSize: 12, marginTop: 2 },
  accuracy: { color: colors.dark500, fontSize: 10, marginTop: 2 },
  retryBtn: { backgroundColor: colors.dark700, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  retryText: { color: colors.primary400, fontSize: 11, fontWeight: '600' },
});

// ─── Main Screen ─────────────────────────────────────────────
export default function RequestHelpScreen({ navigation }: Props) {
  const [incidentType, setIncidentType] = useState<IncidentType | ''>('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle');
  const [location, setLocation] = useState<LocationData | null>(null);
  const [queueCount, setQueueCount] = useState(0);

  const fetchLocation = async () => {
    setLocationStatus('requesting');
    try {
      const loc = await getCurrentLocation();
      setLocation(loc);
      setLocationStatus('granted');
    } catch (err) {
      setLocationStatus(err instanceof LocationError && err.code === 'PERMISSION_DENIED' ? 'denied' : 'error');
    }
  };

  useEffect(() => {
    fetchLocation();
    getQueuedReports().then((q) => setQueueCount(q.length));
  }, []);

  useEffect(() => {
    syncQueuedReports().then((r) => { if (r.synced > 0) setQueueCount(r.remaining); });
  }, []);

  const handleSubmit = async () => {
    if (!incidentType) { Alert.alert('Select Type', 'Choose an emergency type'); return; }
    if (!description.trim() || description.trim().length < 10) {
      Alert.alert('Description', 'Describe the situation (min 10 chars)'); return;
    }
    const lat = location?.latitude ?? 0;
    const lng = location?.longitude ?? 0;
    if (!location) {
      Alert.alert('No Location', 'Location unknown. Submit anyway?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Submit', onPress: () => doSubmit(lat, lng) },
      ]);
      return;
    }
    await doSubmit(lat, lng);
  };

  const doSubmit = async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const result = await submitOrQueue({
        incidentType: incidentType as IncidentType,
        description: description.trim(),
        latitude: lat, longitude: lng,
      });
      if (result.online) {
        Alert.alert('🚨 Submitted', 'Help is on the way!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        setQueueCount((c) => c + 1);
        Alert.alert('📡 Saved Offline', 'Will auto-submit when online.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (err) {
      Alert.alert('Error', err instanceof ApiError ? err.message : 'Submission failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.flex}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
      <ScrollView style={styles.bg} contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.headerSection}>
          <Text style={styles.title}>🚨 Report Emergency</Text>
          <Text style={styles.subtitle}>Select the type and describe the situation</Text>
        </View>

        {/* Queue Banner */}
        {queueCount > 0 && (
          <View style={styles.queueBanner}>
            <Text style={styles.queueText}>📡 {queueCount} queued offline</Text>
            <TouchableOpacity
              onPress={async () => {
                const r = await syncQueuedReports();
                setQueueCount(r.remaining);
                Alert.alert(r.synced > 0 ? 'Synced' : 'Offline', r.synced > 0 ? `${r.synced} sent` : 'No connection');
              }}
              style={styles.queueBtn}
            >
              <Text style={styles.queueBtnText}>Sync</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Type Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Emergency Type</Text>
          <View style={styles.typeGrid}>
            {INCIDENT_TYPES.map((type) => {
              const sel = incidentType === type.value;
              return (
                <TouchableOpacity
                  key={type.value}
                  onPress={() => setIncidentType(type.value)}
                  disabled={loading}
                  style={[styles.typeCard, sel && styles.typeCardSelected]}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 30, marginBottom: 4 }}>{type.emoji}</Text>
                  <Text style={[styles.typeLabel, sel && styles.typeLabelSelected]}>{type.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>What's happening?</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Describe the emergency..."
            placeholderTextColor={colors.dark600}
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
            maxLength={2000}
            editable={!loading}
          />
          <Text style={styles.charCount}>{description.length}/2000</Text>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <LocationCard status={locationStatus} location={location} onRetry={fetchLocation} />
        </View>

        {/* Submit */}
        <View style={styles.section}>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            activeOpacity={0.8}
          >
            {loading ? (
              <>
                <ActivityIndicator color="#fff" size="small" style={{ marginRight: 10 }} />
                <Text style={styles.submitText}>Submitting...</Text>
              </>
            ) : (
              <Text style={styles.submitText}>🚨 Submit Emergency Report</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bg: { backgroundColor: colors.dark950 },

  headerSection: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  title: { color: colors.white, fontSize: 24, fontWeight: 'bold' },
  subtitle: { color: colors.dark400, fontSize: 14, marginTop: 4 },

  section: { paddingHorizontal: 24, marginTop: 20 },
  sectionLabel: { color: colors.dark300, fontSize: 14, fontWeight: '600', marginBottom: 12 },

  queueBanner: {
    marginHorizontal: 24, marginTop: 8, backgroundColor: colors.amber900_30,
    borderWidth: 1, borderColor: colors.amber700_40, borderRadius: radius.md,
    padding: 12, flexDirection: 'row', alignItems: 'center',
  },
  queueText: { color: '#fcd34d', fontSize: 13, flex: 1 },
  queueBtn: { backgroundColor: colors.amber700_40, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  queueBtnText: { color: '#fef3c7', fontSize: 11, fontWeight: '600' },

  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  typeCard: {
    flexBasis: '47%', flexGrow: 1, paddingVertical: 20, borderRadius: 16,
    alignItems: 'center', borderWidth: 2, borderColor: colors.dark700, backgroundColor: colors.dark900,
  },
  typeCardSelected: { borderColor: colors.primary500, backgroundColor: colors.primary600_10 },
  typeLabel: { fontSize: 14, fontWeight: 'bold', color: colors.dark300 },
  typeLabelSelected: { color: colors.primary400 },

  textArea: {
    backgroundColor: colors.dark900, borderWidth: 1, borderColor: colors.dark700,
    borderRadius: 16, paddingHorizontal: 16, paddingVertical: 16,
    color: colors.white, fontSize: 16, minHeight: 130, textAlignVertical: 'top',
  },
  charCount: { color: colors.dark600, fontSize: 11, marginTop: 6, textAlign: 'right' },

  submitBtn: {
    backgroundColor: colors.primary600, borderRadius: 16, paddingVertical: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.primary500, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  submitBtnDisabled: { backgroundColor: colors.primary800, shadowOpacity: 0, elevation: 0 },
  submitText: { color: colors.white, fontWeight: 'bold', fontSize: 16 },
});
