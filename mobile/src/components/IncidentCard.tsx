import React, { useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { formatDate, incidentTypeLabel, statusColor } from '../utils/helpers';
import { colors, radius, spacing } from '../theme/colors';
import { typography, shared } from '../theme/styles';

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

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function IncidentCard({ incident, onPress }: IncidentCardProps) {
  const sColor = statusColor(incident.status);
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.card, { transform: [{ scale }] }]}
      accessibilityRole="button"
      accessibilityLabel={`${incident.incidentType} incident, status ${incident.status}`}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={typography.h4}>{incidentTypeLabel(incident.incidentType)}</Text>
        <View style={[styles.badge, { backgroundColor: `${sColor}20`, borderColor: `${sColor}40` }]}>
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
        <View style={styles.locationPill}>
          <Text style={styles.footerText}>
            📍 {incident.latitude.toFixed(4)}, {incident.longitude.toFixed(4)}
          </Text>
        </View>
        <Text style={styles.timeText}>{formatDate(incident.reportedAt)}</Text>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.glassCard,
    borderWidth: 1,
    borderColor: colors.glassLight,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shared.shadow,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  description: {
    ...typography.bodySmall,
    color: colors.dark200,
    marginBottom: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.dark800,
    paddingTop: spacing.md,
  },
  locationPill: {
    backgroundColor: colors.dark900,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  footerText: {
    color: colors.dark400,
    fontSize: 11,
    fontWeight: '600',
  },
  timeText: {
    color: colors.dark500,
    fontSize: 11,
  },
});

export default React.memo(IncidentCard);
