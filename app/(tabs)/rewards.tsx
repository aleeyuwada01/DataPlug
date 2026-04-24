import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppHaptic } from '../../hooks/useAppHaptic';
import { GlassCard } from '../../components/GlassCard';
import { useTheme } from '../../contexts/ThemeContext';
import { Typography, Spacing, BorderRadius } from '../../constants/theme';
import { hexToRgba } from '../../utils/colors';
import { api } from '../../services/api';

const BADGES = [
  { emoji: '🌟', name: 'Early Bird', earned: true },
  { emoji: '🔥', name: '7-Day', earned: true },
  { emoji: '💰', name: 'Spender', earned: false },
  { emoji: '🎁', name: 'Gifter', earned: false },
  { emoji: '👑', name: 'VIP', earned: false },
];

export default function RewardsScreen() {
  const insets = useSafeAreaInsets();
  const { Colors } = useTheme();
  const { triggerHaptic, triggerNotification } = useAppHaptic();
  
  const [claimed, setClaimed] = useState(false);
  const [points, setPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [tier, setTier] = useState('Bronze');
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchRewards = async () => {
      try {
        const res = await api.rewards.get();
        if (res.reward) {
          setPoints(res.reward.totalPoints);
          setStreak(res.reward.currentStreak);
          setTier(res.reward.tier);
        }
        if (res.checkInStatus) {
          setClaimed(res.checkInStatus.alreadyCheckedIn);
        }
      } catch (err) {
        console.error('Failed to load rewards', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRewards();
  }, []);
  
  const REWARDS = [
    { id: 1, title: 'Daily Streak', desc: '7 day check-in', reward: '500MB', progress: Math.min(streak, 7), total: 7, icon: '🔥', color: '#F59E0B' },
    { id: 2, title: 'First Purchase', desc: 'Buy data once', reward: '₦100', progress: 1, total: 1, icon: '🎯', color: Colors.primary },
    { id: 3, title: 'Refer Friends', desc: 'Invite 5 friends', reward: '2GB', progress: 2, total: 5, icon: '👥', color: '#8B5CF6' },
    { id: 4, title: 'Big Spender', desc: 'Top-up ₦10k', reward: '1GB+₦200', progress: 75, total: 100, icon: '💎', color: '#10B981' },
  ];

  const handleRedeem = async () => {
    if (claimed) {
      Alert.alert("Already Claimed", "You have already claimed your daily reward!");
      return;
    }
    
    try {
      const res = await api.rewards.checkIn();
      triggerHaptic();
      setPoints(p => p + res.pointsAwarded);
      setStreak(res.newStreak);
      setClaimed(true);
      triggerNotification();
      Alert.alert("Daily Reward Claimed! 🎉", `You've received ${res.pointsAwarded} points and your streak is now ${res.newStreak}.`);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to check in");
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top, backgroundColor: Colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: Colors.textPrimary }]}>Rewards</Text>
        </View>

        <GlassCard delay={100}>
          <View style={styles.pointsRow}>
            <View>
              <Text style={[styles.ptLabel, { color: Colors.textSecondary }]}>Your Points</Text>
              <Text style={[styles.ptValue, { color: Colors.textPrimary }]}>{loading ? '...' : points.toLocaleString()}</Text>
              <Text style={[styles.ptSub, { color: Colors.textMuted }]}>≈ {((points || 0) / 1000).toFixed(2)}GB Value</Text>
            </View>
            <View style={styles.levelBadge}>
              <Text style={{ fontSize: 14 }}>⚡</Text>
              <Text style={styles.levelText}>{tier}</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={[styles.redeemBtn, claimed && { opacity: 0.5 }]} 
            activeOpacity={0.8}
            onPress={handleRedeem}
          >
            <LinearGradient colors={['#34A853', '#2D8F47']} style={[StyleSheet.absoluteFillObject, { borderRadius: BorderRadius.pill }]} />
            <Ionicons name={claimed ? "checkmark-circle" : "gift"} size={16} color="#FFF" />
            <Text style={styles.redeemText}>{claimed ? "Claimed Today" : "Claim Daily Points"}</Text>
          </TouchableOpacity>
        </GlassCard>

        <Text style={[styles.secTitle, { color: Colors.textPrimary }]}>Badges</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgesRow}>
          {BADGES.map((b, i) => (
            <GlassCard key={i} style={[styles.badgeCard, !b.earned && { opacity: 0.4 }]} delay={i * 60}>
              <Text style={{ fontSize: 26, marginBottom: 4 }}>{b.emoji}</Text>
              <Text style={[styles.badgeName, { color: Colors.textSecondary }]}>{b.name}</Text>
              {!b.earned && <Ionicons name="lock-closed" size={12} color={Colors.textMuted} style={{ position: 'absolute', top: 6, right: 6 }} />}
            </GlassCard>
          ))}
        </ScrollView>

        <Text style={[styles.secTitle, { color: Colors.textPrimary }]}>Challenges</Text>
        {REWARDS.map((r, i) => (
          <GlassCard key={r.id} delay={200 + i * 80}>
            <View style={styles.chalRow}>
              <View style={[styles.chalIcon, { backgroundColor: hexToRgba(r.color, 0.08) }]}>
                <Text style={{ fontSize: 20 }}>{r.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.chalTitle, { color: Colors.textPrimary }]}>{r.title}</Text>
                <Text style={[styles.chalDesc, { color: Colors.textMuted }]}>{r.desc}</Text>
                <View style={styles.chalProgRow}>
                  <View style={[styles.chalTrack, { backgroundColor: 'rgba(150,150,150,0.2)' }]}>
                    <View style={[styles.chalFill, { width: `${(r.progress / r.total) * 100}%`, backgroundColor: r.color }]} />
                  </View>
                  <Text style={[styles.chalProg, { color: r.color }]}>{r.progress}/{r.total}</Text>
                </View>
              </View>
            </View>
            <View style={[styles.chalReward, { borderTopColor: Colors.glassBorder }]}>
              <Ionicons name="gift-outline" size={14} color={Colors.primary} />
              <Text style={[styles.chalRewardText, { color: Colors.primary }]}>{r.reward}</Text>
            </View>
          </GlassCard>
        ))}
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
  pointsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.lg },
  ptLabel: { ...Typography.captionBold, marginBottom: 4 },
  ptValue: { ...Typography.hero, fontSize: 44 },
  ptSub: { ...Typography.small, marginTop: 4 },
  levelBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(245,158,11,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.pill },
  levelText: { ...Typography.captionBold, color: '#F59E0B' },
  redeemBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, borderRadius: BorderRadius.pill, overflow: 'hidden' },
  redeemText: { ...Typography.button, color: '#FFF', fontSize: 16 },
  secTitle: { ...Typography.h2, marginTop: Spacing.sm },
  badgesRow: { gap: Spacing.md },
  badgeCard: { width: 85, alignItems: 'center', padding: Spacing.md, borderWidth: 1, borderRadius: BorderRadius.lg },
  badgeName: { ...Typography.captionBold, textAlign: 'center' },
  chalRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  chalIcon: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  chalTitle: { ...Typography.bodyBold, marginBottom: 2 },
  chalDesc: { ...Typography.small, marginBottom: Spacing.sm },
  chalProgRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  chalTrack: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  chalFill: { height: '100%', borderRadius: 3 },
  chalProg: { ...Typography.small, fontWeight: '700', minWidth: 35, textAlign: 'right' },
  chalReward: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: Spacing.md, borderTopWidth: 1 },
  chalRewardText: { ...Typography.captionBold },
});
