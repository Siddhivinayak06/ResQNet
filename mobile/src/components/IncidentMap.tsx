import React, { useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Easing } from 'react-native';
import MapView, { Marker, Callout, Region, PROVIDER_DEFAULT } from 'react-native-maps';
import { Incident } from '../services/incidentService';
import { colors, radius, spacing } from '../theme/colors';
import { shared, typography } from '../theme/styles';
import { formatDate } from '../utils/helpers';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const MARKER_COLORS: Record<string, string> = {
  medical: colors.info,
  fire: colors.danger,
  accident: colors.warning,
  crime: colors.purple,
  disaster: colors.danger,
};

const MARKER_EMOJI: Record<string, string> = {
  medical: '🏥',
  fire: '🔥',
  accident: '🚗',
  crime: '🚔',
  disaster: '🌊',
};

interface IncidentMapProps {
  incidents: Incident[];
  userLocation: { latitude: number; longitude: number } | null;
  onMarkerPress?: (incident: Incident) => void;
  style?: object;
}

export default function IncidentMap({
  incidents,
  userLocation,
  onMarkerPress,
  style,
}: IncidentMapProps) {
  const mapRef = useRef<MapView>(null);
  const dotOpacity = useRef(new Animated.Value(1)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotOpacity, {
          toValue: 0.2,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(dotOpacity, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const initialRegion: Region = {
    latitude: userLocation?.latitude ?? 19.076,
    longitude: userLocation?.longitude ?? 72.8777,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  const centerOnUser = useCallback(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({ ...userLocation, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 800);
    }
  }, [userLocation]);

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        customMapStyle={uberDarkMapStyle}
      >
        {incidents.map((incident) => {
          const color = MARKER_COLORS[incident.incidentType] || colors.dark400;
          return (
            <Marker
              key={incident._id}
              coordinate={{ latitude: incident.latitude, longitude: incident.longitude }}
              pinColor={color}
              onPress={() => onMarkerPress?.(incident)}
              tracksViewChanges={false}
            >
              <Callout tooltip>
                <View style={styles.callout}>
                  <Text style={typography.h4}>
                    {MARKER_EMOJI[incident.incidentType] || '📍'}{' '}
                    {incident.incidentType.charAt(0).toUpperCase() + incident.incidentType.slice(1)}
                  </Text>
                  <Text style={styles.calloutDesc} numberOfLines={2}>{incident.description}</Text>
                  <Text style={styles.calloutTime}>{formatDate(incident.reportedAt)}</Text>
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      <AnimatedPressable
        style={[styles.locateBtn, { transform: [{ scale: btnScale }] }]}
        onPress={centerOnUser}
        onPressIn={() => {
          Animated.spring(btnScale, {
            toValue: 0.9,
            useNativeDriver: true,
          }).start();
        }}
        onPressOut={() => {
          Animated.spring(btnScale, {
            toValue: 1,
            useNativeDriver: true,
          }).start();
        }}
      >
        <Text style={{ fontSize: 20 }}>📍</Text>
      </AnimatedPressable>

      <View style={styles.liveTag}>
        <Animated.View style={[styles.liveDot, { opacity: dotOpacity }]} />
        <Text style={styles.liveText}>LIVE TRACKING</Text>
      </View>
    </View>
  );
}

const uberDarkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#020617' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
  { featureType: 'water', elementType: 'geometry.fill', stylers: [{ color: '#0f172a' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#334155' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
];

const styles = StyleSheet.create({
  container: { borderRadius: radius.xl, overflow: 'hidden', backgroundColor: colors.dark950 },
  map: { width: '100%', height: '100%' },
  callout: {
    ...shared.cardGlass,
    padding: spacing.md,
    maxWidth: 240,
    minWidth: 180,
  },
  calloutDesc: { ...typography.bodySmall, marginVertical: spacing.xs },
  calloutTime: { color: colors.dark500, fontSize: 10, fontWeight: '600' },
  locateBtn: {
    position: 'absolute', bottom: spacing.md, right: spacing.md,
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.glassCard,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.glassLight,
  },
  liveTag: {
    position: 'absolute', top: spacing.md, left: spacing.md,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.glassDark,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: radius.full, borderWidth: 1, borderColor: colors.glassLight,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary500, marginRight: 8, ...shared.glowRed },
  liveText: { color: colors.white, fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
});
