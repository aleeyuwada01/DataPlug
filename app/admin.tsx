import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from '../components/GlassCard';
import { useTheme } from '../contexts/ThemeContext';
import { Typography, Spacing, BorderRadius } from '../constants/theme';
import { api } from '../services/api';

export default function AdminScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { Colors } = useTheme();

  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.admin.getStats();
        setStats(res);
      } catch (err) {
        console.error('Failed to load admin stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <View style={[styles.screen, { paddingTop: insets.top, backgroundColor: Colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: Colors.backgroundElevated, borderColor: Colors.glassBorder }]}>
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: Colors.textPrimary }]}>Admin Dashboard</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 50 }} />
        ) : (
          <>
            <GlassCard delay={100}>
              <Text style={[styles.sectionTitle, { color: Colors.textPrimary }]}>Overview</Text>
              <View style={styles.statsGrid}>
                <View style={[styles.statBox, { backgroundColor: Colors.backgroundElevated, borderColor: Colors.glassBorder }]}>
                  <Text style={[styles.statLabel, { color: Colors.textSecondary }]}>Total Users</Text>
                  <Text style={[styles.statValue, { color: Colors.textPrimary }]}>{stats?.totalUsers || 0}</Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: Colors.backgroundElevated, borderColor: Colors.glassBorder }]}>
                  <Text style={[styles.statLabel, { color: Colors.textSecondary }]}>Total TXs</Text>
                  <Text style={[styles.statValue, { color: Colors.textPrimary }]}>{stats?.totalTransactions || 0}</Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: Colors.backgroundElevated, borderColor: Colors.glassBorder, width: '100%', marginTop: Spacing.sm }]}>
                  <Text style={[styles.statLabel, { color: Colors.textSecondary }]}>Total Platform Revenue</Text>
                  <Text style={[styles.statValue, { color: Colors.success }]}>
                    {stats?.totalRevenueFormatted || '₦0'}
                  </Text>
                </View>
              </View>
            </GlassCard>

            <GlassCard delay={200} style={{ marginTop: Spacing.md }}>
              <Text style={[styles.sectionTitle, { color: Colors.textPrimary }]}>Quick Actions</Text>
              
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.backgroundElevated, borderColor: Colors.glassBorder }]}>
                <Ionicons name="people" size={20} color={Colors.primary} />
                <Text style={[styles.actionText, { color: Colors.textPrimary }]}>Manage Users</Text>
                <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.backgroundElevated, borderColor: Colors.glassBorder }]}>
                <Ionicons name="list" size={20} color="#3B82F6" />
                <Text style={[styles.actionText, { color: Colors.textPrimary }]}>View All Transactions</Text>
                <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.backgroundElevated, borderColor: Colors.glassBorder }]}>
                <Ionicons name="add-circle" size={20} color="#8B5CF6" />
                <Text style={[styles.actionText, { color: Colors.textPrimary }]}>Manage Data Plans</Text>
                <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            </GlassCard>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  backBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...Typography.h3 },
  scroll: { paddingHorizontal: Spacing.xl, gap: Spacing.md, paddingBottom: 40 },
  sectionTitle: { ...Typography.h3, marginBottom: Spacing.md },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statBox: { width: '48%', padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, alignItems: 'center' },
  statLabel: { ...Typography.captionBold, marginBottom: 4 },
  statValue: { ...Typography.h2 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, marginBottom: Spacing.sm },
  actionText: { flex: 1, marginLeft: Spacing.md, ...Typography.bodyBold },
});
