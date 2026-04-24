import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { BorderRadius, Spacing } from '../constants/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'green' | 'reward' | 'elevated';
  glowing?: boolean;
  animateIn?: boolean;
  delay?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  variant = 'default',
  glowing = false,
  animateIn = true,
  delay = 0,
}) => {
  const fadeAnim = useRef(new Animated.Value(animateIn ? 0 : 1)).current;
  const slideAnim = useRef(new Animated.Value(animateIn ? 16 : 0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const { Colors, Gradients, isDark } = useTheme();

  useEffect(() => {
    if (animateIn) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 500, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    }
    if (glowing) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
          Animated.timing(glowAnim, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        ])
      ).start();
    }
  }, []);

  const getGradientColors = () => {
    switch (variant) {
      case 'green': return Gradients.cardGreen;
      case 'reward': return Gradients.reward;
      case 'elevated': return isDark ? ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)'] as const : ['rgba(255,255,255,0.98)', 'rgba(255,255,255,0.92)'] as const;
      default: return Gradients.card;
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { 
          opacity: fadeAnim, 
          transform: [{ translateY: slideAnim }],
          borderColor: Colors.glassBorder,
          shadowColor: Colors.shadowDark,
        },
        style,
      ]}
    >
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFillObject, { borderRadius: BorderRadius.xl }]}
      />
      <View style={styles.content}>{children}</View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  content: { padding: Spacing.lg },
});
