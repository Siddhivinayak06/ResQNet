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

type Props = NativeStackScreenProps<any, 'Register'>;

const ROLES = [
  { value: 'user', emoji: '🛡️', label: 'Citizen' },
  { value: 'volunteer', emoji: '🚑', label: 'Volunteer' },
  { value: 'admin', emoji: '⚙️', label: 'Admin' },
];

export default function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);
  const clearError = () => setError('');

  const validate = (): boolean => {
    if (!name.trim()) { setError('Full name is required'); return false; }
    if (!email.trim()) { setError('Email is required'); return false; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) { setError('Enter a valid email'); return false; }
    if (!password) { setError('Password is required'); return false; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return false; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return false; }
    return true;
  };

  const handleRegister = async () => {
    setError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await register({ name: name.trim(), email: email.trim().toLowerCase(), password, role });
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else if (err instanceof Error) setError(err.message);
      else setError('Registration failed.');
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
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join the rescue network</Text>
          </View>

          {/* Error */}
          {error !== '' && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Form */}
          <View style={styles.card}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="John Doe"
              placeholderTextColor={colors.dark600}
              value={name}
              onChangeText={(t) => { setName(t); clearError(); }}
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
              editable={!loading}
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
              ref={emailRef}
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={colors.dark600}
              value={email}
              onChangeText={(t) => { setEmail(t); clearError(); }}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              editable={!loading}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              ref={passwordRef}
              style={styles.input}
              placeholder="Min. 6 characters"
              placeholderTextColor={colors.dark600}
              value={password}
              onChangeText={(t) => { setPassword(t); clearError(); }}
              secureTextEntry
              returnKeyType="next"
              onSubmitEditing={() => confirmRef.current?.focus()}
              editable={!loading}
            />

            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              ref={confirmRef}
              style={styles.input}
              placeholder="Re-enter password"
              placeholderTextColor={colors.dark600}
              value={confirmPassword}
              onChangeText={(t) => { setConfirmPassword(t); clearError(); }}
              secureTextEntry
              returnKeyType="done"
              editable={!loading}
            />

            {/* Role Picker */}
            <Text style={[styles.label, { marginBottom: 12 }]}>Role</Text>
            <View style={styles.roleRow}>
              {ROLES.map((r) => {
                const selected = role === r.value;
                return (
                  <TouchableOpacity
                    key={r.value}
                    onPress={() => { setRole(r.value); clearError(); }}
                    disabled={loading}
                    style={[
                      styles.roleBtn,
                      selected && styles.roleBtnSelected,
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text style={{ fontSize: 18, marginBottom: 2 }}>{r.emoji}</Text>
                    <Text style={[styles.roleLabel, selected && styles.roleLabelSelected]}>
                      {r.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              onPress={handleRegister}
              disabled={loading}
              style={[styles.button, loading && styles.buttonDisabled]}
              activeOpacity={0.8}
            >
              {loading && <ActivityIndicator color="#fff" size="small" style={{ marginRight: 8 }} />}
              <Text style={styles.buttonText}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.linkRow} disabled={loading}>
            <Text style={styles.linkText}>
              Already have an account?{' '}
              <Text style={styles.linkBold}>Sign In</Text>
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
  container: { paddingHorizontal: 32, paddingVertical: 32 },

  header: { alignItems: 'center', marginBottom: 24 },
  title: { color: colors.white, fontSize: 30, fontWeight: 'bold' },
  subtitle: { color: colors.dark400, fontSize: 14, marginTop: 4 },

  errorBanner: {
    backgroundColor: colors.red900_30, borderWidth: 1, borderColor: colors.red700_50,
    borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16,
  },
  errorText: { color: colors.primary300, fontSize: 14, textAlign: 'center' },

  card: {
    backgroundColor: colors.dark900, borderWidth: 1, borderColor: colors.dark700,
    borderRadius: radius.xl, padding: 24,
  },
  label: { color: colors.dark300, fontSize: 14, marginBottom: 8 },
  input: {
    backgroundColor: colors.dark800, borderWidth: 1, borderColor: colors.dark600,
    borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 14,
    color: colors.white, fontSize: 16, marginBottom: 16,
  },

  roleRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  roleBtn: {
    flex: 1, paddingVertical: 12, borderRadius: radius.md, alignItems: 'center',
    borderWidth: 1, borderColor: colors.dark600, backgroundColor: colors.dark800,
  },
  roleBtnSelected: { backgroundColor: colors.primary600, borderColor: colors.primary500 },
  roleLabel: { fontSize: 11, fontWeight: '600', color: colors.dark400 },
  roleLabelSelected: { color: colors.white },

  button: {
    backgroundColor: colors.primary600, borderRadius: radius.md, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8,
  },
  buttonDisabled: { backgroundColor: colors.primary800 },
  buttonText: { color: colors.white, fontWeight: 'bold', fontSize: 16 },

  linkRow: { marginTop: 24, alignItems: 'center' },
  linkText: { color: colors.dark400, fontSize: 14 },
  linkBold: { color: colors.primary400, fontWeight: '600' },
});
