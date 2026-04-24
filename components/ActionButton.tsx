import React, { useRef, useCallback } from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppHaptic } from '../hooks/useAppHaptic';
import { Colors, Typography, BorderRadius, Spacing } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { hexToRgba } from '../utils/colors';

interface ActionButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color?: string;
  onPress?: () => void;
  delay?: number;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  label,
  color = Colors.primary,
  onPress,
  delay = 0,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const { triggerHaptic } = useAppHaptic();

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.88,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 200,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePress = useCallback(() => {
    triggerHaptic();
    onPress?.();
  }, [onPress]);

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        style={styles.button}
      >
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={[hexToRgba(color, 0.15), hexToRgba(color, 0.03)]}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={[styles.iconRing, { borderColor: hexToRgba(color, 0.19) }]}>
            <Ionicons name={icon} size={24} color={color} />
          </View>
        </View>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    width: '25%',
  },
  button: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.circle,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  iconRing: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.circle,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  label: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
