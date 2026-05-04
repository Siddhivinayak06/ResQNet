import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

interface EmergencyButtonProps {
  onPress: () => void;
  label?: string;
}

export default function EmergencyButton({ onPress, label = 'Request Help' }: EmergencyButtonProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.wrapper}>
      <View style={styles.outerRing}>
        <View style={styles.innerRing}>
          <Text style={styles.sosText}>SOS</Text>
          <Text style={styles.labelText}>{label}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.primary600,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary500,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  innerRing: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: colors.primary500,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary400,
  },
  sosText: {
    color: colors.white,
    fontSize: 30,
    fontWeight: 'bold',
  },
  labelText: {
    color: colors.primary100,
    fontSize: 11,
    marginTop: 4,
  },
});
