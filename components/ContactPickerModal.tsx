import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Contacts from 'expo-contacts';
import { useTheme } from '../contexts/ThemeContext';
import { Typography, Spacing, BorderRadius } from '../constants/theme';

interface Contact {
  id: string;
  name: string;
  phone: string;
}

interface ContactPickerModalProps {
  visible: boolean;
  onSelect: (phoneNumber: string) => void;
  onClose: () => void;
}

export const ContactPickerModal: React.FC<ContactPickerModalProps> = ({ visible, onSelect, onClose }) => {
  const { Colors } = useTheme();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (visible) {
      loadContacts();
    }
  }, [visible]);

  const loadContacts = async () => {
    setLoading(true);
    const { status } = await Contacts.requestPermissionsAsync();
    if (status === 'granted') {
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers],
      });

      if (data.length > 0) {
        const parsed = data
          .filter(c => c.phoneNumbers && c.phoneNumbers.length > 0)
          .map(c => ({
            id: c.id,
            name: c.name || 'Unknown',
            phone: c.phoneNumbers![0].number || '',
          }));
        setContacts(parsed);
        setFilteredContacts(parsed);
      }
    }
    setLoading(false);
  };

  const handleSearch = (text: string) => {
    setSearch(text);
    if (!text) {
      setFilteredContacts(contacts);
      return;
    }
    const q = text.toLowerCase();
    setFilteredContacts(contacts.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q)));
  };

  const handleSelect = (phone: string) => {
    // clean phone number (remove spaces, dashes)
    let cleaned = phone.replace(/[\s\-()]/g, '');
    
    // Automatically strip +234 or leading 0 if needed for our UI which has +234 hardcoded
    if (cleaned.startsWith('+234')) {
      cleaned = cleaned.substring(4);
    } else if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    
    onSelect(cleaned);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.container, { backgroundColor: Colors.backgroundElevated }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: Colors.textPrimary }]}>Select Contact</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
          
          <View style={[styles.searchBox, { backgroundColor: Colors.background, borderColor: Colors.glassBorder }]}>
            <Ionicons name="search" size={20} color={Colors.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: Colors.textPrimary }, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
              placeholder="Search contacts..."
              placeholderTextColor={Colors.textMuted}
              value={search}
              onChangeText={handleSearch}
            />
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={filteredContacts}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.list}
              renderItem={({ item }) => (
                <TouchableOpacity style={[styles.contactRow, { borderBottomColor: Colors.glassBorder }]} onPress={() => handleSelect(item.phone)}>
                  <View style={[styles.avatar, { backgroundColor: Colors.primaryMuted }]}>
                    <Text style={[styles.avatarText, { color: Colors.primary }]}>{item.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View>
                    <Text style={[styles.name, { color: Colors.textPrimary }]}>{item.name}</Text>
                    <Text style={[styles.phone, { color: Colors.textSecondary }]}>{item.phone}</Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={() => (
                <Text style={[styles.emptyText, { color: Colors.textMuted }]}>No contacts found.</Text>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  container: { height: '80%', borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, padding: Spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  title: { ...Typography.h3 },
  closeBtn: { padding: 4 },
  searchBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, height: 48, borderRadius: BorderRadius.lg, borderWidth: 1, marginBottom: Spacing.md },
  searchInput: { flex: 1, marginLeft: Spacing.sm, ...Typography.body },
  list: { paddingBottom: 40 },
  contactRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, borderBottomWidth: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  avatarText: { ...Typography.h3 },
  name: { ...Typography.bodyBold, marginBottom: 2 },
  phone: { ...Typography.small },
  emptyText: { ...Typography.body, textAlign: 'center', marginTop: Spacing.xl },
});
