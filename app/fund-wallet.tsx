import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, Modal, Clipboard, Alert, ActivityIndicator, Animated, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppHaptic } from '../hooks/useAppHaptic';
import { GlassCard } from '../components/GlassCard';
import { useTheme } from '../contexts/ThemeContext';
import { Typography, Spacing, BorderRadius } from '../constants/theme';
import { hexToRgba } from '../utils/colors';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// ─── Skeleton Bank Row ────────────────────────────────────────────────────────
function SkeletonBankRow({ Colors, delay }: { Colors: any; delay: number }) {
  const anim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true, delay }),
        Animated.timing(anim, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: Colors.glassBorder, gap: 12 }}>
      <Animated.View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.backgroundElevated, opacity: anim }} />
      <Animated.View style={{ flex: 1, height: 14, borderRadius: 7, backgroundColor: Colors.backgroundElevated, opacity: anim }} />
      <Animated.View style={{ width: 60, height: 12, borderRadius: 6, backgroundColor: Colors.backgroundElevated, opacity: anim }} />
    </View>
  );
}

export default function FundWalletScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { Colors, isDark } = useTheme();

  const [amount, setAmount] = useState('5000');
  const [selectedMethod, setSelectedMethod] = useState(0); // Default to One-Time Bank Transfer
  const [isAmountFocused, setIsAmountFocused] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Dynamic account states (One-Time)
  const [showModal, setShowModal] = useState(false);
  const [dynamicAccount, setDynamicAccount] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  // Static account states (Permanent)
  const [virtualAccount, setVirtualAccount] = useState<{bankName?: string, accountNumber?: string} | null>(null);
  const [bvn, setBvn] = useState('');
  const [isBvnFocused, setIsBvnFocused] = useState(false);
  const [generatingAccount, setGeneratingAccount] = useState(false);

  // USSD states
  const [banks, setBanks] = useState<{code: string, name: string}[]>([]);
  const [banksLoading, setBanksLoading] = useState(false);
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [selectedBank, setSelectedBank] = useState<{code: string, name: string} | null>(null);
  const [showUssdModal, setShowUssdModal] = useState(false);
  const [ussdCode, setUssdCode] = useState('');
  const [bankSearch, setBankSearch] = useState('');
  
  const [errorMsg, setErrorMsg] = useState('');

  const { triggerNotification, triggerHaptic } = useAppHaptic();
  const { user } = useAuth();

  React.useEffect(() => {
    const loadWallet = async () => {
      try {
        const data = await api.wallet.getBalance();
        setWalletBalance(data.balance);
        if (data.virtualAccountNumber) {
          setVirtualAccount({
            bankName: data.virtualBankName,
            accountNumber: data.virtualAccountNumber
          });
        }
      } catch(e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadWallet();

    // Pre-load banks for USSD in background
    const loadBanks = async () => {
      try {
        const data = await api.wallet.getBanks();
        setBanks(data.banks || []);
      } catch(e) {
        console.error('Failed to load banks', e);
      }
    };
    loadBanks();
  }, []);

  const METHODS = [
    { icon: 'swap-horizontal' as const, name: 'Bank Transfer', desc: 'One-time transfer (No BVN required)', color: '#3B82F6' },
    { icon: 'wallet-outline' as const, name: 'OPay Wallet', desc: 'Secure OPay wallet payment', color: '#10B981' },
    { icon: 'phone-portrait-outline' as const, name: 'USSD', desc: 'Quick USSD code', color: '#F59E0B' },
  ];

  const handleDynamicFund = async () => {
    if (!amount || Number(amount) < 100) {
      setErrorMsg('Minimum funding amount is ₦100');
      return;
    }
    setErrorMsg('');
    setSubmitting(true);
    triggerNotification();
    
    try {
      const data = await api.wallet.fund(Number(amount));
      
      setDynamicAccount(data.account);
      setShowModal(true);
      triggerNotification();
    } catch (err: any) {
      setErrorMsg(err.message || 'Funding failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateStaticAccount = async () => {
    if (!bvn || bvn.length < 10) {
      setErrorMsg('Please enter a valid BVN');
      return;
    }
    setErrorMsg('');
    setGeneratingAccount(true);
    triggerNotification();
    
    try {
      const data = await api.wallet.generateStaticAccount(bvn);

      setVirtualAccount({
        bankName: data.account.bankName,
        accountNumber: data.account.accountNumber
      });
      triggerNotification();
    } catch (err: any) {
      setErrorMsg(err.message || 'Generation failed');
    } finally {
      setGeneratingAccount(false);
    }
  };

  const handleUssdPay = async () => {
    if (!amount || Number(amount) < 100) {
      setErrorMsg('Minimum amount is ₦100');
      return;
    }
    if (!selectedBank) {
      setShowBankPicker(true);
      return;
    }
    setErrorMsg('');
    setSubmitting(true);
    triggerNotification();
    try {
      const data = await api.wallet.initiateUSSD(Number(amount), selectedBank.code);
      setUssdCode(data.ussdCode);
      setShowUssdModal(true);
      triggerNotification();
    } catch (err: any) {
      setErrorMsg(err.message || 'USSD initiation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOPayPay = async () => {
    if (!amount || Number(amount) < 100) {
      setErrorMsg('Minimum amount is ₦100');
      return;
    }
    setErrorMsg('');
    setSubmitting(true);
    triggerNotification();
    try {
      const data = await api.wallet.initiateOPay(Number(amount));
      triggerNotification();
      
      Alert.alert(
        "Redirecting to OPay",
        "You will be redirected to OPay to authorize this transaction. Please return to the app once completed.",
        [
          { 
            text: "Continue", 
            onPress: () => Linking.openURL(data.redirectUrl) 
          }
        ]
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'OPay initiation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredBanks = bankSearch.trim()
    ? banks.filter(b => b.name.toLowerCase().includes(bankSearch.toLowerCase()))
    : banks;

  const copyToClipboard = (text: string, label: string) => {
    Clipboard.setString(text);
    triggerHaptic();
    if (Platform.OS === 'web') {
      alert(`${label} copied!`);
    } else {
      Alert.alert('Copied', `${label} copied to clipboard`);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top, backgroundColor: Colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={[styles.backBtn, { backgroundColor: Colors.backgroundElevated, borderColor: Colors.glassBorder }]}>
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: Colors.textPrimary }]}>Fund Wallet</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Current Balance */}
        <GlassCard style={{ backgroundColor: Colors.backgroundElevated, borderColor: Colors.glassBorder }}>
          <Text style={[styles.balLabel, { color: Colors.textSecondary }]}>Current Balance</Text>
          <Text style={[styles.balValue, { color: Colors.textPrimary }]}>
            {loading ? '...' : `₦${(walletBalance / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          </Text>
        </GlassCard>

        {/* Dedicated Permanent Account Section */}
        {loading ? (
          <GlassCard style={{ backgroundColor: Colors.backgroundElevated, borderColor: Colors.glassBorder, height: 160, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator color={Colors.primary} />
          </GlassCard>
        ) : virtualAccount ? (
          <GlassCard style={{ backgroundColor: hexToRgba(Colors.primary, 0.05), borderColor: Colors.primary, borderWidth: 1 }}>
            <View style={styles.alertBox}>
              <Ionicons name="information-circle" size={20} color={Colors.primary} />
              <Text style={[styles.alertText, { color: Colors.textPrimary }]}>
                Transfer any amount to your permanent account below. Your wallet will be credited instantly.
              </Text>
            </View>
            
            <View style={[styles.detailBox, { backgroundColor: Colors.backgroundElevated, borderColor: Colors.glassBorder }]}>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: Colors.textSecondary }]}>Bank Name</Text>
                <Text style={[styles.detailValue, { color: Colors.textPrimary }]}>{virtualAccount.bankName}</Text>
              </View>
              
              <View style={[styles.divider, { backgroundColor: Colors.glassBorder }]} />
              
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: Colors.textSecondary }]}>Account Number</Text>
                <View style={styles.copyRow}>
                  <Text style={[styles.detailValue, { color: Colors.textPrimary, fontSize: 24, letterSpacing: 2 }]}>
                    {virtualAccount.accountNumber}
                  </Text>
                  <TouchableOpacity onPress={() => copyToClipboard(virtualAccount.accountNumber || '', 'Account Number')}>
                    <Ionicons name="copy-outline" size={24} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: Colors.glassBorder }]} />

              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: Colors.textSecondary }]}>Account Name</Text>
                <Text style={[styles.detailValue, { color: Colors.textPrimary }]}>DataPlug - {user?.fullName || 'Wallet'}</Text>
              </View>
            </View>
          </GlassCard>
        ) : (
          <GlassCard style={{ backgroundColor: Colors.backgroundElevated, borderColor: Colors.glassBorder }}>
            <Text style={[styles.label, { color: Colors.textPrimary, fontSize: 16, marginTop: 0 }]}>Get Your Permanent Account</Text>
            <Text style={[styles.alertText, { color: Colors.textSecondary, marginBottom: Spacing.md }]}>
              To generate a permanent account number for instant wallet funding, please provide your BVN.
            </Text>
            
            <Text style={[styles.label, { color: Colors.textSecondary }]}>Enter BVN</Text>
            <View style={[
              styles.amountWrapper, 
              { paddingVertical: 10, backgroundColor: Colors.backgroundElevated, borderColor: isBvnFocused ? Colors.primary : Colors.glassBorder },
            ]}>
              <Ionicons name="shield-checkmark" size={20} color={isBvnFocused ? Colors.primary : Colors.textSecondary} style={{ marginLeft: 15 }} />
              <TextInput 
                style={[styles.amountInput, { fontSize: 18, flex: 1, textAlign: 'left', marginLeft: 10, color: isBvnFocused ? Colors.primary : Colors.textPrimary }, Platform.OS === 'web' && { outlineStyle: 'none' } as any]} 
                placeholder="11-digit BVN" 
                placeholderTextColor={Colors.textMuted} 
                value={bvn} 
                onChangeText={setBvn} 
                keyboardType="number-pad" 
                maxLength={11}
                onFocus={() => setIsBvnFocused(true)}
                onBlur={() => setIsBvnFocused(false)}
              />
            </View>

            {errorMsg ? <Text style={{ color: Colors.error, textAlign: 'center', marginTop: Spacing.sm }}>{errorMsg}</Text> : null}

            <TouchableOpacity style={[styles.fundBtn, generatingAccount && { opacity: 0.7 }]} onPress={handleGenerateStaticAccount} activeOpacity={0.8} disabled={generatingAccount}>
              <LinearGradient colors={[Colors.primary, Colors.primary]} style={[StyleSheet.absoluteFillObject, { borderRadius: BorderRadius.lg }]} />
              {generatingAccount ? <ActivityIndicator color="#fff" /> : <Ionicons name="refresh" size={20} color="#FFF" />}
              <Text style={styles.fundText}>{generatingAccount ? 'Generating...' : 'Generate Account'}</Text>
            </TouchableOpacity>
          </GlassCard>
        )}

        <View style={[styles.divider, { backgroundColor: Colors.glassBorder, marginVertical: Spacing.md }]} />

        {/* Payment Method */}
        <Text style={[styles.label, { color: Colors.textSecondary }]}>Other Funding Methods</Text>
        {METHODS.map((m, i) => (
          <TouchableOpacity key={i} onPress={() => { setSelectedMethod(i); setErrorMsg(''); triggerHaptic(); }} activeOpacity={0.7}>
            <GlassCard style={[styles.methodCard, { borderColor: selectedMethod === i ? m.color : Colors.glassBorder, borderWidth: selectedMethod === i ? 1.5 : 1 }]} animateIn={false}>
              <View style={styles.methodRow}>
                <View style={[styles.methodIcon, { backgroundColor: hexToRgba(m.color, 0.08) }]}>
                  <Ionicons name={m.icon} size={22} color={m.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.methodName, { color: Colors.textPrimary }]}>{m.name}</Text>
                  <Text style={[styles.methodDesc, { color: Colors.textMuted }]}>{m.desc}</Text>
                </View>
                <View style={[styles.radio, { borderColor: selectedMethod === i ? Colors.primary : Colors.textMuted }]}>
                  {selectedMethod === i && <View style={[styles.radioInner, { backgroundColor: Colors.primary }]} />}
                </View>
              </View>
            </GlassCard>
          </TouchableOpacity>
        ))}

        {/* One-Time Bank Transfer or Card Flow */}
        <View style={{ marginTop: Spacing.md }}>
          <Text style={[styles.label, { color: Colors.textSecondary }]}>Enter Amount</Text>
          <View style={[
            styles.amountWrapper, 
            { backgroundColor: Colors.backgroundElevated, borderColor: isAmountFocused ? Colors.primary : Colors.glassBorder },
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

          <TouchableOpacity 
            style={[styles.fundBtn, submitting && { opacity: 0.7 }]} 
            onPress={() => {
              if (selectedMethod === 0) handleDynamicFund();
              else if (selectedMethod === 1) handleOPayPay();
              else if (selectedMethod === 2) handleUssdPay();
            }} 
            activeOpacity={0.8}
            disabled={submitting}
          >
            <LinearGradient colors={['#34A853', '#2D8F47']} style={[StyleSheet.absoluteFillObject, { borderRadius: BorderRadius.lg }]} />
            {submitting ? <ActivityIndicator color="#fff" /> : <Ionicons name={METHODS[selectedMethod].icon} size={20} color="#FFF" />}
            <Text style={styles.fundText}>
              {submitting ? 'Processing...' : 
               selectedMethod === 0 ? `Top Up ₦${Number(amount || 0).toLocaleString()}` :
               selectedMethod === 1 ? `Pay ₦${Number(amount || 0).toLocaleString()} with OPay` :
               selectedMethod === 2 ? (selectedBank ? `Pay via USSD • ${selectedBank.name}` : `Select Bank & Pay ₦${Number(amount||0).toLocaleString()}`) :
               `Proceed`
              }
            </Text>
          </TouchableOpacity>

          {/* USSD bank hint */}
          {selectedMethod === 2 && (
            <>
              <TouchableOpacity onPress={() => setShowBankPicker(true)} style={[styles.bankSelectHint, { borderColor: Colors.glassBorder, backgroundColor: Colors.backgroundElevated }]}>
                <Ionicons name="business-outline" size={18} color={Colors.textSecondary} />
                <Text style={[styles.bankSelectText, { color: selectedBank ? Colors.textPrimary : Colors.textMuted }]}>
                  {selectedBank ? selectedBank.name : 'Tap to select your bank'}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
              
              <View style={[styles.alertBox, { marginTop: Spacing.md, backgroundColor: hexToRgba(Colors.primary, 0.05), borderColor: 'transparent' }]}>
                <Ionicons name="wifi-outline" size={20} color={Colors.primary} />
                <Text style={[styles.alertText, { color: Colors.textPrimary }]}>
                  USSD payments are perfect for offline users. No internet connection is required to dial the code.
                </Text>
              </View>
            </>
          )}
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Dynamic Payment Details Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: Colors.background, borderColor: Colors.glassBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: Colors.textPrimary }]}>Bank Transfer</Text>
              <TouchableOpacity onPress={() => setShowModal(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.alertBox}>
                <Ionicons name="information-circle" size={20} color={Colors.primary} />
                <Text style={[styles.alertText, { color: Colors.primary }]}>
                  Transfer exactly <Text style={{ fontWeight: 'bold' }}>₦{Number(dynamicAccount?.amount).toLocaleString()}</Text> to the account below. This account expires in 60 minutes.
                </Text>
              </View>

              <View style={[styles.detailBox, { backgroundColor: Colors.backgroundElevated, borderColor: Colors.glassBorder }]}>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: Colors.textSecondary }]}>Bank Name</Text>
                  <Text style={[styles.detailValue, { color: Colors.textPrimary }]}>{dynamicAccount?.bankName}</Text>
                </View>
                
                <View style={[styles.divider, { backgroundColor: Colors.glassBorder }]} />
                
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: Colors.textSecondary }]}>Account Number</Text>
                  <View style={styles.copyRow}>
                    <Text style={[styles.detailValue, { color: Colors.textPrimary, fontSize: 20, letterSpacing: 1 }]}>
                      {dynamicAccount?.accountNumber}
                    </Text>
                    <TouchableOpacity onPress={() => copyToClipboard(dynamicAccount?.accountNumber || '', 'Account Number')}>
                      <Ionicons name="copy-outline" size={20} color={Colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={[styles.divider, { backgroundColor: Colors.glassBorder }]} />

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: Colors.textSecondary }]}>Account Name</Text>
                  <Text style={[styles.detailValue, { color: Colors.textPrimary }]}>DataPlug - Flutterwave</Text>
                </View>
              </View>

              <Text style={[styles.expiryText, { color: Colors.textMuted }]}>
                Your wallet will be credited automatically once the transfer is confirmed.
              </Text>
            </View>

            <TouchableOpacity 
              style={[styles.doneBtn, { backgroundColor: Colors.primary }]} 
              onPress={() => {
                setShowModal(false);
                router.replace('/');
              }}
            >
              <Text style={styles.doneText}>I have made the transfer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Bank Picker Modal (USSD) */}
      <Modal visible={showBankPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: Colors.background, borderColor: Colors.glassBorder, maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: Colors.textPrimary }]}>Select Your Bank</Text>
              <TouchableOpacity onPress={() => { setShowBankPicker(false); setBankSearch(''); }} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={[styles.searchBox, { backgroundColor: Colors.backgroundElevated, borderColor: Colors.glassBorder }]}>
              <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
              <TextInput
                style={[styles.searchInput, { color: Colors.textPrimary }, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                placeholder="Search bank..."
                placeholderTextColor={Colors.textMuted}
                value={bankSearch}
                onChangeText={setBankSearch}
              />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: Spacing.md }}>
              {banks.length === 0 ? (
                // Animated skeleton rows
                Array.from({ length: 8 }).map((_, i) => (
                  <SkeletonBankRow key={i} Colors={Colors} delay={i * 60} />
                ))
              ) : filteredBanks.map((bank, index) => (
                <TouchableOpacity
                  key={`${bank.code}-${bank.name}-${index}`}
                  style={[styles.bankRow, { borderBottomColor: Colors.glassBorder, backgroundColor: selectedBank?.code === bank.code ? hexToRgba(Colors.primary, 0.08) : 'transparent' }]}
                  onPress={() => {
                    setSelectedBank(bank);
                    setShowBankPicker(false);
                    setBankSearch('');
                    triggerHaptic();
                  }}
                >
                  <Text style={[styles.bankName, { color: Colors.textPrimary }]}>{bank.name}</Text>
                  {selectedBank?.code === bank.code && <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />}
                </TouchableOpacity>
              ))}
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* USSD Code Modal */}
      <Modal visible={showUssdModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: Colors.background, borderColor: Colors.glassBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: Colors.textPrimary }]}>Dial to Pay</Text>
              <TouchableOpacity onPress={() => setShowUssdModal(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={[styles.ussdCodeBox, { backgroundColor: hexToRgba('#10B981', 0.1), borderColor: '#10B981' }]}>
                <Text style={[styles.ussdCodeText, { color: '#10B981' }]}>{ussdCode}</Text>
              </View>

              <View style={[styles.alertBox, { marginTop: Spacing.md }]}>
                <Ionicons name="information-circle" size={20} color={Colors.primary} />
                <Text style={[styles.alertText, { color: Colors.textPrimary }]}>
                  Dial the code above on your phone to authorise the payment of <Text style={{ fontWeight: 'bold' }}>₦{Number(amount).toLocaleString()}</Text>. Enter your bank PIN when prompted.
                </Text>
              </View>

              <Text style={[styles.expiryText, { color: Colors.textMuted, marginTop: Spacing.md }]}>
                Your wallet will be credited automatically once the transaction is confirmed.
              </Text>
            </View>

            <TouchableOpacity 
              style={[styles.doneBtn, { backgroundColor: '#10B981' }]} 
              onPress={() => {
                setShowUssdModal(false);
                router.replace('/');
              }}
            >
              <Text style={styles.doneText}>I have dialled the code</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  backBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...Typography.h3 },
  scroll: { paddingHorizontal: Spacing.xl, gap: Spacing.md, paddingBottom: 20 },
  balLabel: { ...Typography.captionBold, marginBottom: 4 },
  balValue: { ...Typography.h1 },
  label: { ...Typography.captionBold, marginTop: Spacing.sm },

  amountWrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.xl, borderRadius: BorderRadius.lg, borderWidth: 1, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  currencySymbol: { ...Typography.h1, marginLeft: Spacing.md, marginRight: 8, marginTop: 4 },
  amountInput: { ...Typography.hero, fontSize: 42, minWidth: 100, textAlign: 'center' },
  
  methodCard: { padding: Spacing.md, borderRadius: BorderRadius.lg, marginBottom: Spacing.sm },
  methodRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  methodIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  methodName: { ...Typography.bodyBold, marginBottom: 2 },
  methodDesc: { ...Typography.small },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
  
  fundBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 56, borderRadius: BorderRadius.lg, overflow: 'hidden', marginTop: Spacing.xl },
  fundText: { ...Typography.button, color: '#FFF' },

  alertBox: { flexDirection: 'row', gap: Spacing.sm, padding: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: hexToRgba('#3B82F6', 0.1), alignItems: 'center', marginBottom: Spacing.md },
  alertText: { ...Typography.small, flex: 1, lineHeight: 18 },
  detailBox: { padding: Spacing.lg, borderRadius: BorderRadius.lg, borderWidth: 1, gap: Spacing.md },
  detailRow: { gap: 4 },
  detailLabel: { ...Typography.captionBold },
  detailValue: { ...Typography.bodyBold },
  copyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  divider: { height: 1, width: '100%', opacity: 0.5 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: Spacing.xl, paddingBottom: 40, borderWidth: 1, borderBottomWidth: 0 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  modalTitle: { ...Typography.h2 },
  closeBtn: { padding: 4 },
  modalBody: { gap: Spacing.md },
  expiryText: { ...Typography.small, textAlign: 'center', marginTop: Spacing.sm, fontStyle: 'italic' },
  doneBtn: { height: 56, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.xl, overflow: 'hidden' },
  doneText: { ...Typography.button, color: '#FFF' },

  // USSD styles
  bankSelectHint: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1, marginTop: Spacing.md },
  bankSelectText: { ...Typography.body, flex: 1 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.md, height: 44, borderRadius: BorderRadius.pill, borderWidth: 1 },
  searchInput: { flex: 1, ...Typography.body },
  bankRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.md, paddingHorizontal: Spacing.sm, borderBottomWidth: 1 },
  bankName: { ...Typography.body },
  ussdCodeBox: { borderWidth: 1.5, borderRadius: BorderRadius.xl, padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.sm },
  ussdCodeText: { fontSize: 32, fontWeight: '800', letterSpacing: 2, textAlign: 'center' },
});
