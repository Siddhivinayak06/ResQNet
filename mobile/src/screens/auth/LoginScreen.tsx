import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../hooks/useAuth';
import { ApiError } from '../../services/api';
import { colors, radius } from '../../theme/colors';

type Props = NativeStackScreenProps<any, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const passwordRef = useRef<TextInput>(null);

  const handleLogin = async () => {
    setError('');
    if (!email.trim()) { setError('Email is required'); return; }
    if (!password.trim()) { setError('Password is required'); return; }

    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else if (err instanceof Error) setError(err.message);
      else setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.flex}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        style={styles.bg}
      >
        <View style={styles.container}>
          {/* Logo */}
          <View style={styles.logoSection}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoLetter}>R</Text>
            </View>
            <Text style={styles.logoTitle}>ResQNet</Text>
            <Text style={styles.logoSubtitle}>Emergency Rescue Network</Text>
          </View>

          {/* Error Banner */}
          {error !== '' && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Form Card */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Sign In</Text>

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={colors.dark600}
              value={email}
              onChangeText={(t) => { setEmail(t); setError(''); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              editable={!loading}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              ref={passwordRef}
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={colors.dark600}
              value={password}
              onChangeText={(t) => { setPassword(t); setError(''); }}
              secureTextEntry
              returnKeyType="go"
              onSubmitEditing={handleLogin}
              editable={!loading}
            />

            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              style={[styles.button, loading && styles.buttonDisabled]}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={loading ? 'Signing in' : 'Sign in'}
            >
              {loading && <ActivityIndicator color="#fff" size="small" style={{ marginRight: 8 }} />}
              <Text style={styles.buttonText}>
                {loading ? 'Signing In...' : 'Sign In'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Register link */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            style={styles.linkRow}
            disabled={loading}
          >
            <Text style={styles.linkText}>
              Don't have an account?{' '}
              <Text style={styles.linkBold}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bg: { backgroundColor: colors.dark950 },
  scrollContent: { flexGrow: 1, justifyContent: 'center' },
  container: { paddingHorizontal: 32 },

  // Logo
  logoSection: { alignItems: 'center', marginBottom: 40 },
  logoCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.primary600,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
    shadowColor: colors.primary500,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 10,
  },
  logoLetter: { color: colors.white, fontSize: 28, fontWeight: 'bold' },
  logoTitle: { color: colors.white, fontSize: 30, fontWeight: 'bold' },
  logoSubtitle: { color: colors.dark400, fontSize: 14, marginTop: 4 },

  // Error
  errorBanner: {
    backgroundColor: colors.red900_30,
    borderWidth: 1, borderColor: colors.red700_50,
    borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 12,
    marginBottom: 16,
  },
  errorText: { color: colors.primary300, fontSize: 14, textAlign: 'center' },

  // Form
  formCard: {
    backgroundColor: colors.dark900,
    borderWidth: 1, borderColor: colors.dark700,
    borderRadius: radius.xl, padding: 24,
  },
  formTitle: { color: colors.white, fontSize: 20, fontWeight: 'bold', marginBottom: 24 },
  label: { color: colors.dark300, fontSize: 14, marginBottom: 8 },
  input: {
    backgroundColor: colors.dark800,
    borderWidth: 1, borderColor: colors.dark600,
    borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 14,
    color: colors.white, fontSize: 16, marginBottom: 16,
  },

  // Button
  button: {
    backgroundColor: colors.primary600,
    borderRadius: radius.md, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: 8,
  },
  buttonDisabled: { backgroundColor: colors.primary800 },
  buttonText: { color: colors.white, fontWeight: 'bold', fontSize: 16 },

  // Link
  linkRow: { marginTop: 24, alignItems: 'center' },
  linkText: { color: colors.dark400, fontSize: 14 },
  linkBold: { color: colors.primary400, fontWeight: '600' },
});
