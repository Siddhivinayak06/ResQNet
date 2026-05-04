import React, { useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MapView, { Marker, Callout, Region, PROVIDER_DEFAULT } from 'react-native-maps';
import { Incident } from '../services/incidentService';
import { colors, radius } from '../theme/colors';
import { formatDate } from '../utils/helpers';

// ─── Marker Colors by Type ──────────────────────────────────
const MARKER_COLORS: Record<string, string> = {
  medical: '#3b82f6',   // Blue
  fire: '#ef4444',       // Red
  accident: '#f59e0b',   // Orange
  crime: '#8b5cf6',      // Purple
  disaster: '#eab308',   // Yellow
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

  const initialRegion: Region = {
    latitude: userLocation?.latitude ?? 19.076,
    longitude: userLocation?.longitude ?? 72.8777,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  const centerOnUser = useCallback(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          ...userLocation,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        600
      );
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
        customMapStyle={darkMapStyle}
      >
        {incidents.map((incident) => {
          const color = MARKER_COLORS[incident.incidentType] || colors.dark400;
          return (
            <Marker
              key={incident._id}
              coordinate={{
                latitude: incident.latitude,
                longitude: incident.longitude,
              }}
              pinColor={color}
              onPress={() => onMarkerPress?.(incident)}
            >
              <Callout tooltip>
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle}>
                    {MARKER_EMOJI[incident.incidentType] || '📍'}{' '}
                    {incident.incidentType.charAt(0).toUpperCase() +
                      incident.incidentType.slice(1)}
                  </Text>
                  <Text style={styles.calloutDesc} numberOfLines={2}>
                    {incident.description}
                  </Text>
                  <Text style={styles.calloutTime}>
                    {formatDate(incident.reportedAt)}
                  </Text>
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      {/* Zoom to user button */}
      <TouchableOpacity style={styles.locateBtn} onPress={centerOnUser} activeOpacity={0.8}>
        <Text style={{ fontSize: 20 }}>📍</Text>
      </TouchableOpacity>

      {/* Live indicator */}
      <View style={styles.liveTag}>
        <View style={styles.liveDot} />
        <Text style={styles.liveText}>LIVE</Text>
      </View>
    </View>
  );
}

// ─── Dark map style ──────────────────────────────────────────
const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
  { featureType: 'water', elementType: 'geometry.fill', stylers: [{ color: '#0e1626' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#255763' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#283d6a' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
];

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.dark800,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  callout: {
    backgroundColor: colors.dark900,
    borderRadius: radius.md,
    padding: 12,
    maxWidth: 220,
    borderWidth: 1,
    borderColor: colors.dark700,
  },
  calloutTitle: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  calloutDesc: {
    color: colors.dark300,
    fontSize: 12,
    marginBottom: 4,
    lineHeight: 16,
  },
  calloutTime: {
    color: colors.dark500,
    fontSize: 10,
  },
  locateBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.dark900,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.dark700,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  liveTag: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.dark700,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
    marginRight: 6,
  },
  liveText: {
    color: colors.success,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
