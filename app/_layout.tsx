import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { View, ActivityIndicator } from 'react-native';

function RootLayoutInner() {
  const { isDark, Colors } = useTheme();
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'welcome' || segments[0] === 'login' || segments[0] === 'onboarding';

    if (!user && !inAuthGroup) {
      // Redirect to welcome if not logged in and not in an auth screen
      router.replace('/welcome');
    } else if (user && inAuthGroup) {
      // Redirect to tabs if logged in and in an auth screen
      router.replace('/(tabs)');
    }
  }, [user, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={Colors.background} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="buy-data" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="buy-airtime" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="fund-wallet" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="gift-data" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
        <Stack.Screen name="login" options={{ animation: 'fade' }} />
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootLayoutInner />
      </AuthProvider>
    </ThemeProvider>
  );
}
