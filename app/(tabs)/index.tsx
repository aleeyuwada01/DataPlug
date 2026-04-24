import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppHaptic } from '../../hooks/useAppHaptic';

import { ActionButton } from '../../components/ActionButton';
import { RewardProgress } from '../../components/RewardProgress';
import { CheckInBanner } from '../../components/CheckInBanner';
import { GlassCard } from '../../components/GlassCard';
import { useTheme } from '../../contexts/ThemeContext';
import { Typography, Spacing, BorderRadius } from '../../constants/theme';
import { hexToRgba } from '../../utils/colors';

const { width: SW } = Dimensions.get('window');

// ─── Bank-Style Balance Card ─────────────────────────────────────────────────
function BalanceCard({
  balance,
  visible,
  onToggle,
  onAddFunds,
  accountNumber,
  bankName,
  loading,
}: {
  balance: string;
  visible: boolean;
  onToggle: () => void;
  onAddFunds: () => void;
  accountNumber?: string;
  bankName?: string;
  loading?: boolean;
}) {
  const scaleAnim = useRef(new Animated.Value(0.96)).current;
  useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
      {/* Dark green gradient — always dark like a real bank card */}
      <LinearGradient
        colors={['#1B5E2B', '#2D8F47', '#34A853']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.cardCircle1} />
      <View style={styles.cardCircle2} />

      <View style={styles.cardTopRow}>
        <Text style={styles.cardLabel}>Total Balance</Text>
        <TouchableOpacity onPress={onToggle} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons
            name={visible ? 'eye-outline' : 'eye-off-outline'}
            size={20}
            color="rgba(255,255,255,0.7)"
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.cardBalance}>
        {visible ? balance : '₦ • • • • •  •'}
      </Text>

      {loading ? (
        <ActivityIndicator size="small" color="rgba(255,255,255,0.5)" />
      ) : accountNumber ? (
        <Text style={[styles.cardMasked, { letterSpacing: 1.5, fontSize: 13, color: 'rgba(255,255,255,0.85)' }]}>
          {bankName}  •  {accountNumber}
        </Text>
      ) : <View style={{ height: 18 }} />}

      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.cardBtn} onPress={onAddFunds} activeOpacity={0.8}>
          <View style={styles.cardBtnInner}>
            <Ionicons name="add" size={16} color="rgba(255,255,255,0.9)" />
            <Text style={styles.cardBtnText}>Add Funds</Text>
          </View>
          <Ionicons name="arrow-up" size={14} color="rgba(255,255,255,0.5)" />
        </TouchableOpacity>

        <View style={styles.cardDivider} />

        <TouchableOpacity style={styles.cardBtn} activeOpacity={0.8}>
          <View style={styles.cardBtnInner}>
            <Ionicons name="download" size={16} color="rgba(255,255,255,0.9)" />
            <Text style={styles.cardBtnText}>Receive</Text>
          </View>
          <Ionicons name="arrow-down" size={14} color="rgba(255,255,255,0.5)" />
        </TouchableOpacity>

      </View>
    </Animated.View>
  );
}

// removed surface card component

import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';

// ... other imports

