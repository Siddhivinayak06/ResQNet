import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Incident } from '../services/incidentService';
import { formatDate, statusColor, incidentTypeLabel } from '../utils/helpers';
import { colors, radius } from '../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface IncidentDetailModalProps {
  visible: boolean;
  incident: Incident | null;
  userLocation: { latitude: number; longitude: number } | null;
  onClose: () => void;
}

// ─── Haversine distance (km) ─────────────────────────────────
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): string {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(1)}km`;
}

const TYPE_META: Record<string, { emoji: string; color: string }> = {
  medical: { emoji: '🏥', color: '#3b82f6' },
  fire: { emoji: '🔥', color: '#ef4444' },
  accident: { emoji: '🚗', color: '#f59e0b' },
  crime: { emoji: '🚔', color: '#8b5cf6' },
  disaster: { emoji: '🌊', color: '#eab308' },
};

export default function IncidentDetailModal({
  visible,
  incident,
  userLocation,
  onClose,
}: IncidentDetailModalProps) {
  if (!incident) return null;

  const meta = TYPE_META[incident.incidentType] || { emoji: '📍', color: colors.dark400 };
  const sColor = statusColor(incident.status);
  const distance =
    userLocation
      ? calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          incident.latitude,
          incident.longitude
        )
      : null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              {/* Handle bar */}
              <View style={styles.handleRow}>
                <View style={styles.handle} />
              </View>

              {/* Header */}
              <View style={styles.headerRow}>
                <View style={[styles.typeIcon, { backgroundColor: `${meta.color}20` }]}>
                  <Text style={{ fontSize: 28 }}>{meta.emoji}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={styles.title}>{incidentTypeLabel(incident.incidentType)}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: `${sColor}20` }]}>
                    <View style={[styles.statusDot, { backgroundColor: sColor }]} />
                    <Text style={[styles.statusText, { color: sColor }]}>
                      {incident.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Description */}
              <View style={styles.descSection}>
                <Text style={styles.sectionLabel}>Description</Text>
                <Text style={styles.descText}>{incident.description}</Text>
              </View>

              {/* Info Grid */}
              <View style={styles.infoGrid}>
                {distance && (
                  <InfoTile icon="📏" label="Distance" value={distance} />
                )}
                <InfoTile
                  icon="🕐"
                  label="Reported"
                  value={formatDate(incident.reportedAt)}
                />
                <InfoTile
                  icon="📍"
                  label="Location"
                  value={`${incident.latitude.toFixed(4)}, ${incident.longitude.toFixed(4)}`}
                />
              </View>

              {/* Close */}
              <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
                <Text style={styles.closeBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

function InfoTile({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoTile}>
      <Text style={{ fontSize: 18, marginBottom: 4 }}>{icon}</Text>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.dark900,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.dark700,
    maxHeight: '80%',
  },
  handleRow: { alignItems: 'center', paddingTop: 12, paddingBottom: 8 },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.dark600,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  typeIcon: {
    width: 56, height: 56, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { color: colors.white, fontSize: 20, fontWeight: 'bold' },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 999, marginTop: 6, alignSelf: 'flex-start',
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },

  descSection: {
    paddingHorizontal: 24, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: colors.dark800,
  },
  sectionLabel: { color: colors.dark400, fontSize: 12, fontWeight: '600', marginBottom: 6 },
  descText: { color: colors.dark200, fontSize: 15, lineHeight: 22 },

  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 8,
  },
  infoTile: {
    flex: 1,
    minWidth: (SCREEN_WIDTH - 56) / 3,
    backgroundColor: colors.dark800,
    borderRadius: radius.md,
    padding: 12,
    alignItems: 'center',
  },
  infoLabel: { color: colors.dark500, fontSize: 10, fontWeight: '600', marginBottom: 2 },
  infoValue: { color: colors.white, fontSize: 12, fontWeight: '600', textAlign: 'center' },

  closeBtn: {
    marginHorizontal: 24,
    marginTop: 20,
    backgroundColor: colors.dark800,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.dark700,
  },
  closeBtnText: { color: colors.dark300, fontWeight: '600', fontSize: 16 },
});
