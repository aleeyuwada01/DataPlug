import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { GlassCard } from '../components/GlassCard';
import { TransactionPin } from '../components/TransactionPin';
import { Colors, Gradients, Typography, Spacing, BorderRadius } from '../constants/theme';

const NETWORKS = [
  { name: 'MTN', color: '#FFCC00', tc: '#000' },
  { name: 'GLO', color: '#50B651', tc: '#FFF' },
  { name: 'Airtel', color: '#ED1C24', tc: '#FFF' },
  { name: '9mobile', color: '#006C3E', tc: '#FFF' },
];

const GIFT_PLANS = [
  { size: '500MB', days: '7 Days', price: '₦150' },
  { size: '1GB', days: '30 Days', price: '₦300' },
  { size: '2GB', days: '30 Days', price: '₦600' },
  { size: '5GB', days: '30 Days', price: '₦1,500' },
];

export default function GiftDataScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selectedNetwork, setSelectedNetwork] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState(1);
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [showPin, setShowPin] = useState(false);

  const handleGift = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowPin(true);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <LinearGradient colors={Gradients.backgroundMain} style={StyleSheet.absoluteFillObject} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gift Data</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Gift Banner */}
        <GlassCard variant="reward">
          <View style={styles.giftBanner}>
            <Text style={{ fontSize: 32 }}>🎁</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.giftTitle}>Share the love!</Text>
              <Text style={styles.giftDesc}>Send data bundles to friends & family</Text>
            </View>
          </View>
        </GlassCard>

        <Text style={styles.label}>Recipient Network</Text>
        <View style={styles.netRow}>
          {NETWORKS.map((n, i) => (
            <TouchableOpacity key={i} onPress={() => setSelectedNetwork(i)} activeOpacity={0.7}>
              <GlassCard style={[styles.netCard, selectedNetwork === i && { borderColor: n.color, borderWidth: 2 }]} animateIn={false}>
                <View style={[styles.netDot, { backgroundColor: n.color }]}>
                  <Text style={[styles.netInit, { color: n.tc }]}>{n.name[0]}</Text>
                </View>
                <Text style={[styles.netName, selectedNetwork === i && { color: Colors.textPrimary }]}>{n.name}</Text>
              </GlassCard>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Recipient Number</Text>
        <GlassCard style={{ padding: 0 }} animateIn={false}>
          <View style={styles.inputRow}>
            <Text style={styles.prefix}>+234</Text>
            <TextInput style={styles.input} placeholder="810 123 4567" placeholderTextColor={Colors.textMuted} value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={11} />
            <TouchableOpacity style={styles.contactBtn}>
              <Ionicons name="people-outline" size={18} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </GlassCard>

        <Text style={styles.label}>Choose Gift Plan</Text>
        <View style={styles.plansRow}>
          {GIFT_PLANS.map((p, i) => (
            <TouchableOpacity key={i} onPress={() => setSelectedPlan(i)} style={styles.planWrap} activeOpacity={0.7}>
              <GlassCard style={[styles.planCard, selectedPlan === i && styles.planActive]} variant={selectedPlan === i ? 'green' : 'default'} animateIn={false}>
                <Text style={[styles.planSize, selectedPlan === i && { color: Colors.primary }]}>{p.size}</Text>
                <Text style={styles.planDays}>{p.days}</Text>
                <Text style={[styles.planPrice, selectedPlan === i && { color: Colors.textPrimary }]}>{p.price}</Text>
              </GlassCard>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Personal Message (Optional)</Text>
        <GlassCard style={{ padding: 0 }} animateIn={false}>
          <TextInput
            style={styles.msgInput}
            placeholder="Add a sweet note..."
            placeholderTextColor={Colors.textMuted}
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={100}
          />
        </GlassCard>

        <TouchableOpacity style={styles.giftBtn} onPress={handleGift} activeOpacity={0.8}>
          <LinearGradient colors={['#F59E0B', '#D97706']} style={[StyleSheet.absoluteFillObject, { borderRadius: BorderRadius.lg }]} />
          <Ionicons name="gift" size={20} color="#FFF" />
          <Text style={styles.giftBtnText}>Send Gift 🎉</Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>

      <TransactionPin visible={showPin} onComplete={() => { setShowPin(false); setTimeout(() => router.back(), 500); }} onCancel={() => setShowPin(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.glassBackground, borderWidth: 1, borderColor: Colors.glassBorder, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...Typography.h3, color: Colors.textPrimary },
  scroll: { paddingHorizontal: Spacing.xl, gap: Spacing.md, paddingBottom: 20 },
  giftBanner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  giftTitle: { ...Typography.h3, color: Colors.textPrimary, marginBottom: 2 },
  giftDesc: { ...Typography.caption, color: Colors.textSecondary },
  label: { ...Typography.captionBold, color: Colors.textSecondary, marginTop: Spacing.sm },
  netRow: { flexDirection: 'row', gap: Spacing.md },
  netCard: { alignItems: 'center', padding: Spacing.md, width: 75, borderWidth: 1, borderColor: 'transparent' },
  netDot: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  netInit: { fontSize: 16, fontWeight: '800' },
  netName: { ...Typography.small, color: Colors.textMuted },
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, height: 52 },
  prefix: { ...Typography.bodyBold, color: Colors.textSecondary, marginRight: Spacing.md },
  input: { flex: 1, ...Typography.body, color: Colors.textPrimary, height: '100%' },
  contactBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primaryMuted, alignItems: 'center', justifyContent: 'center' },
  plansRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  planWrap: { width: '47%', flexGrow: 1 },
  planCard: { alignItems: 'center', padding: Spacing.lg, borderWidth: 1, borderColor: 'transparent' },
  planActive: { borderColor: Colors.primary },
  planSize: { ...Typography.h2, color: Colors.textSecondary, marginBottom: 2 },
  planDays: { ...Typography.small, color: Colors.textMuted, marginBottom: 6 },
  planPrice: { ...Typography.bodyBold, color: Colors.textSecondary },
  msgInput: { ...Typography.body, color: Colors.textPrimary, padding: Spacing.lg, height: 80, textAlignVertical: 'top' },
  giftBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 54, borderRadius: BorderRadius.lg, overflow: 'hidden', marginTop: Spacing.sm },
  giftBtnText: { ...Typography.button, color: '#FFF' },
});
