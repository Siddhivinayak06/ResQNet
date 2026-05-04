import React from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { colors, radius } from '../../theme/colors';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation<any>();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const roleLabel = (role: string) => {
    const labels: Record<string, string> = {
      user: '🛡️ Citizen',
      volunteer: '🚑 Volunteer',
      admin: '⚙️ Admin',
    };
    return labels[role] || role;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarLetter}>{user?.name?.charAt(0)?.toUpperCase() || '?'}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{roleLabel(user?.role || 'user')}</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickRow}>
          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => navigation.navigate('FirstAid')}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Open First Aid Guide"
          >
            <Text style={{ fontSize: 28, marginBottom: 6 }}>🏥</Text>
            <Text style={styles.quickLabel}>First Aid</Text>
            <Text style={styles.quickHint}>Offline guide</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => navigation.navigate('EmergencyContacts')}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Open Emergency Contacts"
          >
            <Text style={{ fontSize: 28, marginBottom: 6 }}>📞</Text>
            <Text style={styles.quickLabel}>Contacts</Text>
            <Text style={styles.quickHint}>Quick call</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Info Card */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.infoCard}>
          <InfoRow label="Full Name" value={user?.name || '—'} />
          <Divider />
          <InfoRow label="Email" value={user?.email || '—'} />
          <Divider />
          <InfoRow label="Phone" value={user?.phoneNumber || 'Not set'} />
          <Divider />
          <InfoRow label="Role" value={roleLabel(user?.role || 'user')} />
          <Divider />
          <InfoRow
            label="Member Since"
            value={
              user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })
                : '—'
            }
          />
        </View>
      </View>

      {/* Logout */}
      <View style={styles.logoutSection}>
        <TouchableOpacity
          onPress={handleLogout}
          style={styles.logoutBtn}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
        >
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>ResQNet v1.0.0</Text>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={infoStyles.row} accessibilityLabel={`${label}: ${value}`}>
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={infoStyles.value}>{value}</Text>
    </View>
  );
}

function Divider() {
  return <View style={infoStyles.divider} />;
}

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
  },
  label: { color: colors.dark400, fontSize: 14 },
  value: { color: colors.white, fontSize: 14, fontWeight: '500', maxWidth: '60%', textAlign: 'right' },
  divider: { height: 1, backgroundColor: colors.dark700, marginHorizontal: 20 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.dark950 },

  // Avatar
  avatarSection: { alignItems: 'center', paddingTop: 32, paddingBottom: 20 },
  avatar: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: colors.primary600,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    shadowColor: colors.primary500,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  avatarLetter: { color: colors.white, fontSize: 40, fontWeight: 'bold' },
  name: { color: colors.white, fontSize: 24, fontWeight: 'bold' },
  email: { color: colors.dark400, fontSize: 14, marginTop: 4 },
  roleBadge: {
    marginTop: 8, backgroundColor: colors.primary600_20,
    paddingHorizontal: 16, paddingVertical: 6, borderRadius: 999,
  },
  roleText: { color: colors.primary400, fontSize: 12, fontWeight: 'bold' },

  // Sections
  section: { paddingHorizontal: 24, marginBottom: 8 },
  sectionTitle: { color: colors.dark400, fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 12, textTransform: 'uppercase' },

  // Quick Actions
  quickRow: { flexDirection: 'row', gap: 12 },
  quickCard: {
    flex: 1, backgroundColor: colors.dark900, borderWidth: 1, borderColor: colors.dark700,
    borderRadius: radius.xl, paddingVertical: 20, alignItems: 'center',
  },
  quickLabel: { color: colors.white, fontSize: 14, fontWeight: '600' },
  quickHint: { color: colors.dark500, fontSize: 11, marginTop: 2 },

  // Info Card
  infoCard: {
    backgroundColor: colors.dark900, borderWidth: 1, borderColor: colors.dark700,
    borderRadius: radius.xl, overflow: 'hidden',
  },

  // Logout
  logoutSection: { paddingHorizontal: 24, marginTop: 16, marginBottom: 48 },
  logoutBtn: {
    backgroundColor: colors.dark900, borderWidth: 1, borderColor: colors.primary800,
    borderRadius: radius.xl, paddingVertical: 16, alignItems: 'center',
  },
  logoutText: { color: colors.primary400, fontWeight: 'bold', fontSize: 16 },
  version: { color: colors.dark600, fontSize: 11, textAlign: 'center', marginTop: 16 },
});
