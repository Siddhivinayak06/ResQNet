import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { formatDate, incidentTypeLabel, statusColor } from '../utils/helpers';
import { colors } from '../theme/colors';

interface IncidentCardProps {
  incident: {
    _id: string;
    incidentType: string;
    description: string;
    status: string;
    reportedAt: string;
    latitude: number;
    longitude: number;
  };
  onPress?: () => void;
}

function IncidentCard({ incident, onPress }: IncidentCardProps) {
  const sColor = statusColor(incident.status);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.card}
      accessibilityRole="button"
      accessibilityLabel={`${incident.incidentType} incident, status ${incident.status}`}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.type}>{incidentTypeLabel(incident.incidentType)}</Text>
        <View style={[styles.badge, { backgroundColor: `${sColor}20` }]}>
          <Text style={[styles.badgeText, { color: sColor }]}>
            {incident.status.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Description */}
      <Text style={styles.description} numberOfLines={2}>
        {incident.description}
      </Text>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          📍 {incident.latitude.toFixed(4)}, {incident.longitude.toFixed(4)}
        </Text>
        <Text style={styles.footerText}>{formatDate(incident.reportedAt)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.dark800,
    borderWidth: 1,
    borderColor: colors.dark700,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  type: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  description: {
    color: colors.dark300,
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerText: {
    color: colors.dark500,
    fontSize: 11,
  },
});

export default React.memo(IncidentCard);
