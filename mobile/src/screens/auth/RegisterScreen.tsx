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
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../hooks/useAuth';
import { ApiError } from '../../services/api';
import { colors, radius, spacing } from '../../theme/colors';
import { typography, shared } from '../../theme/styles';

type Props = NativeStackScreenProps<any, 'Register'>;

const ROLES = [
  { value: 'user', emoji: '🛡️', label: 'Citizen' },
  { value: 'volunteer', emoji: '🚑', label: 'Volunteer' },
  { value: 'admin', emoji: '⚙️', label: 'Admin' },
];

const FadeInView = ({ children, delay = 0, style, down = false }: any) => {
  const anim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [down ? -20 : 20, 0],
  });

  return (
    <Animated.View style={[style, { opacity: anim, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
};

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
    <SafeAreaView style={shared.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            {/* Header */}
            <FadeInView down delay={0} style={styles.header}>
              <Text style={typography.h1}>Create Account</Text>
              <Text style={styles.subtitle}>Join the rescue network today</Text>
            </FadeInView>

            {/* Error */}
            {error !== '' && (
              <View style={shared.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Form */}
            <FadeInView delay={200} style={shared.cardGlass}>
              <Text style={typography.label}>Full Name</Text>
              <TextInput
                style={shared.input}
                placeholder="John Doe"
                placeholderTextColor={colors.dark600}
                value={name}
                onChangeText={(t) => { setName(t); clearError(); }}
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
                editable={!loading}
              />

              <Text style={typography.label}>Email Address</Text>
              <TextInput
                ref={emailRef}
                style={shared.input}
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

              <Text style={typography.label}>Password</Text>
              <TextInput
                ref={passwordRef}
                style={shared.input}
                placeholder="Min. 6 characters"
                placeholderTextColor={colors.dark600}
                value={password}
                onChangeText={(t) => { setPassword(t); clearError(); }}
                secureTextEntry
                returnKeyType="next"
                onSubmitEditing={() => confirmRef.current?.focus()}
                editable={!loading}
              />

              <Text style={typography.label}>Confirm Password</Text>
              <TextInput
                ref={confirmRef}
                style={shared.input}
                placeholder="Re-enter password"
                placeholderTextColor={colors.dark600}
                value={confirmPassword}
                onChangeText={(t) => { setConfirmPassword(t); clearError(); }}
                secureTextEntry
                returnKeyType="done"
                editable={!loading}
              />

              {/* Role Picker */}
              <Text style={typography.label}>Select your role</Text>
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
                      <Text style={{ fontSize: 20, marginBottom: 4 }}>{r.emoji}</Text>
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
                style={[shared.buttonPrimary, { marginTop: spacing.md }, loading && shared.buttonDisabled]}
                activeOpacity={0.8}
              >
                {loading && <ActivityIndicator color="#fff" size="small" style={{ marginRight: 8 }} />}
                <Text style={shared.buttonPrimaryText}>
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Text>
              </TouchableOpacity>
            </FadeInView>

            <FadeInView delay={400} style={styles.linkRow}>
              <Text style={typography.bodySmall}>
                Already have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.goBack()} disabled={loading}>
                <Text style={styles.linkBold}>Sign In</Text>
              </TouchableOpacity>
            </FadeInView>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  container: {
    paddingHorizontal: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  subtitle: {
    color: colors.dark400,
    fontSize: 14,
    marginTop: spacing.xs,
  },
  errorText: {
    color: colors.primary300,
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  roleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  roleBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.dark700,
    backgroundColor: colors.dark900,
  },
  roleBtnSelected: {
    backgroundColor: colors.primary500,
    borderColor: colors.primary400,
  },
  roleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.dark400,
  },
  roleLabelSelected: {
    color: colors.white,
  },
  linkRow: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkBold: {
    color: colors.primary500,
    fontWeight: '700',
    fontSize: 14,
  },
});
