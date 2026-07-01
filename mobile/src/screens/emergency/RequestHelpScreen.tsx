import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { IncidentType, IncidentSeverity } from '../../services/incidentService';
import { ApiError } from '../../services/api';
import {
  getCurrentLocation,
  LocationData,
  LocationStatus,
  LocationError,
  formatCoordinates,
} from '../../utils/location';
import { submitOrQueue, getQueuedReports, syncQueuedReports } from '../../utils/offlineQueue';
import { colors, radius, spacing } from '../../theme/colors';
import { typography, shared } from '../../theme/styles';

type Props = NativeStackScreenProps<any, 'RequestHelp'>;

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

const INCIDENT_TYPES: { value: IncidentType; emoji: string; label: string }[] = [
  { value: 'medical', emoji: '🏥', label: 'Medical' },
  { value: 'fire', emoji: '🔥', label: 'Fire' },
  { value: 'accident', emoji: '🚗', label: 'Accident' },
  { value: 'disaster', emoji: '🌊', label: 'Disaster' },
  { value: 'crime', emoji: '🚔', label: 'Crime' },
  { value: 'hazmat', emoji: '☣️', label: 'Hazmat' },
  { value: 'rescue', emoji: '🚁', label: 'Rescue' },
  { value: 'other', emoji: '⚠️', label: 'Other' },
];

const SEVERITIES: { value: IncidentSeverity; label: string; color: string }[] = [
  { value: 'critical', label: 'Critical', color: colors.danger },
  { value: 'high', label: 'High', color: '#ea580c' },
  { value: 'medium', label: 'Medium', color: '#eab308' },
  { value: 'low', label: 'Low', color: '#3b82f6' },
];

