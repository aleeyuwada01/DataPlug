import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { GlassCard } from '../components/GlassCard';
import { useTheme } from '../contexts/ThemeContext';
import { Typography, Spacing, BorderRadius } from '../constants/theme';
import { useAppHaptic } from '../hooks/useAppHaptic';

const { width: SW } = Dimensions.get('window');

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { Colors, isDark } = useTheme();
  const { triggerHaptic } = useAppHaptic();

  return (
    <View style={[styles.screen, { backgroundColor: Colors.background }]}>
      <LinearGradient colors={isDark ? ['#0A0E14', '#0F1520'] : ['#FFFFFF', '#F8FAFC']} style={StyleSheet.absoluteFillObject} />
      
      {/* Abstract Background Glow */}
      <View style={[styles.glow, { backgroundColor: 'rgba(52, 168, 83, 0.15)' }]} />
      
      <View style={[styles.content, { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing.xl }]}>
        
        <View style={styles.topSection}>
          <Image 
            source={{ uri: 'https://i.ibb.co/Kx2611sf/iconlight.png' }} 
            style={[styles.logo, isDark && { tintColor: '#FFFFFF' }]} 
            resizeMode="contain" 
          />
          <Text style={[styles.title, { color: Colors.primary }]}>DataPlug</Text>
          <Text style={[styles.subtitle, { color: Colors.textSecondary }]}>The smartest way to buy data</Text>
        </View>

        <View style={styles.middleSection}>
          <GlassCard delay={100} style={styles.promoCard} variant="green" glowing>
            <View style={styles.promoIconWrap}>
              <Text style={{ fontSize: 32 }}>🎁</Text>
            </View>
            <View style={styles.promoTextWrap}>
              <Text style={[styles.promoTitle, { color: Colors.textPrimary }]}>1GB Free Data</Text>
              <Text style={[styles.promoDesc, { color: Colors.textSecondary }]}>For all new users today!</Text>
            </View>
          </GlassCard>

          <GlassCard delay={200} style={styles.promoCard}>
            <View style={[styles.promoIconWrap, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <Text style={{ fontSize: 32 }}>🔥</Text>
            </View>
            <View style={styles.promoTextWrap}>
              <Text style={[styles.promoTitle, { color: Colors.textPrimary }]}>Daily Check-in Bonus</Text>
              <Text style={[styles.promoDesc, { color: Colors.textSecondary }]}>Earn free MTN data every day</Text>
            </View>
          </GlassCard>
        </View>

        <View style={styles.bottomSection}>
          <TouchableOpacity 
            style={styles.primaryBtn} 
            activeOpacity={0.8}
            onPress={() => { triggerHaptic(); router.push('/onboarding'); }}
          >
            <LinearGradient colors={['#34A853', '#2D8F47']} style={StyleSheet.absoluteFillObject} />
            <Text style={styles.primaryBtnText}>Create Account</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.secondaryBtn, { borderColor: Colors.glassBorder, backgroundColor: Colors.backgroundElevated }]} 
            activeOpacity={0.8}
            onPress={() => { triggerHaptic(); router.push('/login'); }}
          >
            <Text style={[styles.secondaryBtnText, { color: Colors.textPrimary }]}>Log In</Text>
          </TouchableOpacity>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  glow: { position: 'absolute', top: -100, right: -100, width: 300, height: 300, borderRadius: 150 },
  content: { flex: 1, paddingHorizontal: Spacing.xl, justifyContent: 'space-between' },
  
  topSection: { alignItems: 'center', marginTop: Spacing.xxl },
  logo: { width: 80, height: 80, marginBottom: Spacing.lg },
  title: { ...Typography.hero, fontSize: 40, letterSpacing: -1 },
  subtitle: { ...Typography.body, marginTop: Spacing.xs },
  
  middleSection: { gap: Spacing.md, marginVertical: Spacing.xxl },
  promoCard: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, gap: Spacing.md },
  promoIconWrap: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  promoTextWrap: { flex: 1 },
  promoTitle: { ...Typography.h3, marginBottom: 4 },
  promoDesc: { ...Typography.small },

  bottomSection: { gap: Spacing.md },
  primaryBtn: { flexDirection: 'row', height: 60, borderRadius: BorderRadius.pill, alignItems: 'center', justifyContent: 'center', gap: 8, overflow: 'hidden' },
  primaryBtnText: { ...Typography.button, color: '#FFF', fontSize: 18 },
  secondaryBtn: { height: 60, borderRadius: BorderRadius.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  secondaryBtnText: { ...Typography.button, fontSize: 18 },
});
