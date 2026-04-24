import React, { useRef, useEffect } from 'react';
import { Tabs } from 'expo-router';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  Dimensions,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';

const { width: SW } = Dimensions.get('window');

// ─── Single Tab Item with its own animation ───────────────────────────────────
function TabItem({
  route,
  isFocused,
  onPress,
}: {
  route: { key: string; name: string };
  isFocused: boolean;
  onPress: () => void;
}) {
  const { Colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isFocused ? 1.1 : 1,
      tension: 280,
      friction: 14,
      useNativeDriver: true,
    }).start();
  }, [isFocused]);

  const icons: Record<string, [string, string]> = {
    index: ['home', 'home-outline'],
    history: ['time', 'time-outline'],
    rewards: ['gift', 'gift-outline'],
    profile: ['person', 'person-outline'],
  };
  const labels: Record<string, string> = {
    index: 'Home',
    history: 'History',
    rewards: 'Rewards',
    profile: 'Profile',
  };

  const iconPair = icons[route.name] ?? ['ellipse', 'ellipse-outline'];
  const label = labels[route.name] ?? route.name;

  return (
    <TouchableOpacity style={styles.tabItem} onPress={onPress} activeOpacity={0.7}>
      <Animated.View
        style={[
          styles.iconWrap,
          isFocused && {
            backgroundColor: Colors.primaryMuted,
          },
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Ionicons
          name={(isFocused ? iconPair[0] : iconPair[1]) as any}
          size={22}
          color={isFocused ? Colors.primary : Colors.textMuted}
        />
      </Animated.View>
      <Text
        style={[
          styles.tabLabel,
          { color: isFocused ? Colors.primary : Colors.textMuted, fontWeight: isFocused ? '700' : '500' },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Floating Tab Bar ─────────────────────────────────────────────────────────
function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { Colors, isDark } = useTheme();

  return (
    <View
      style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom + 4, 16) }]}
      pointerEvents="box-none"
    >
      <View
        style={[
          styles.pill,
          {
            backgroundColor: isDark ? 'rgba(15,21,32,0.97)' : '#FFFFFF',
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            shadowColor: isDark ? '#000000' : '#34A853',
          },
        ]}
      >
        <View style={styles.tabRow}>
          {state.routes.map((route, index) => (
            <TabItem
              key={route.key}
              route={route}
              isFocused={state.index === index}
              onPress={() => {
                if (state.index !== index) navigation.navigate(route.name);
              }}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="history" />
      <Tabs.Screen name="rewards" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 18,
    paddingTop: 8,

  },
  pill: {
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 14,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 6,
    paddingVertical: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  iconWrap: {
    width: 48,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: 0.2,
  },
});