function LocationCard({ status, location, onRetry }: { status: LocationStatus; location: LocationData | null; onRetry: () => void; }) {
  const configs: Record<LocationStatus, { icon: string; text: string; color: string }> = {
    idle: { icon: '📍', text: 'Detecting location...', color: colors.dark400 },
    requesting: { icon: '🔄', text: 'Getting GPS coordinates...', color: colors.warning },
    granted: { icon: '✅', text: location ? `Location: ${formatCoordinates(location.latitude, location.longitude)}` : 'Acquired', color: colors.success },
    denied: { icon: '⚠️', text: 'Permission denied', color: colors.danger },
    error: { icon: '❌', text: 'Location unavailable', color: colors.danger },
  };
  const c = configs[status];

  return (
    <FadeInView delay={500} style={[shared.cardGlass, { borderColor: `${c.color}40`, flexDirection: 'row', alignItems: 'center' }]}>
      <Text style={{ fontSize: 24, marginRight: spacing.md }}>{c.icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={typography.h4}>Location</Text>
        <Text style={{ fontSize: 13, marginTop: 4, color: c.color, fontWeight: '500' }}>{c.text}</Text>
        {location?.accuracy && status === 'granted' && (
          <Text style={{ color: colors.dark500, fontSize: 11, marginTop: 4 }}>Accuracy: ±{Math.round(location.accuracy)}m</Text>
        )}
      </View>
      {(status === 'denied' || status === 'error') && (
        <TouchableOpacity onPress={onRetry} style={{ backgroundColor: colors.dark700, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md }}>
          <Text style={{ color: colors.primary400, fontSize: 12, fontWeight: '700' }}>Retry</Text>
        </TouchableOpacity>
      )}
      {status === 'requesting' && <ActivityIndicator size="small" color={colors.warning} />}
    </FadeInView>
  );
}

// ─── Main Screen ───
export default function RequestHelpScreen({ navigation }: Props) {
  const [incidentType, setIncidentType] = useState<IncidentType | ''>('');
  const [severity, setSeverity] = useState<IncidentSeverity>('medium');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
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
    if (!description.trim() || description.trim().length < 10) { Alert.alert('Description', 'Describe the situation (min 10 chars)'); return; }
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
      const payload = {
        incidentType: incidentType as IncidentType, 
        description: description.trim(), 
        latitude: lat, 
        longitude: lng,
        severity,
        imageUrl: imageUrl || undefined,
      };
      const result = await submitOrQueue('incident', payload);
      if (result.online) {
        Alert.alert('🚨 Submitted', 'Help is on the way!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      } else {
        setQueueCount((c) => c + 1);
        Alert.alert('📡 Saved Offline', 'Will auto-submit when online.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      }
    } catch (err) {
      Alert.alert('Error', err instanceof ApiError ? err.message : 'Submission failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={shared.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={{ backgroundColor: colors.dark950 }} contentContainerStyle={{ paddingBottom: spacing['4xl'] }} keyboardShouldPersistTaps="handled">
          <FadeInView down delay={0} style={styles.headerSection}>
            <Text style={typography.h1}>🚨 Report Emergency</Text>
            <Text style={[typography.bodySmall, { marginTop: spacing.xs }]}>Select the type and describe the situation clearly</Text>
          </FadeInView>

          {queueCount > 0 && (
            <FadeInView delay={100} style={shared.errorBanner}>
              <Text style={{ color: colors.warning, flex: 1, fontWeight: '600' }}>📡 {queueCount} queued offline</Text>
              <TouchableOpacity onPress={async () => {
                const r = await syncQueuedReports();
                setQueueCount(r.remaining);
                Alert.alert(r.synced > 0 ? 'Synced' : 'Offline', r.synced > 0 ? `${r.synced} sent` : 'No connection');
              }} style={{ backgroundColor: colors.warning, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.md }}>
                <Text style={{ color: colors.white, fontSize: 11, fontWeight: '700' }}>Sync</Text>
              </TouchableOpacity>
            </FadeInView>
          )}

          <FadeInView delay={200} style={styles.section}>
            <Text style={typography.label}>Emergency Type</Text>
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
                    <Text style={{ fontSize: 32, marginBottom: spacing.sm }}>{type.emoji}</Text>
                    <Text style={[styles.typeLabel, sel && styles.typeLabelSelected]}>{type.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </FadeInView>

          <FadeInView delay={350} style={styles.section}>
            <Text style={typography.label}>What's happening?</Text>
            <TextInput
              style={[shared.input, { minHeight: 140, textAlignVertical: 'top' }]}
              placeholder="Describe the emergency..."
              placeholderTextColor={colors.dark600}
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={2000}
              editable={!loading}
            />
            <Text style={{ color: colors.dark600, fontSize: 11, marginTop: spacing.xs, textAlign: 'right' }}>
              {description.length}/2000
            </Text>
          </FadeInView>

          <FadeInView delay={450} style={styles.section}>
            <Text style={typography.label}>Severity</Text>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              {SEVERITIES.map((sev) => {
                const sel = severity === sev.value;
                return (
                  <TouchableOpacity
                    key={sev.value}
                    onPress={() => setSeverity(sev.value)}
                    style={[
                      styles.sevCard,
                      sel && { borderColor: sev.color, backgroundColor: `${sev.color}20` }
                    ]}
                  >
                    <Text style={[styles.sevLabel, sel && { color: sev.color }]}>{sev.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </FadeInView>

          <FadeInView delay={500} style={styles.section}>
            <Text style={typography.label}>Attach Photo (Optional)</Text>
            {imageUrl ? (
              <View style={{ position: 'relative' }}>
                <Image source={{ uri: imageUrl }} style={styles.previewImage} />
                <TouchableOpacity onPress={() => setImageUrl(null)} style={styles.removeImageBtn}>
                  <Text style={{ color: 'white', fontWeight: 'bold' }}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => setImageUrl('https://images.unsplash.com/photo-1627581698246-8608e6f30a91?q=80&w=1470&auto=format&fit=crop')}
                style={styles.attachBtn}
              >
                <Text style={{ fontSize: 24, marginBottom: 8 }}>📸</Text>
                <Text style={{ color: colors.dark300, fontWeight: '600' }}>Tap to take a photo</Text>
                <Text style={{ color: colors.dark500, fontSize: 11, marginTop: 4 }}>(Uses mock image for now)</Text>
              </TouchableOpacity>
            )}
          </FadeInView>

          <View style={styles.section}>
            <LocationCard status={locationStatus} location={location} onRetry={fetchLocation} />
          </View>

          <FadeInView delay={650} style={styles.section}>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              style={[shared.buttonPrimary, { paddingVertical: spacing.xl, borderRadius: radius.xl }, loading && shared.buttonDisabled]}
              activeOpacity={0.8}
            >
              {loading ? (
                <>
                  <ActivityIndicator color="#fff" size="small" style={{ marginRight: 10 }} />
                  <Text style={shared.buttonPrimaryText}>Submitting...</Text>
                </>
              ) : (
                <Text style={shared.buttonPrimaryText}>🚨 Submit Emergency Report</Text>
              )}
            </TouchableOpacity>
          </FadeInView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerSection: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md },
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.xl },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  typeCard: {
    flexBasis: '47%', flexGrow: 1, paddingVertical: spacing['xl'], borderRadius: radius.xl,
    alignItems: 'center', borderWidth: 2, borderColor: colors.dark700, backgroundColor: colors.dark900,
  },
  typeCardSelected: { borderColor: colors.primary500, backgroundColor: colors.primary600_10 },
  typeLabel: { fontSize: 14, fontWeight: '700', color: colors.dark300 },
  typeLabelSelected: { color: colors.primary400 },
  
  sevCard: {
    flex: 1, paddingVertical: spacing.md, borderRadius: radius.md,
    alignItems: 'center', borderWidth: 1, borderColor: colors.dark700, backgroundColor: colors.dark900,
  },
  sevLabel: { fontSize: 12, fontWeight: '700', color: colors.dark400 },

  attachBtn: {
    borderWidth: 2, borderColor: colors.dark700, borderStyle: 'dashed', borderRadius: radius.xl,
    paddingVertical: 32, alignItems: 'center', backgroundColor: colors.dark900,
  },
  previewImage: {
    width: '100%', height: 200, borderRadius: radius.xl, backgroundColor: colors.dark800,
  },
  removeImageBtn: {
    position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center',
  }
});