// ─── Home Screen ─────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { Colors, isDark, toggleTheme } = useTheme();
  const { user } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [checkInClaimed, setCheckInClaimed] = useState(false);
  
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [virtualAccount, setVirtualAccount] = useState<{accountNumber?: string, bankName?: string} | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { triggerHaptic, triggerNotification } = useAppHaptic();

  const loadData = async () => {
    try {
      const [walletRes, txRes] = await Promise.all([
        api.wallet.getBalance(),
        api.transactions.getHistory({ limit: 5 })
      ]);
      setWalletBalance(walletRes.balance);
      if (walletRes.virtualAccountNumber) {
        setVirtualAccount({
          accountNumber: walletRes.virtualAccountNumber,
          bankName: walletRes.virtualBankName,
        });
      }
      setTransactions(txRes.transactions);
    } catch (err) {
      console.log('Error loading home data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    triggerHaptic();
    await loadData();
    setRefreshing(false);
  };

  return (
    <View style={[styles.screen, { backgroundColor: Colors.background, paddingTop: insets.top }]}>
      <View style={[styles.topGlow, { opacity: isDark ? 0.1 : 0.06 }]} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: 120 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image 
              source={{ uri: 'https://i.ibb.co/Kx2611sf/iconlight.png' }} 
              style={[styles.appLogo, { tintColor: isDark ? '#FFFFFF' : undefined }]} 
              resizeMode="contain" 
            />
            <View>
              <Text style={[styles.greetSub, { color: Colors.textMuted }]}>Good morning 🌤</Text>
              <View style={styles.greetRow}>
                <Text style={[styles.greetName, { color: Colors.textPrimary }]}>{user?.fullName?.split(' ')[0] || 'User'}</Text>
                <Text style={styles.greetWave}>👋</Text>
              </View>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={toggleTheme}
              style={[styles.headerBtn, { backgroundColor: Colors.glassBackground, borderColor: Colors.glassBorder }]}
            >
              <Ionicons
                name={isDark ? 'sunny-outline' : 'moon-outline'}
                size={20}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.headerBtn, { backgroundColor: Colors.glassBackground, borderColor: Colors.glassBorder }]}
            >
              <Ionicons name="notifications-outline" size={20} color={Colors.textSecondary} />
              <View style={[styles.notifDot, { borderColor: Colors.background }]} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.avatar}>
              <LinearGradient colors={['#34A853', '#4CD964']} style={StyleSheet.absoluteFillObject} />
              <Text style={styles.avatarText}>{user?.fullName?.charAt(0)?.toUpperCase() || 'U'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <BalanceCard
          balance={loading ? '...' : `₦${(walletBalance / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          visible={balanceVisible}
          onToggle={() => setBalanceVisible(!balanceVisible)}
          onAddFunds={() => router.push('/fund-wallet')}
          accountNumber={virtualAccount?.accountNumber}
          bankName={virtualAccount?.bankName}
          loading={loading}
        />

        {/* Quick Actions */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: Colors.textPrimary }]}>Quick Actions</Text>
        </View>

        <GlassCard style={styles.actionsCard}>
          <View style={styles.actionsGrid}>
            <ActionButton icon="cloud-download-outline" label="Buy Data" color={Colors.primary} onPress={() => router.push('/buy-data')} delay={0} />
            <ActionButton icon="call-outline" label="Buy Airtime" color={Colors.accentBlue} onPress={() => router.push('/buy-airtime')} delay={60} />
            <ActionButton icon="wallet-outline" label="Fund Wallet" color={Colors.accentPurple} onPress={() => router.push('/fund-wallet')} delay={120} />
            <ActionButton icon="gift-outline" label="Gift Data" color={Colors.accentOrange} onPress={() => router.push('/gift-data')} delay={180} />
          </View>
        </GlassCard>

        {/* Daily Bonus */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: Colors.textPrimary }]}>Daily Bonus</Text>
          <TouchableOpacity>
            <Text style={[styles.seeAll, { color: Colors.primary }]}>View all</Text>
          </TouchableOpacity>
        </View>

        <CheckInBanner rewardAmount="200MB" claimed={checkInClaimed} onClaim={() => {
          setCheckInClaimed(true);
          triggerNotification();
        }} />

        {/* Reward Progress */}
        <GlassCard>
          <RewardProgress currentDay={3} totalDays={7} rewardAmount="200MB" />
        </GlassCard>

        {/* Recent Activity */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: Colors.textPrimary }]}>Recent Activity</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/history')}>
            <Text style={[styles.seeAll, { color: Colors.primary }]}>See all</Text>
          </TouchableOpacity>
        </View>

        <GlassCard>
          {transactions.length === 0 ? (
            <Text style={{ textAlign: 'center', color: Colors.textMuted, paddingVertical: Spacing.xl }}>No recent activity</Text>
          ) : transactions.map((item, i) => {
            let iconName = 'wallet' as const;
            let iconColor = Colors.accentPurple;
            let isPositive = false;

            if (item.type === 'data') {
              iconName = 'cloud-download';
              iconColor = Colors.primary;
            } else if (item.type === 'airtime') {
              iconName = 'call';
              iconColor = Colors.accentBlue;
            } else if (item.type === 'fund') {
              iconName = 'wallet';
              iconColor = Colors.accentPurple;
              isPositive = true;
            }

            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.txRow, i < transactions.length - 1 && { borderBottomWidth: 1, borderBottomColor: Colors.glassBorder }]}
                activeOpacity={0.6}
              >
                <View style={[styles.txIcon, { backgroundColor: hexToRgba(iconColor, 0.09) }]}>
                  <Ionicons name={iconName} size={18} color={iconColor} />
                </View>
                <View style={styles.txInfo}>
                  <Text style={[styles.txType, { color: Colors.textPrimary, textTransform: 'capitalize' }]}>{item.type}</Text>
                  <Text style={[styles.txDesc, { color: Colors.textMuted }]}>{item.plan || item.network || 'Top-up'}</Text>
                </View>
                <View style={styles.txRight}>
                  <Text style={[styles.txAmount, { color: isPositive ? Colors.success : Colors.textPrimary }]}>
                    {isPositive ? '+' : '-'}₦{(item.amount / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Text>
                  <Text style={[styles.txTime, { color: Colors.textMuted }]}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </GlassCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topGlow: {
    position: 'absolute', top: -80, left: SW / 2 - 120,
    width: 240, height: 240, borderRadius: 120,
    backgroundColor: '#34A853',
  },
  scroll: { paddingHorizontal: Spacing.xl, gap: Spacing.lg },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: Spacing.lg,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  appLogo: { width: 36, height: 36 },
  greetSub: { ...Typography.small, marginBottom: 2 },
  greetRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  greetName: { ...Typography.h2 },
  greetWave: { fontSize: 20 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerBtn: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute', top: 9, right: 9,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#EF4444', borderWidth: 1.5,
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 14, fontWeight: '700', color: '#FFF', zIndex: 1 },

  // Bank card
  card: {
    borderRadius: 22, overflow: 'hidden', height: 210, padding: 22,
    justifyContent: 'space-between',
    shadowColor: '#1B5E2B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35, shadowRadius: 20, elevation: 10,
  },
  cardCircle1: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.07)', top: -60, right: -40,
  },
  cardCircle2: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.05)', bottom: -30, left: 10,
  },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLabel: { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '500', letterSpacing: 0.3 },
  cardBalance: { fontSize: 34, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
  cardMasked: { fontSize: 12, color: 'rgba(255,255,255,0.5)', letterSpacing: 2.5, fontWeight: '500' },
  cardActions: {
    flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.22)',
    borderRadius: 14, overflow: 'hidden', alignItems: 'center',
  },
  cardBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', paddingVertical: 10, gap: 6,
  },
  cardBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardBtnText: { fontSize: 13, color: '#FFFFFF', fontWeight: '600' },
  cardDivider: { width: 1, height: 22, backgroundColor: 'rgba(255,255,255,0.15)' },
  cardBtnIcon: { paddingHorizontal: 18, paddingVertical: 10, alignItems: 'center' },

  // Surface card
  surfaceCard: {
    borderRadius: BorderRadius.xl, borderWidth: 1, padding: Spacing.lg,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1,
    shadowRadius: 8, elevation: 2,
  },

  // Section headers
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  sectionTitle: { ...Typography.h3 },
  seeAll: { ...Typography.caption },
  actionsCard: { paddingVertical: 2 },
  actionsGrid: { flexDirection: 'row', justifyContent: 'space-between' },

  // Transactions
  txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, gap: Spacing.md },
  txIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  txInfo: { flex: 1 },
  txType: { ...Typography.captionBold, marginBottom: 2 },
  txDesc: { ...Typography.small },
  txRight: { alignItems: 'flex-end' },
  txAmount: { ...Typography.bodyBold, fontSize: 14 },
  txTime: { ...Typography.small, marginTop: 2 },
});
