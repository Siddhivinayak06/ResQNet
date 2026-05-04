import React from 'react';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

interface LoaderProps {
  message?: string;
  size?: 'small' | 'large';
}

export default function Loader({ message = 'Loading...', size = 'large' }: LoaderProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={colors.primary500} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dark950,
  },
  message: {
    color: colors.dark400,
    fontSize: 14,
    marginTop: 16,
  },
});
