import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

interface LoaderProps {
  text?: string;
  size?: 'small' | 'large';
  color?: string;
  fullscreen?: boolean;
}

export function Loader({ text = 'Loading...', size = 'large', color = colors.primary500, fullscreen = false }: LoaderProps) {
  const content = (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
      {text ? <Text style={styles.text}>{text}</Text> : null}
    </View>
  );

  if (fullscreen) {
    return (
      <View style={[styles.fullscreen, { backgroundColor: colors.dark950 }]}>
        {content}
      </View>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  fullscreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    marginTop: 12,
    fontSize: 14,
    color: colors.dark300,
  }
});
