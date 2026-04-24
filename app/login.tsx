import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Platform, KeyboardAvoidingView, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { GlassCard } from '../components/GlassCard';
import { useTheme } from '../contexts/ThemeContext';
import { Typography, Spacing, BorderRadius } from '../constants/theme';
import { useAppHaptic } from '../hooks/useAppHaptic';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { Colors, isDark } = useTheme();
  const { triggerHaptic, triggerNotification } = useAppHaptic();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isPhoneFocused, setIsPhoneFocused] = useState(false);
  const [isPassFocused, setIsPassFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { login } = useAuth();

  const handleLogin = async () => {
    triggerHaptic();
    if (!phone || !password) return;
    
    setErrorMsg('');
    setIsSubmitting(true);
    
    try {
      const res = await api.auth.login(phone, password);
      triggerNotification();
      login(res.user);
      router.replace('/(tabs)');
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid credentials');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={[styles.screen, { backgroundColor: Colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: Colors.backgroundElevated, borderColor: Colors.glassBorder }]}>
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <View style={styles.headerCentered}>
          <Image 
            source={{ uri: 'https://i.ibb.co/Kx2611sf/iconlight.png' }} 
            style={[styles.logo, isDark && { tintColor: '#FFFFFF' }]} 
            resizeMode="contain" 
          />
          <Text style={[styles.title, { color: Colors.textPrimary }]}>Welcome back</Text>
          <Text style={[styles.subtitle, { color: Colors.textSecondary }]}>Log in to continue to DataPlug</Text>
        </View>

        <View style={styles.formSection}>
          {/* Phone Number */}
          <Text style={[styles.label, { color: Colors.textSecondary }]}>Phone Number</Text>
          <View style={[
            styles.inputWrapper, 
            { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' },
            isPhoneFocused && { borderColor: Colors.primary, borderWidth: 1, backgroundColor: isDark ? 'rgba(52,168,83,0.05)' : '#FFF' }
          ]}>
            <View style={styles.inputRow}>
              <Text style={[styles.inputPrefix, { color: isPhoneFocused ? Colors.primary : Colors.textSecondary }]}>+234</Text>
              <View style={styles.divider} />
              <TextInput
                style={[styles.input, { color: Colors.textPrimary }, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                placeholder="810 123 4567"
                placeholderTextColor={Colors.textMuted}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={11}
                onFocus={() => setIsPhoneFocused(true)}
                onBlur={() => setIsPhoneFocused(false)}
              />
            </View>
          </View>

          {/* Password */}
          <Text style={[styles.label, { color: Colors.textSecondary, marginTop: Spacing.xl }]}>Password</Text>
          <View style={[
            styles.inputWrapper, 
            { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' },
            isPassFocused && { borderColor: Colors.primary, borderWidth: 1, backgroundColor: isDark ? 'rgba(52,168,83,0.05)' : '#FFF' }
          ]}>
            <View style={styles.inputRow}>
              <Ionicons name="lock-closed-outline" size={20} color={isPassFocused ? Colors.primary : Colors.textSecondary} style={{ marginRight: Spacing.sm }} />
              <TextInput
                style={[styles.input, { color: Colors.textPrimary }, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                placeholder="Enter password"
                placeholderTextColor={Colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
                onFocus={() => setIsPassFocused(true)}
                onBlur={() => setIsPassFocused(false)}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)} style={{ padding: 4 }}>
                <Ionicons name={showPass ? 'eye-outline' : 'eye-off-outline'} size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.forgotBtn}>
            <Text style={[styles.forgotText, { color: Colors.primary }]}>Forgot Password?</Text>
          </TouchableOpacity>

          {errorMsg ? <Text style={{ color: Colors.error, textAlign: 'center', marginBottom: Spacing.sm }}>{errorMsg}</Text> : null}

          <TouchableOpacity 
            style={[styles.loginBtn, { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: (!phone || !password) ? 0 : 0.3, shadowRadius: 16, elevation: (!phone || !password) ? 0 : 8 }, (!phone || !password || isSubmitting) && { opacity: 0.5 }]} 
            onPress={handleLogin} 
            activeOpacity={0.8} 
            disabled={!phone || !password || isSubmitting}
          >
            <LinearGradient colors={['#34A853', '#2D8F47']} style={StyleSheet.absoluteFillObject} />
            <Text style={styles.loginText}>{isSubmitting ? 'Logging in...' : 'Log In'}</Text>
            {!isSubmitting && <Ionicons name="arrow-forward" size={20} color="#FFF" style={{ marginLeft: 8 }} />}
          </TouchableOpacity>
        </View>
        
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: Colors.textSecondary }]}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.replace('/onboarding')}>
            <Text style={[styles.footerLink, { color: Colors.primary }]}>Sign Up</Text>
          </TouchableOpacity>
        </View>

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.md },
  backBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, paddingHorizontal: Spacing.xl },
  headerCentered: { alignItems: 'center', marginTop: Spacing.lg, marginBottom: Spacing.xxl },
  logo: { width: 64, height: 64, marginBottom: Spacing.lg },
  title: { ...Typography.hero, fontSize: 32, marginBottom: Spacing.xs, textAlign: 'center' },
  subtitle: { ...Typography.body, textAlign: 'center' },
  formSection: { flex: 1 },
  label: { ...Typography.bodyBold, marginBottom: Spacing.sm, paddingLeft: 4 },
  inputWrapper: { borderRadius: BorderRadius.xl, height: 60, borderWidth: 1, borderColor: 'transparent' },
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, height: '100%' },
  inputPrefix: { ...Typography.bodyBold },
  divider: { width: 1, height: 24, backgroundColor: 'rgba(150,150,150,0.2)', marginHorizontal: Spacing.sm },
  input: { flex: 1, ...Typography.body, fontSize: 16, height: '100%' },
  forgotBtn: { alignSelf: 'flex-end', marginTop: Spacing.md, marginBottom: Spacing.xxl },
  forgotText: { ...Typography.bodyBold },
  loginBtn: { height: 60, borderRadius: BorderRadius.pill, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  loginText: { ...Typography.button, color: '#FFF', fontSize: 18 },
  footer: { flexDirection: 'row', justifyContent: 'center', paddingVertical: Spacing.xl },
  footerText: { ...Typography.body },
  footerLink: { ...Typography.bodyBold },
});
