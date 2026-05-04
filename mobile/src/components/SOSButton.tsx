import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Animated,
  TouchableWithoutFeedback,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { getCurrentLocation } from '../utils/location';
import { incidentService } from '../services/incidentService';
import { ApiError } from '../services/api';
import { colors } from '../theme/colors';

const HOLD_DURATION = 3000; // 3 seconds

interface SOSButtonProps {
  size?: number;
}

export default function SOSButton({ size = 80 }: SOSButtonProps) {
  const [holding, setHolding] = useState(false);
  const [sending, setSending] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Pulse animation loop ──
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const onPressIn = () => {
    if (sending) return;
    setHolding(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Progress ring animation
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: HOLD_DURATION,
      useNativeDriver: false,
    }).start();

    // Trigger after hold
    holdTimer.current = setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      triggerSOS();
    }, HOLD_DURATION);
  };

  const onPressOut = () => {
    if (sending) return;
    setHolding(false);
    progressAnim.setValue(0);
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  };

  const triggerSOS = async () => {
    setHolding(false);
    setSending(true);

    try {
      let lat = 0;
      let lng = 0;
      try {
        const loc = await getCurrentLocation();
        lat = loc.latitude;
        lng = loc.longitude;
      } catch {
        // Proceed without location
      }

      await incidentService.reportIncident({
        incidentType: 'medical',
        description: '🚨 SOS EMERGENCY — Immediate help needed!',
        latitude: lat,
        longitude: lng,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('🚨 SOS Sent', 'Your emergency alert has been broadcast. Help is on the way!');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to send SOS. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setSending(false);
      progressAnim.setValue(0);
    }
  };

  const ringColor = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(239,68,68,0.3)', 'rgba(239,68,68,0.8)'],
  });

  const ringScale = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.25],
  });

  return (
    <View style={styles.wrapper}>
      {/* Pulse ring */}
      <Animated.View
        style={[
          styles.pulseRing,
          {
            width: size + 32,
            height: size + 32,
            borderRadius: (size + 32) / 2,
            transform: [{ scale: holding ? ringScale : pulseAnim }],
            backgroundColor: holding ? ringColor : 'rgba(239,68,68,0.15)',
          },
        ]}
      />

      {/* Button */}
      <TouchableWithoutFeedback
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={sending}
      >
        <View
          style={[
            styles.button,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: holding ? colors.primary700 : colors.primary600,
            },
          ]}
        >
          {sending ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <>
              <Text style={styles.sosText}>SOS</Text>
              <Text style={styles.holdHint}>
                {holding ? 'Hold...' : 'Hold 3s'}
              </Text>
            </>
          )}
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary500,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
  },
  sosText: {
    color: colors.white,
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  holdHint: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 9,
    marginTop: 2,
  },
});
