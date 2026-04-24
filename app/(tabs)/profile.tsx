import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { GlassCard } from '../../components/GlassCard';
import { useTheme } from '../../contexts/ThemeContext';
import { useAppHaptic } from '../../hooks/useAppHaptic';
import { Typography, Spacing, BorderRadius } from '../../constants/theme';
import { hexToRgba } from '../../utils/colors';
import { useAuth } from '../../contexts/AuthContext';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { Colors, isDark, toggleTheme } = useTheme();
  const { triggerSelection } = useAppHaptic();
  const { user, logout } = useAuth();
  
  const [biometrics, setBiometrics] = useState(true);

  const MENU_ITEMS = [
    ...(user?.isAdmin ? [{ icon: 'briefcase-outline' as const, label: 'Admin Dashboard', color: '#10B981' }] : []),
    { icon: 'person-outline' as const, label: 'Edit Profile', color: Colors.primary },
    { icon: 'shield-checkmark-outline' as const, label: 'Security & PIN', color: '#3B82F6' },
    { icon: 'card-outline' as const, label: 'Payment Methods', color: '#8B5CF6' },
    { icon: 'notifications-outline' as const, label: 'Notifications', color: '#F59E0B' },
    { icon: 'help-circle-outline' as const, label: 'Help & Support', color: '#10B981' },
    { icon: 'document-text-outline' as const, label: 'Terms of Service', color: Colors.textSecondary },
    { icon: 'log-out-outline' as const, label: 'Log Out', color: Colors.error },
  ];

  const handleMenuClick = (label: string) => {
    triggerSelection();
    
    if (label === 'Log Out') {
      Alert.alert('Log Out', 'Are you sure you want to log out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: async () => {
          await logout();
          router.replace('/login');
        } }
      ]);
      return;
    }

    if (label === 'Admin Dashboard') {
      router.push('/admin');
      return;
    }
    
    Alert.alert(label, `Navigating to ${label}...`);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top, backgroundColor: Colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: Colors.textPrimary }]}>Profile</Text>
        </View>

        {/* Avatar Card */}
        <GlassCard delay={100}>
          <View style={styles.avatarRow}>
            <View style={[styles.avatarWrap, { backgroundColor: Colors.primaryMuted }]}>
              <Text style={[styles.avatarText, { color: Colors.primary }]}>{user?.fullName?.charAt(0)?.toUpperCase() || 'U'}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: Colors.textPrimary }]}>{user?.fullName || 'User'}</Text>
              <Text style={[styles.userPhone, { color: Colors.textSecondary }]}>{user?.phone || 'Loading...'}</Text>
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />
                <Text style={[styles.verifiedText, { color: Colors.primary }]}>Verified</Text>
              </View>
            </View>
            <TouchableOpacity style={[styles.editBtn, { backgroundColor: Colors.primaryMuted }]} onPress={() => handleMenuClick('Edit Profile')}>
              <Ionicons name="create-outline" size={18} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* Account Stats (Commented out until real endpoint available)
        <View style={styles.statsRow}>
          <GlassCard style={[styles.statCard]} delay={150}>
            <Text style={[styles.statValue, { color: Colors.textPrimary }]}>₦45,200</Text>
            <Text style={[styles.statLabel, { color: Colors.textSecondary }]}>Total Spent</Text>
          </GlassCard>
          <GlassCard style={[styles.statCard]} delay={200}>
            <Text style={[styles.statValue, { color: Colors.primary }]}>28</Text>
            <Text style={[styles.statLabel, { color: Colors.textSecondary }]}>Transactions</Text>
          </GlassCard>
        </View>
        */}

        {/* Theme Toggle */}
        <GlassCard delay={300}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleLeft}>
              <View style={[styles.menuIcon, { backgroundColor: hexToRgba(Colors.primary, 0.08) }]}>
                <Ionicons name={isDark ? "moon" : "sunny"} size={20} color={Colors.primary} />
              </View>
              <View>
                <Text style={[styles.menuLabel, { color: Colors.textPrimary }]}>Dark Mode</Text>
                <Text style={[styles.menuSub, { color: Colors.textMuted }]}>Toggle app appearance</Text>
              </View>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: 'rgba(150,150,150,0.2)', true: Colors.primaryMuted }}
              thumbColor={isDark ? Colors.primary : '#FFF'}
            />
          </View>
        </GlassCard>
        
        {/* Biometrics Toggle */}
        <GlassCard delay={350}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleLeft}>
              <View style={[styles.menuIcon, { backgroundColor: `rgba(59, 130, 246, 0.15)` }]}>
                <Ionicons name="finger-print-outline" size={20} color="#3B82F6" />
              </View>
              <View>
                <Text style={[styles.menuLabel, { color: Colors.textPrimary }]}>Biometric Login</Text>
                <Text style={[styles.menuSub, { color: Colors.textMuted }]}>Use fingerprint to login</Text>
              </View>
            </View>
            <Switch
              value={biometrics}
              onValueChange={setBiometrics}
              trackColor={{ false: 'rgba(150,150,150,0.2)', true: 'rgba(59, 130, 246, 0.2)' }}
              thumbColor={biometrics ? '#3B82F6' : '#FFF'}
            />
          </View>
        </GlassCard>

        {/* Menu Items */}
        <GlassCard delay={400}>
          {MENU_ITEMS.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, index < MENU_ITEMS.length - 1 && { borderBottomWidth: 1, borderBottomColor: Colors.glassBorder }]}
              activeOpacity={0.6}
              onPress={() => handleMenuClick(item.label)}
            >
              <View style={[styles.menuIcon, { backgroundColor: hexToRgba(item.color, 0.08) }]}>
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <Text style={[styles.menuLabelText, { color: item.color === Colors.error ? Colors.error : Colors.textPrimary }]}>
                {item.label}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}
        </GlassCard>

        <Text style={[styles.version, { color: Colors.textMuted }]}>DataPlug v1.0.0</Text>
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.xl, paddingBottom: 20, gap: Spacing.lg },
  header: { paddingVertical: Spacing.lg },
  title: { ...Typography.h1 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  avatarWrap: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 24, fontWeight: '700' },
  userInfo: { flex: 1 },
  userName: { ...Typography.h3, marginBottom: 2 },
  userPhone: { ...Typography.body, marginBottom: 6 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  verifiedText: { ...Typography.small },
  editBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', gap: Spacing.md },
  statCard: { flex: 1, alignItems: 'center', padding: Spacing.md, borderWidth: 1, borderRadius: BorderRadius.lg },
  statValue: { ...Typography.h2, marginBottom: 2 },
  statLabel: { ...Typography.small },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.sm },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { ...Typography.bodyBold, marginBottom: 2 },
  menuSub: { ...Typography.small },
  menuLabelText: { ...Typography.body, flex: 1 },
  version: { ...Typography.small, textAlign: 'center', marginTop: Spacing.lg },
});
