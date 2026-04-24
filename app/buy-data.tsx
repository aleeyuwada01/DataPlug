import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppHaptic } from '../hooks/useAppHaptic';
import { TransactionPin } from '../components/TransactionPin';
import { ContactPickerModal } from '../components/ContactPickerModal';
import { useTheme } from '../contexts/ThemeContext';
import { Typography, Spacing, BorderRadius } from '../constants/theme';

import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const MTN_LOGO = 'https://i.ibb.co/QFs26NSD/New-mtn-logo.jpg';

export default function BuyDataScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { Colors, isDark } = useTheme();
  
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isPhoneFocused, setIsPhoneFocused] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
  const [dataPlans, setDataPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const { triggerHaptic } = useAppHaptic();
  const { refreshUser } = useAuth();

  React.useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await api.transactions.getPlans();
        if (res.plans && res.plans.MTN) {
          setDataPlans(res.plans.MTN);
          setSelectedPlan(res.plans.MTN[0]);
        }
      } catch (err) {
        console.error('Failed to load data plans', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const handleBuy = () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      setErrorMsg('Please enter a valid phone number');
      return;
    }
    if (!selectedPlan) {
      setErrorMsg('Please select a plan');
      return;
    }
    setErrorMsg('');
    triggerHaptic();
    setShowPin(true);
  };

  const handlePinComplete = async (pin: string) => {
    setShowPin(false);
    setSubmitting(true);
    try {
      await api.transactions.buyData({
        planId: selectedPlan.id,
        phoneNumber,
        pin,
      });
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await refreshUser(); // Update wallet balance
      setTimeout(() => router.back(), 500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Transaction failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top, backgroundColor: Colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: Colors.backgroundElevated, borderColor: Colors.glassBorder }]}>
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: Colors.textPrimary }]}>Buy Data</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        
        {/* Network Info */}
        <Text style={[styles.label, { color: Colors.textSecondary }]}>Supported Network</Text>
        <View style={[styles.networkCard, { backgroundColor: Colors.backgroundElevated, borderColor: Colors.glassBorder }]}>
          <View style={styles.networkInfo}>
            <Image source={{ uri: MTN_LOGO }} style={styles.networkLogo} resizeMode="contain" />
            <View>
              <Text style={[styles.networkName, { color: Colors.textPrimary }]}>MTN Nigeria</Text>
              <Text style={[styles.networkStatus, { color: Colors.success }]}>● Active</Text>
            </View>
          </View>
          <View style={[styles.badge, { backgroundColor: Colors.primaryMuted }]}>
            <Text style={[styles.badgeText, { color: Colors.primary }]}>Default</Text>
          </View>
        </View>

        {/* Phone Number */}
        <Text style={[styles.label, { color: Colors.textSecondary }]}>Phone Number</Text>
        <View style={[
          styles.inputWrapper, 
          { backgroundColor: Colors.backgroundElevated, borderColor: isPhoneFocused ? Colors.primary : Colors.glassBorder },
          isPhoneFocused && { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 3 }
        ]}>
          <View style={styles.inputRow}>
            <Text style={[styles.inputPrefix, { color: isPhoneFocused ? Colors.primary : Colors.textSecondary }]}>+234</Text>
            <View style={styles.divider} />
            <TextInput
              style={[
                styles.input, 
                { color: Colors.textPrimary }, 
                Platform.OS === 'web' && { outlineStyle: 'none' } as any
              ]}
              placeholder="810 123 4567"
              placeholderTextColor={Colors.textMuted}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              maxLength={11}
              onFocus={() => setIsPhoneFocused(true)}
              onBlur={() => setIsPhoneFocused(false)}
            />
            <TouchableOpacity onPress={() => setShowContacts(true)} style={[styles.contactBtn, { backgroundColor: isPhoneFocused ? Colors.primary : Colors.primaryMuted }]}>
              <Ionicons name="person" size={16} color={isPhoneFocused ? '#FFF' : Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Data Plans */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.label, { color: Colors.textSecondary }]}>Choose Plan</Text>
        </View>
        
        <View style={styles.plansGrid}>
          {loading ? (
            <Text style={{ color: Colors.textMuted, paddingVertical: Spacing.xl }}>Loading plans...</Text>
          ) : dataPlans.map((plan, i) => {
            const isSelected = selectedPlan?.id === plan.id;
            return (
              <TouchableOpacity key={plan.id} onPress={() => setSelectedPlan(plan)} activeOpacity={0.7} style={styles.planWrap}>
                <View style={[
                  styles.planCard, 
                  { 
                    backgroundColor: isSelected ? Colors.primaryMuted : Colors.backgroundElevated,
                    borderColor: isSelected ? Colors.primary : Colors.glassBorder,
                  }
                ]}>
                  {i === 1 && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularText}>HOT</Text>
                    </View>
                  )}
                  <Text style={[styles.planSize, { color: isSelected ? Colors.primary : Colors.textPrimary }]}>{plan.data}</Text>
                  <Text style={[styles.planDuration, { color: Colors.textMuted }]}>{plan.validity}</Text>
                  <Text style={[styles.planPrice, { color: isSelected ? Colors.textPrimary : Colors.textSecondary }]}>{plan.priceFormatted}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Summary Details */}
        {selectedPlan && (
          <View style={[styles.summaryCard, { backgroundColor: Colors.backgroundElevated, borderColor: Colors.glassBorder }]}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: Colors.textMuted }]}>Network</Text>
              <Text style={[styles.summaryValue, { color: Colors.textPrimary }]}>MTN</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: Colors.textMuted }]}>Selected Plan</Text>
              <Text style={[styles.summaryValue, { color: Colors.textPrimary }]}>{selectedPlan.data} - {selectedPlan.validity}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={[styles.summaryRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
              <Text style={[styles.summaryLabel, { color: Colors.textPrimary, fontSize: 16 }]}>Amount to Pay</Text>
              <Text style={[styles.summaryTotal, { color: Colors.primary }]}>{selectedPlan.priceFormatted}</Text>
            </View>
          </View>
        )}

        {errorMsg ? <Text style={{ color: Colors.error, textAlign: 'center', marginTop: Spacing.sm }}>{errorMsg}</Text> : null}

        {/* Buy Button */}
        <TouchableOpacity style={[styles.buyBtn, submitting && { opacity: 0.7 }]} onPress={handleBuy} activeOpacity={0.8} disabled={submitting}>
          <LinearGradient colors={['#34A853', '#2D8F47']} style={StyleSheet.absoluteFillObject} />
          {submitting ? null : <Ionicons name="flash" size={20} color="#FFF" />}
          <Text style={styles.buyText}>{submitting ? 'Processing...' : 'Confirm Purchase'}</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      <TransactionPin visible={showPin} onComplete={handlePinComplete} onCancel={() => setShowPin(false)} />
      <ContactPickerModal visible={showContacts} onSelect={setPhoneNumber} onClose={() => setShowContacts(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  backBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...Typography.h3 },
  scroll: { paddingHorizontal: Spacing.xl, gap: Spacing.md, paddingBottom: 20 },
  label: { ...Typography.captionBold, marginTop: Spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 11 },
  
  // Network
  networkCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1 },
  networkInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  networkLogo: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF' },
  networkName: { ...Typography.bodyBold, marginBottom: 2 },
  networkStatus: { ...Typography.small, fontWeight: '700' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.pill },
  badgeText: { ...Typography.small, fontWeight: '700' },

  // Input
  inputWrapper: { borderRadius: BorderRadius.lg, borderWidth: 1, overflow: 'hidden' },
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, height: 56 },
  inputPrefix: { ...Typography.bodyBold, marginRight: Spacing.sm },
  divider: { width: 1, height: 24, backgroundColor: 'rgba(150,150,150,0.2)', marginRight: Spacing.md },
  input: { flex: 1, ...Typography.bodyBold, fontSize: 18, height: '100%', letterSpacing: 1 },
  contactBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  // Plans
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  plansGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  planWrap: { width: '31%', flexGrow: 1 },
  planCard: { alignItems: 'center', padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1.5, position: 'relative' },
  popularBadge: { position: 'absolute', top: -8, backgroundColor: '#EF4444', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, shadowColor: '#EF4444', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 4, elevation: 3 },
  popularText: { fontSize: 9, fontWeight: '800', color: '#FFF', letterSpacing: 0.5 },
  planSize: { ...Typography.h2, marginBottom: 2 },
  planDuration: { ...Typography.small, marginBottom: 8 },
  planPrice: { ...Typography.bodyBold },

  // Summary
  summaryCard: { padding: Spacing.lg, borderRadius: BorderRadius.lg, borderWidth: 1, marginTop: Spacing.md },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm },
  summaryLabel: { ...Typography.body },
  summaryValue: { ...Typography.bodyBold },
  summaryDivider: { height: 1, backgroundColor: 'rgba(150,150,150,0.1)', marginVertical: Spacing.sm },
  summaryTotal: { ...Typography.h1 },

  // Buy Btn
  buyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 56, borderRadius: BorderRadius.xl, overflow: 'hidden', marginTop: Spacing.lg, shadowColor: '#34A853', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  buyText: { ...Typography.button, color: '#FFF', fontSize: 18 },
});
