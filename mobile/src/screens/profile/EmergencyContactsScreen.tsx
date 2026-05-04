import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  Linking,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, radius } from '../../theme/colors';

// ─── Types ───────────────────────────────────────────────────
interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
}

const STORAGE_KEY = 'resqnet_emergency_contacts';

export default function EmergencyContactsScreen() {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [editing, setEditing] = useState<string | null>(null);

  // ── Load contacts ──
  const loadContacts = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setContacts(JSON.parse(raw));
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  // ── Save contacts ──
  const saveContacts = async (updated: EmergencyContact[]) => {
    setContacts(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  // ── Add / Update ──
  const handleSave = () => {
    if (!name.trim()) { Alert.alert('Error', 'Enter a contact name'); return; }
    if (!phone.trim() || phone.trim().length < 10) {
      Alert.alert('Error', 'Enter a valid phone number'); return;
    }

    if (editing) {
      // Update existing
      const updated = contacts.map((c) =>
        c.id === editing ? { ...c, name: name.trim(), phone: phone.trim() } : c
      );
      saveContacts(updated);
      setEditing(null);
    } else {
      // Add new
      const newContact: EmergencyContact = {
        id: `ec_${Date.now()}`,
        name: name.trim(),
        phone: phone.trim(),
      };
      saveContacts([...contacts, newContact]);
    }
    setName('');
    setPhone('');
  };

  // ── Delete ──
  const handleDelete = (id: string) => {
    Alert.alert('Remove Contact', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => saveContacts(contacts.filter((c) => c.id !== id)),
      },
    ]);
  };

  // ── Edit ──
  const handleEdit = (contact: EmergencyContact) => {
    setName(contact.name);
    setPhone(contact.phone);
    setEditing(contact.id);
  };

  // ── Call ──
  const handleCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`).catch(() =>
      Alert.alert('Error', 'Unable to make a call on this device.')
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>📞 Emergency Contacts</Text>
        <Text style={styles.subtitle}>Quick-call people when you need help</Text>
      </View>

      {/* Add Form */}
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>{editing ? 'Edit Contact' : 'Add Contact'}</Text>
        <TextInput
          style={styles.input}
          placeholder="Contact name"
          placeholderTextColor={colors.dark600}
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Phone number"
          placeholderTextColor={colors.dark600}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        <View style={styles.formActions}>
          {editing && (
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => { setEditing(null); setName(''); setPhone(''); }}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
            <Text style={styles.saveText}>{editing ? 'Update' : 'Add Contact'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Contact List */}
      <FlatList
        data={contacts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
        renderItem={({ item }) => (
          <View style={styles.contactCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.contactName}>{item.name}</Text>
              <Text style={styles.contactPhone}>{item.phone}</Text>
            </View>
            <TouchableOpacity
              onPress={() => handleCall(item.phone)}
              style={styles.callBtn}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 18 }}>📞</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleEdit(item)} style={styles.iconBtn}>
              <Text style={{ fontSize: 14 }}>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.iconBtn}>
              <Text style={{ fontSize: 14 }}>🗑️</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptySection}>
            <Text style={{ fontSize: 36, marginBottom: 8 }}>👥</Text>
            <Text style={styles.emptyTitle}>No emergency contacts</Text>
            <Text style={styles.emptyHint}>Add people you trust above</Text>
          </View>
        }
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.dark950 },

  header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  title: { color: colors.white, fontSize: 24, fontWeight: 'bold' },
  subtitle: { color: colors.dark400, fontSize: 13, marginTop: 4 },

  formCard: {
    marginHorizontal: 24, marginVertical: 12,
    backgroundColor: colors.dark900, borderWidth: 1, borderColor: colors.dark700,
    borderRadius: radius.xl, padding: 20,
  },
  formTitle: { color: colors.white, fontSize: 16, fontWeight: 'bold', marginBottom: 16 },
  input: {
    backgroundColor: colors.dark800, borderWidth: 1, borderColor: colors.dark600,
    borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 12,
    color: colors.white, fontSize: 15, marginBottom: 12,
  },
  formActions: { flexDirection: 'row', gap: 8 },
  saveBtn: {
    flex: 1, backgroundColor: colors.primary600, borderRadius: radius.md,
    paddingVertical: 14, alignItems: 'center',
  },
  saveText: { color: colors.white, fontWeight: 'bold', fontSize: 15 },
  cancelBtn: {
    backgroundColor: colors.dark800, borderRadius: radius.md,
    paddingVertical: 14, paddingHorizontal: 20, alignItems: 'center',
    borderWidth: 1, borderColor: colors.dark600,
  },
  cancelText: { color: colors.dark300, fontWeight: '600', fontSize: 15 },

  contactCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.dark900, borderWidth: 1, borderColor: colors.dark700,
    borderRadius: radius.lg, padding: 14, marginBottom: 10,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primary600_20, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: colors.primary400, fontSize: 18, fontWeight: 'bold' },
  contactName: { color: colors.white, fontSize: 15, fontWeight: '600' },
  contactPhone: { color: colors.dark400, fontSize: 13, marginTop: 2 },

  callBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(34,197,94,0.15)', alignItems: 'center', justifyContent: 'center',
    marginRight: 4,
  },
  iconBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },

  emptySection: { alignItems: 'center', paddingVertical: 48 },
  emptyTitle: { color: colors.dark400, fontSize: 16, fontWeight: '600' },
  emptyHint: { color: colors.dark600, fontSize: 13, marginTop: 4 },
});
