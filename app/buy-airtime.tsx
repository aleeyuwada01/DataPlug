import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppHaptic } from '../hooks/useAppHaptic';
import { TransactionPin } from '../components/TransactionPin';
import * as Haptics from 'expo-haptics';
import { ContactPickerModal } from '../components/ContactPickerModal';
import { useTheme } from '../contexts/ThemeContext';
import { Typography, Spacing, BorderRadius } from '../constants/theme';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const MTN_LOGO = 'https://i.ibb.co/QFs26NSD/New-mtn-logo.jpg';
const QUICK_AMOUNTS = ['100', '200', '500', '1000', '2000', '5000'];

export default function BuyAirtimeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { Colors, isDark } = useTheme();
  
  const [amount, setAmount] = useState('500');
  const [phone, setPhone] = useState('');
  const [isPhoneFocused, setIsPhoneFocused] = useState(false);
  const [isAmountFocused, setIsAmountFocused] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const { triggerHaptic } = useAppHaptic();
  const { refreshUser } = useAuth();

  const handleBuy = () => {
    if (!phone || phone.length < 10) {
      setErrorMsg('Please enter a valid phone number');
      return;
    }
    if (!amount || Number(amount) < 50) {
      setErrorMsg('Minimum amount is ₦50');
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
      await api.transactions.buyAirtime({
        amount: Number(amount),
        network: 'MTN',
        phoneNumber: phone,
        pin,
      });
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await refreshUser();
      setTimeout(() => router.back(), 500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Transaction failed');
    } finally {
      setSubmitting(false);
    }
  };

  const numericAmount = Number(amount || 0);
  const discount = Math.round(numericAmount * 0.03);

  return (
    <View style={[styles.screen, { paddingTop: insets.top, backgroundColor: Colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: Colors.backgroundElevated, borderColor: Colors.glassBorder }]}>
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: Colors.textPrimary }]}>Buy Airtime</Text>
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
            <Text style={[styles.badgeText, { color: Colors.primary }]}>3% Cashback</Text>
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
              style={[styles.input, { color: Colors.textPrimary }, Platform.OS === 'web' && { outlineStyle: 'none' } as any]} 
              placeholder="810 123 4567" 
              placeholderTextColor={Colors.textMuted} 
              value={phone} 
              onChangeText={setPhone} 
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

        {/* Amount Input */}
        <Text style={[styles.label, { color: Colors.textSecondary }]}>Amount</Text>
        <View style={[
          styles.amountWrapper, 
          { backgroundColor: Colors.backgroundElevated, borderColor: isAmountFocused ? Colors.primary : Colors.glassBorder, shadowColor: isAmountFocused ? Colors.primary : Colors.shadowDark },
          isAmountFocused && { shadowOpacity: 0.15, shadowRadius: 10, elevation: 4 }
        ]}>
          <Text style={[styles.currencySymbol, { color: isAmountFocused ? Colors.primary : Colors.textSecondary }]}>₦</Text>
          <TextInput 
            style={[styles.amountInput, { color: isAmountFocused ? Colors.primary : Colors.textPrimary }, Platform.OS === 'web' && { outlineStyle: 'none' } as any]} 
            placeholder="0" 
            placeholderTextColor={Colors.textMuted} 
            value={amount} 
            onChangeText={setAmount} 
            keyboardType="number-pad" 
            onFocus={() => setIsAmountFocused(true)}
            onBlur={() => setIsAmountFocused(false)}
          />
        </View>

        <View style={styles.quickRow}>
          {QUICK_AMOUNTS.map((a, i) => {
            const isActive = amount === a;
            return (
              <TouchableOpacity 
                key={i} 
                onPress={() => setAmount(a)} 
                style={[
                  styles.quickChip, 
                  { 
                    backgroundColor: isActive ? Colors.primaryMuted : Colors.backgroundElevated,
                    borderColor: isActive ? Colors.primary : Colors.glassBorder
                  }
                ]}
              >
                <Text style={[styles.quickText, { color: isActive ? Colors.primary : Colors.textSecondary }]}>
                  ₦{Number(a).toLocaleString()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Summary Details */}
        <View style={[styles.summaryCard, { backgroundColor: Colors.backgroundElevated, borderColor: Colors.glassBorder }]}>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: Colors.textMuted }]}>Airtime Value</Text>
            <Text style={[styles.summaryValue, { color: Colors.textPrimary }]}>₦{numericAmount.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: Colors.textMuted }]}>Cashback (3%)</Text>
            <Text style={[styles.summaryValue, { color: Colors.primary }]}>- ₦{discount.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={[styles.summaryRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
            <Text style={[styles.summaryLabel, { color: Colors.textPrimary, fontSize: 16 }]}>Amount to Pay</Text>
            <Text style={[styles.summaryTotal, { color: Colors.textPrimary }]}>₦{(numericAmount - discount).toLocaleString()}</Text>
          </View>
        </View>

        {errorMsg ? <Text style={{ color: Colors.error, textAlign: 'center', marginTop: Spacing.sm }}>{errorMsg}</Text> : null}

        {/* Buy Button */}
        <TouchableOpacity style={[styles.buyBtn, submitting && { opacity: 0.7 }]} onPress={handleBuy} activeOpacity={0.8} disabled={submitting}>
          <LinearGradient colors={['#34A853', '#2D8F47']} style={StyleSheet.absoluteFillObject} />
          {submitting ? null : <Ionicons name="call" size={20} color="#FFF" />}
          <Text style={styles.buyText}>{submitting ? 'Processing...' : 'Purchase Airtime'}</Text>
        </TouchableOpacity>
        
        <View style={{ height: 40 }} />
      </ScrollView>

      <TransactionPin visible={showPin} onComplete={handlePinComplete} onCancel={() => setShowPin(false)} />
      <ContactPickerModal visible={showContacts} onSelect={setPhone} onClose={() => setShowContacts(false)} />
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

  // Amount
  amountWrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.xl, borderRadius: BorderRadius.lg, borderWidth: 1, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  currencySymbol: { ...Typography.h1, marginLeft: Spacing.md, marginRight: 8, marginTop: 4 },
  amountInput: { ...Typography.hero, fontSize: 42, minWidth: 100, textAlign: 'center' },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, justifyContent: 'space-between' },
  quickChip: { width: '31%', paddingVertical: 12, borderRadius: BorderRadius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  quickText: { ...Typography.bodyBold },

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
