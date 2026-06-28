import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Easing } from 'react-native';
import { colors, radius } from '../theme/colors';

interface EmergencyButtonProps {
  onPress: () => void;
  label?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function EmergencyButton({ onPress, label = 'Request Help' }: EmergencyButtonProps) {
  // Ripple rings
  const ring1Scale = useRef(new Animated.Value(1)).current;
  const ring1Opacity = useRef(new Animated.Value(0.6)).current;
  const ring2Scale = useRef(new Animated.Value(1)).current;
  const ring2Opacity = useRef(new Animated.Value(0.4)).current;

  // Button scale
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Continuous pulse effect
    const animateRing1 = () => {
      ring1Scale.setValue(1);
      ring1Opacity.setValue(0.6);
      Animated.parallel([
        Animated.timing(ring1Scale, { toValue: 1.5, duration: 2000, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(ring1Opacity, { toValue: 0, duration: 2000, easing: Easing.out(Easing.ease), useNativeDriver: true })
      ]).start(() => animateRing1());
    };

    const animateRing2 = () => {
      ring2Scale.setValue(1);
      ring2Opacity.setValue(0.4);
      Animated.parallel([
        Animated.timing(ring2Scale, { toValue: 1.6, duration: 2000, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(ring2Opacity, { toValue: 0, duration: 2000, easing: Easing.out(Easing.ease), useNativeDriver: true })
      ]).start(() => animateRing2());
    };

    animateRing1();
    setTimeout(animateRing2, 1000);
  }, []);

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.92, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  };

  return (
    <View style={styles.wrapper}>
      {/* Animated Rings */}
      <Animated.View style={[styles.ring, styles.ring1, { transform: [{ scale: ring1Scale }], opacity: ring1Opacity }]} />
      <Animated.View style={[styles.ring, styles.ring2, { transform: [{ scale: ring2Scale }], opacity: ring2Opacity }]} />

      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.buttonBase, { transform: [{ scale }] }]}
        accessibilityRole="button"
        accessibilityLabel="Emergency SOS button"
      >
        <View style={styles.innerGradient}>
          <Text style={styles.sosText}>SOS</Text>
          <Text style={styles.labelText}>{label}</Text>
        </View>
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 240,
    height: 240,
  },
  ring: {
    position: 'absolute',
    borderRadius: radius.full,
    backgroundColor: colors.primary500,
  },
  ring1: {
    width: 170,
    height: 170,
  },
  ring2: {
    width: 150,
    height: 150,
  },
  buttonBase: {
    width: 160,
    height: 160,
    borderRadius: radius.full,
    backgroundColor: colors.primary600,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary500,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.8,
    shadowRadius: 24,
    elevation: 20,
    padding: 8,
  },
  innerGradient: {
    width: '100%',
    height: '100%',
    borderRadius: radius.full,
    backgroundColor: colors.primary500,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  sosText: {
    color: colors.white,
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  labelText: {
    color: colors.primary50,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
