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
  Animated,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { civicIssueService, CivicIssueCategory } from '../../services/civicIssueService';
import { ApiError } from '../../services/api';
import {
  getCurrentLocation,
  LocationData,
  LocationStatus,
  LocationError,
  formatCoordinates,
} from '../../utils/location';
import { submitOrQueue } from '../../utils/offlineQueue';
import { colors, radius, spacing } from '../../theme/colors';
import { typography, shared } from '../../theme/styles';

type Props = NativeStackScreenProps<any, 'ReportCivicIssue'>;

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

const CATEGORIES: { value: CivicIssueCategory; emoji: string; label: string }[] = [
  { value: 'pothole', emoji: '🕳️', label: 'Pothole' },
  { value: 'garbage', emoji: '🗑️', label: 'Garbage' },
  { value: 'water_leakage', emoji: '💧', label: 'Water Leak' },
  { value: 'streetlight', emoji: '💡', label: 'Streetlight' },
  { value: 'damaged_road', emoji: '🚧', label: 'Road Damage' },
  { value: 'fallen_tree', emoji: '🌳', label: 'Fallen Tree' },
  { value: 'illegal_dumping', emoji: '♻️', label: 'Dumping' },
  { value: 'other', emoji: '📋', label: 'Other' },
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

export default function ReportCivicIssueScreen({ navigation }: Props) {
  const [category, setCategory] = useState<CivicIssueCategory | ''>('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle');
  const [location, setLocation] = useState<LocationData | null>(null);

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
  }, []);

  const handleSubmit = async () => {
    if (!category) { Alert.alert('Select Category', 'Choose a civic issue category'); return; }
    if (!description.trim() || description.trim().length < 10) { Alert.alert('Description', 'Describe the issue (min 10 chars)'); return; }
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
        category: category as CivicIssueCategory, 
        description: description.trim(), 
        location: {
          type: 'Point' as const,
          coordinates: [lng, lat] as [number, number],
        },
        imageUrl: imageUrl || undefined,
      };
      const result = await submitOrQueue('civic_issue', payload);
      
      if (result.online) {
        Alert.alert('✅ Submitted', 'Your civic issue has been reported to the appropriate department.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      } else {
        Alert.alert('📡 Offline', 'Your civic issue has been saved offline and will sync automatically when reconnected.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
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
            <Text style={typography.h1}>🏙️ Report Civic Issue</Text>
            <Text style={[typography.bodySmall, { marginTop: spacing.xs }]}>Help improve the city by reporting non-emergency issues.</Text>
          </FadeInView>

          <FadeInView delay={200} style={styles.section}>
            <Text style={typography.label}>Category</Text>
            <View style={styles.typeGrid}>
              {CATEGORIES.map((type) => {
                const sel = category === type.value;
                return (
                  <TouchableOpacity
                    key={type.value}
                    onPress={() => setCategory(type.value)}
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
            <Text style={typography.label}>Description</Text>
            <TextInput
              style={[shared.input, { minHeight: 120, textAlignVertical: 'top' }]}
              placeholder="Describe the issue in detail..."
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
                onPress={() => setImageUrl('https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=1470&auto=format&fit=crop')}
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
              style={[shared.buttonPrimary, { paddingVertical: spacing.xl, borderRadius: radius.xl, backgroundColor: colors.blue600 }, loading && shared.buttonDisabled]}
              activeOpacity={0.8}
            >
              {loading ? (
                <>
                  <ActivityIndicator color="#fff" size="small" style={{ marginRight: 10 }} />
                  <Text style={shared.buttonPrimaryText}>Submitting...</Text>
                </>
              ) : (
                <Text style={shared.buttonPrimaryText}>Submit Civic Report</Text>
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
    flexBasis: '22%', flexGrow: 1, paddingVertical: spacing.md, borderRadius: radius.xl,
    alignItems: 'center', borderWidth: 2, borderColor: colors.dark700, backgroundColor: colors.dark900,
  },
  typeCardSelected: { borderColor: colors.blue500, backgroundColor: 'rgba(59, 130, 246, 0.1)' },
  typeLabel: { fontSize: 12, fontWeight: '700', color: colors.dark300, textAlign: 'center' },
  typeLabelSelected: { color: colors.blue400 },

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
