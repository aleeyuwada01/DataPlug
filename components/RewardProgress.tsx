import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography, Spacing, BorderRadius } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';

interface RewardProgressProps {
  currentDay: number;
  totalDays?: number;
  rewardAmount?: string;
}

export const RewardProgress: React.FC<RewardProgressProps> = ({
  currentDay = 3,
  totalDays = 7,
  rewardAmount = '200MB',
}) => {
  const { Colors } = useTheme();
  const progressAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: currentDay / totalDays,
      duration: 1200,
      delay: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    // Shimmer effect
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    ).start();
  }, [currentDay]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.emoji}>🎁</Text>
          <Text style={[styles.title, { color: Colors.textPrimary }]}>Daily Reward</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: Colors.primaryMuted }]}>
          <Text style={[styles.badgeText, { color: Colors.primary }]}>{rewardAmount}/day</Text>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, { width: progressWidth }]}>
          <LinearGradient
            colors={['#34A853', '#4CD964', '#34A853']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>
      </View>

      <View style={styles.daysRow}>
        {Array.from({ length: totalDays }, (_, i) => (
          <View key={i} style={styles.dayItem}>
            <View
              style={[
                styles.dayDot,
                i < currentDay && { backgroundColor: Colors.primaryMuted, borderColor: Colors.primary },
                i === currentDay && { borderColor: Colors.primary, borderWidth: 2, backgroundColor: 'transparent' },
              ]}
            >
              {i < currentDay && <Text style={[styles.checkmark, { color: Colors.primary }]}>✓</Text>}
              {i === currentDay && (
                <View style={[styles.currentDotInner, { backgroundColor: Colors.primary }]} />
              )}
            </View>
            <Text
              style={[
                styles.dayLabel,
                { color: Colors.textMuted },
                i < currentDay && { color: Colors.primary },
                i === currentDay && { color: Colors.primaryLight, fontWeight: '700' },
              ]}
            >
              D{i + 1}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emoji: {
    fontSize: 20,
  },
  title: {
    ...Typography.bodyBold,
  },
  badge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.pill,
  },
  badgeText: {
    ...Typography.small,
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    overflow: 'hidden',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayItem: {
    alignItems: 'center',
    gap: 4,
  },
  dayDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  currentDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  checkmark: {
    fontSize: 12,
    fontWeight: '700',
  },
  dayLabel: {
    ...Typography.small,
    fontSize: 10,
  },
});
