import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useAppHaptic } from '../hooks/useAppHaptic';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { Typography, Spacing, BorderRadius } from '../constants/theme';

interface TransactionPinProps {
  visible: boolean;
  onComplete: (pin: string) => void;
  onCancel: () => void;
}

export const TransactionPin: React.FC<TransactionPinProps> = ({
  visible,
  onComplete,
  onCancel,
}) => {
  const { Colors, isDark } = useTheme();
  const { triggerHaptic } = useAppHaptic();
  const [pin, setPin] = React.useState(['', '', '', '']);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;
  const dotAnimations = useRef(
    Array.from({ length: 4 }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 9,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleKeyPress = (digit: string) => {
    if (activeIndex >= 4) return;

    triggerHaptic();

    const newPin = [...pin];
    newPin[activeIndex] = digit;
    setPin(newPin);

    // Animate dot
    Animated.spring(dotAnimations[activeIndex], {
      toValue: 1,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();

    if (activeIndex === 3) {
      setTimeout(() => {
        onComplete(newPin.join(''));
        resetPin();
      }, 300);
    } else {
      setActiveIndex(activeIndex + 1);
    }
  };

  const handleDelete = () => {
    if (activeIndex <= 0 && !pin[0]) return;

    triggerHaptic();

    const idx = pin[activeIndex] ? activeIndex : activeIndex - 1;
    if (idx < 0) return;

    const newPin = [...pin];
    newPin[idx] = '';
    setPin(newPin);
    setActiveIndex(idx);

    Animated.spring(dotAnimations[idx], {
      toValue: 0,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const resetPin = () => {
    setPin(['', '', '', '']);
    setActiveIndex(0);
    dotAnimations.forEach((anim) => anim.setValue(0));
  };

  if (!visible) return null;

  const numpadKeys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', 'del'],
  ];

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      <Animated.View
        style={[
          styles.container,
          { 
            transform: [{ translateY: slideAnim }],
            backgroundColor: Colors.backgroundElevated,
            borderColor: Colors.glassBorder,
          }
        ]}
      >
        <TouchableOpacity style={[styles.closeButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]} onPress={onCancel}>
          <Ionicons name="close" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>

        <View style={[styles.lockIcon, { backgroundColor: Colors.primaryMuted }]}>
          <Ionicons name="lock-closed" size={28} color={Colors.primary} />
        </View>

        <Text style={[styles.title, { color: Colors.textPrimary }]}>Enter Transaction PIN</Text>
        <Text style={[styles.subtitle, { color: Colors.textMuted }]}>Enter your 4-digit PIN to confirm</Text>

        {/* Pin Dots */}
        <View style={styles.dotsRow}>
          {pin.map((digit, index) => (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                { borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)' },
                index === activeIndex && { borderColor: Colors.primary },
                {
                  transform: [
                    {
                      scale: dotAnimations[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.3],
                      }),
                    },
                  ],
                  backgroundColor: dotAnimations[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: [isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', Colors.primary],
                  }),
                },
              ]}
            />
          ))}
        </View>

        {/* Numpad */}
        <View style={styles.numpad}>
          {numpadKeys.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.numpadRow}>
              {row.map((key, keyIndex) => {
                if (key === '') {
                  return <View key={keyIndex} style={styles.numpadKey} />;
                }
                if (key === 'del') {
                  return (
                    <TouchableOpacity
                      key={keyIndex}
                      style={[styles.numpadKey, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }]}
                      onPress={handleDelete}
                      activeOpacity={0.6}
                    >
                      <Ionicons name="backspace-outline" size={24} color={Colors.textSecondary} />
                    </TouchableOpacity>
                  );
                }
                return (
                  <TouchableOpacity
                    key={keyIndex}
                    style={[styles.numpadKey, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }]}
                    onPress={() => handleKeyPress(key)}
                    activeOpacity={0.6}
                  >
                    <Text style={[styles.numpadText, { color: Colors.textPrimary }]}>{key}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  container: {
    borderTopLeftRadius: BorderRadius.xxxl,
    borderTopRightRadius: BorderRadius.xxxl,
    paddingTop: Spacing.xxxl,
    paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.xxxl,
    paddingHorizontal: Spacing.xxl,
    borderWidth: 1,
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  closeButton: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.lg,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h2,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
    marginBottom: Spacing.xxxl,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xl,
    marginBottom: 40,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
  },
  numpad: {
    gap: Spacing.md,
  },
  numpadRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  numpadKey: {
    width: 80,
    height: 64,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numpadText: {
    ...Typography.hero,
    fontSize: 28,
  },
});
