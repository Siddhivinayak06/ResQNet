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

type Props = NativeStackScreenProps<any, 'Login'>;

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
            {/* Animated Logo Section */}
            <FadeInView down delay={0} style={styles.logoSection}>
              <View style={styles.logoCircle}>
                <Text style={styles.logoLetter}>R</Text>
              </View>
              <Text style={typography.h1}>ResQNet</Text>
              <Text style={styles.logoSubtitle}>Emergency Rescue Network</Text>
            </FadeInView>

            {/* Form Card */}
            <FadeInView delay={200} style={shared.cardGlass}>
              <Text style={typography.sectionTitle}>Welcome Back</Text>
              <Text style={[typography.bodySmall, { marginBottom: spacing.lg }]}>
                Sign in to manage emergencies
              </Text>

              {/* Error Banner */}
              {error !== '' && (
                <View style={shared.errorBanner}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <Text style={typography.label}>Email Address</Text>
              <TextInput
                style={shared.input}
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

              <Text style={typography.label}>Password</Text>
              <TextInput
                ref={passwordRef}
                style={shared.input}
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
                style={[shared.buttonPrimary, { marginTop: spacing.md }, loading && shared.buttonDisabled]}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={loading ? 'Signing in' : 'Sign in'}
              >
                {loading && <ActivityIndicator color="#fff" size="small" style={{ marginRight: 8 }} />}
                <Text style={shared.buttonPrimaryText}>
                  {loading ? 'Authenticating...' : 'Sign In'}
                </Text>
              </TouchableOpacity>
            </FadeInView>

            {/* Register link */}
            <FadeInView delay={400} style={styles.linkRow}>
              <Text style={typography.bodySmall}>
                Don't have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')} disabled={loading}>
                <Text style={styles.linkBold}>Create Account</Text>
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
  logoSection: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: radius.full,
    backgroundColor: colors.primary500,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    ...shared.glowRed,
  },
  logoLetter: {
    color: colors.white,
    fontSize: 40,
    fontWeight: '900',
  },
  logoSubtitle: {
    color: colors.dark400,
    fontSize: 14,
    marginTop: spacing.xs,
    letterSpacing: 0.5,
  },
  errorText: {
    color: colors.primary300,
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
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
