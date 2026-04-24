import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppHaptic } from '../hooks/useAppHaptic';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Gradients } from '../constants/theme';

interface CheckInBannerProps {
  rewardAmount?: string;
  onClaim?: () => void;
  claimed?: boolean;
}

export const CheckInBanner: React.FC<CheckInBannerProps> = ({
  rewardAmount = '200MB',
  onClaim,
  claimed = false,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { triggerNotification } = useAppHaptic();

  useEffect(() => {
    // Entrance
    Animated.spring(fadeAnim, {
      toValue: 1,
      tension: 40,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Pulse gift icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Bounce animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -6,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleClaim = () => {
    triggerNotification();
    
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();

    onClaim?.();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={Gradients.banner}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.5 }}
        style={[StyleSheet.absoluteFillObject, { borderRadius: BorderRadius.xl }]}
      />
      
      {/* Decorative circles */}
      <View style={[styles.decorCircle, styles.decorCircle1]} />
      <View style={[styles.decorCircle, styles.decorCircle2]} />

      <View style={styles.content}>
        <View style={styles.leftSection}>
          <Animated.View
            style={[
              styles.giftIconWrapper,
              { transform: [{ scale: pulseAnim }, { translateY: bounceAnim }] },
            ]}
          >
            <Text style={styles.giftEmoji}>🎉</Text>
          </Animated.View>
        </View>

        <View style={styles.centerSection}>
          <Text style={styles.title}>Daily Check-in</Text>
          <Text style={styles.subtitle}>
            Claim your free <Text style={styles.highlight}>{rewardAmount}</Text> today!
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleClaim}
          disabled={claimed}
          activeOpacity={0.8}
          style={[styles.claimButton, claimed && styles.claimedButton]}
        >
          <Text style={[styles.claimText, claimed && styles.claimedText]}>
            {claimed ? '✓' : 'Claim'}
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(76, 217, 100, 0.3)',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  decorCircle1: {
    width: 100,
    height: 100,
    top: -30,
    right: -20,
  },
  decorCircle2: {
    width: 60,
    height: 60,
    bottom: -20,
    left: 30,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  leftSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  giftIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  giftEmoji: {
    fontSize: 24,
  },
  centerSection: {
    flex: 1,
  },
  title: {
    ...Typography.bodyBold,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  subtitle: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.85)',
  },
  highlight: {
    fontWeight: '800',
    color: '#FFFFFF',
  },
  claimButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.pill,
  },
  claimedButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  claimText: {
    ...Typography.captionBold,
    color: Colors.primaryDark,
  },
  claimedText: {
    color: '#FFFFFF',
  },
});
