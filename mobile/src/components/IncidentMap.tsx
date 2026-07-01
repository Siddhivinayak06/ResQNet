import React, { useRef, useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Easing, TouchableOpacity, ScrollView } from 'react-native';
import MapView from 'react-native-map-clustering';
import { Marker, Callout, Region, PROVIDER_DEFAULT, Polyline } from 'react-native-maps';
import { Incident } from '../services/incidentService';
import { CivicIssue } from '../services/civicIssueService';
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
  hazmat: '#eab308',
  rescue: '#3b82f6',
  other: colors.dark400,
};

const MARKER_EMOJI: Record<string, string> = {
  medical: '🏥',
  fire: '🔥',
  accident: '🚗',
  crime: '🚔',
  disaster: '🌊',
  hazmat: '☣️',
  rescue: '🚁',
  other: '⚠️',
};

interface IncidentMapProps {
  incidents: Incident[];
  civicIssues?: CivicIssue[];
  volunteers?: any[]; // optional volunteers list
  userLocation: { latitude: number; longitude: number } | null;
  onMarkerPress?: (item: any) => void;
  style?: object;
}

export default function IncidentMap({
  incidents,
  civicIssues = [],
  volunteers = [],
  userLocation,
  onMarkerPress,
  style,
}: IncidentMapProps) {
  const mapRef = useRef<any>(null);
  const dotOpacity = useRef(new Animated.Value(1)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  // Filter States
  const [showIncidents, setShowIncidents] = useState(true);
  const [showCivic, setShowCivic] = useState(true);
  const [showVolunteers, setShowVolunteers] = useState(true);

  // Selected item for mock routing
  const [selectedItem, setSelectedItem] = useState<any>(null);

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

  const handleMarkerPress = (item: any) => {
    setSelectedItem(item);
    onMarkerPress?.(item);
  };

  return (
    <View style={[styles.container, style]}>
      {/* Map Content */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        customMapStyle={uberDarkMapStyle}
        clusterColor={colors.primary500}
        clusterTextColor={colors.white}
      >
        {/* Incidents Layer */}
        {showIncidents && incidents.map((incident) => {
          const color = MARKER_COLORS[incident.incidentType] || colors.dark400;
          return (
            <Marker
              key={`inc-${incident._id}`}
              coordinate={{ latitude: incident.latitude, longitude: incident.longitude }}
              pinColor={color}
              onPress={() => handleMarkerPress(incident)}
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

        {/* Civic Issues Layer */}
        {showCivic && civicIssues.map((issue) => {
          if (!issue.latitude || !issue.longitude) return null;
          return (
            <Marker
              key={`civic-${issue._id}`}
              coordinate={{ latitude: issue.latitude, longitude: issue.longitude }}
              pinColor={colors.purple}
              onPress={() => handleMarkerPress(issue)}
              tracksViewChanges={false}
            >
              <Callout tooltip>
                <View style={styles.callout}>
                  <Text style={typography.h4}>🏙️ {issue.category.replace('_', ' ').toUpperCase()}</Text>
                  <Text style={styles.calloutDesc} numberOfLines={2}>{issue.description}</Text>
                  <Text style={styles.calloutTime}>{issue.status}</Text>
                </View>
              </Callout>
            </Marker>
          );
        })}

        {selectedItem && userLocation && (
          <Polyline
            coordinates={[
              { latitude: userLocation.latitude, longitude: userLocation.longitude },
              { latitude: selectedItem.latitude, 
                longitude: selectedItem.longitude }
            ]}
            strokeColor={colors.primary500}
            strokeWidth={3}
            lineDashPattern={[5, 5]}
          />
        )}
      </MapView>

      {/* Floating Filter Pills */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity 
            style={[styles.filterPill, showIncidents && styles.filterPillActive]} 
            onPress={() => setShowIncidents(!showIncidents)}
          >
            <Text style={styles.filterPillText}>🚨 Incidents</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterPill, showCivic && styles.filterPillActive]} 
            onPress={() => setShowCivic(!showCivic)}
          >
            <Text style={styles.filterPillText}>🏙️ Civic Issues</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <AnimatedPressable
        style={[styles.locateBtn, { transform: [{ scale: btnScale }] }]}
        onPress={centerOnUser}
        onPressIn={() => {
          Animated.spring(btnScale, { toValue: 0.9, useNativeDriver: true }).start();
        }}
        onPressOut={() => {
          Animated.spring(btnScale, { toValue: 1, useNativeDriver: true }).start();
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
  
  filterBar: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    right: 70, // leave space for locateBtn
  },
  filterPill: {
    backgroundColor: colors.glassDark,
    borderWidth: 1,
    borderColor: colors.dark600,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
    marginRight: spacing.xs,
  },
  filterPillActive: {
    backgroundColor: colors.primary500,
    borderColor: colors.primary400,
  },
  filterPillText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  }
});
