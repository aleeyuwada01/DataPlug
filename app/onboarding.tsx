import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Animated, Dimensions, Platform, KeyboardAvoidingView, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { GlassCard } from '../components/GlassCard';
import { Colors as StaticColors, Gradients, Typography, Spacing, BorderRadius } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const { width: SW } = Dimensions.get('window');

type Step = 'phone' | 'otp' | 'password' | 'success';

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [isPhoneFocused, setIsPhoneFocused] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpFocusedIndex, setOtpFocusedIndex] = useState<number | null>(null);
  const [password, setPassword] = useState('');
  const [isPassFocused, setIsPassFocused] = useState(false);
  const [pin, setPin] = useState('');
  const [isPinFocused, setIsPinFocused] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [fullName, setFullName] = useState('');
  const [isFullNameFocused, setIsFullNameFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const { Colors, isDark } = useTheme();
  const { login } = useAuth();
  
  const otpRefs = useRef<(TextInput | null)[]>([]);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0)).current;
  const explorePulse = useRef(new Animated.Value(1)).current;

  const animateStep = (next: Step) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -30, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setStep(next);
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 9, useNativeDriver: true }),
      ]).start();
    });
  };

  const handleSendOtp = async () => {
    if (!phone || phone.length < 10) {
      setErrorMsg('Enter a valid phone number');
      return;
    }
    setErrorMsg('');
    
    // TEMPORARILY DISABLED OTP FLOW
    animateStep('password');
    
    /*
    setIsSubmitting(true);
    try {
      await api.auth.sendOtp(phone);
      animateStep('otp');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send OTP');
    } finally {
      setIsSubmitting(false);
    }
    */
  };

  const handleVerifyOtp = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      setErrorMsg('Enter the 6-digit OTP');
      return;
    }
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      await api.auth.verifyOtp(phone, code);
      animateStep('password');
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid OTP');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async () => {
    if (!password || !pin || pin.length < 4) {
      setErrorMsg('Enter password and 4-digit PIN');
      return;
    }
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      const res = await api.auth.register({ phone, password, pin, fullName });
      login(res.user);
      handleSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccess = () => {
    animateStep('success');
    setTimeout(() => {
      Animated.spring(successScale, { toValue: 1, tension: 40, friction: 5, useNativeDriver: true }).start(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(explorePulse, { toValue: 1.05, duration: 800, useNativeDriver: true }),
            Animated.timing(explorePulse, { toValue: 1, duration: 800, useNativeDriver: true }),
          ])
        ).start();
      });
    }, 300);
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const renderStep = () => {
    switch (step) {
      case 'phone':
        return (
          <View style={styles.stepContent}>
            <View style={styles.iconCircle}>
              <Ionicons name="call" size={32} color={Colors.primary} />
            </View>
            <Text style={[styles.stepTitle, { color: Colors.textPrimary }]}>Enter your number</Text>
            <Text style={[styles.stepDesc, { color: Colors.textSecondary }]}>We'll send a verification code</Text>
            <GlassCard 
              style={[
                { padding: 0 },
                isPhoneFocused && { borderColor: Colors.primary, shadowColor: Colors.primary, shadowOpacity: 0.2, elevation: 4 }
              ]} 
              animateIn={false}
            >
              <View style={styles.inputRow}>
                <Text style={styles.prefix}>🇳🇬 +234</Text>
                <View style={styles.divider} />
                <TextInput 
                  style={[styles.phoneInput, { color: Colors.textPrimary }, Platform.OS === 'web' && { outlineStyle: 'none' } as any]} 
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
            </GlassCard>
            {errorMsg ? <Text style={{ color: Colors.error, textAlign: 'center' }}>{errorMsg}</Text> : null}
            <TouchableOpacity style={[styles.nextBtn, isSubmitting && { opacity: 0.7 }]} onPress={handleSendOtp} activeOpacity={0.8} disabled={isSubmitting}>
              <LinearGradient colors={['#34A853', '#2D8F47']} style={[StyleSheet.absoluteFillObject, { borderRadius: BorderRadius.lg }]} />
              <Text style={styles.nextText}>{isSubmitting ? 'Sending...' : 'Send OTP'}</Text>
              {!isSubmitting && <Ionicons name="arrow-forward" size={20} color="#FFF" />}
            </TouchableOpacity>
          </View>
        );

      case 'otp':
        return (
          <View style={styles.stepContent}>
            <View style={styles.iconCircle}>
              <Ionicons name="lock-closed" size={32} color={Colors.primary} />
            </View>
            <Text style={[styles.stepTitle, { color: Colors.textPrimary }]}>Verify phone</Text>
            <Text style={[styles.stepDesc, { color: Colors.textSecondary }]}>Enter the 6-digit code sent to +234{phone}</Text>
            <View style={styles.otpRow}>
              {otp.map((d, i) => (
                <GlassCard 
                  key={i} 
                  style={[
                    styles.otpBox,
                    otpFocusedIndex === i && { borderColor: Colors.primary, shadowColor: Colors.primary, shadowOpacity: 0.3 }
                  ]} 
                  animateIn={false}
                >
                  <TextInput
                    ref={(el) => otpRefs.current[i] = el}
                    style={[styles.otpInput, { color: Colors.textPrimary }, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                    maxLength={1}
                    keyboardType="number-pad"
                    value={d}
                    onFocus={() => setOtpFocusedIndex(i)}
                    onBlur={() => setOtpFocusedIndex(null)}
                    onKeyPress={({ nativeEvent }) => {
                      if (nativeEvent.key === 'Backspace' && !otp[i] && i > 0) {
                        otpRefs.current[i - 1]?.focus();
                      }
                    }}
                    onChangeText={(v) => {
                      const newOtp = [...otp];
                      newOtp[i] = v;
                      setOtp(newOtp);
                      if (v && i < 5) {
                        otpRefs.current[i + 1]?.focus();
                      }
                    }}
                  />
                </GlassCard>
              ))}
            </View>
            {errorMsg ? <Text style={{ color: Colors.error, textAlign: 'center' }}>{errorMsg}</Text> : null}
            <TouchableOpacity onPress={handleSendOtp} disabled={isSubmitting}><Text style={styles.resendText}>Didn't get code? <Text style={{ color: Colors.primary, fontWeight: '700' }}>Resend</Text></Text></TouchableOpacity>
            <TouchableOpacity style={[styles.nextBtn, isSubmitting && { opacity: 0.7 }]} onPress={handleVerifyOtp} activeOpacity={0.8} disabled={isSubmitting}>
              <LinearGradient colors={['#34A853', '#2D8F47']} style={[StyleSheet.absoluteFillObject, { borderRadius: BorderRadius.lg }]} />
              <Text style={styles.nextText}>{isSubmitting ? 'Verifying...' : 'Verify'}</Text>
              {!isSubmitting && <Ionicons name="checkmark" size={20} color="#FFF" />}
            </TouchableOpacity>
          </View>
        );

      case 'password':
        return (
          <View style={styles.stepContent}>
            <View style={styles.iconCircle}>
              <Ionicons name="shield-checkmark" size={32} color={Colors.primary} />
            </View>
            <Text style={[styles.stepTitle, { color: Colors.textPrimary }]}>Secure your account</Text>
            <Text style={[styles.stepDesc, { color: Colors.textSecondary }]}>Create a password and 4-digit transaction PIN</Text>
            
            <GlassCard 
              style={[
                { padding: 0 },
                isFullNameFocused && { borderColor: Colors.primary, shadowColor: Colors.primary, shadowOpacity: 0.2, elevation: 4 }
              ]} 
              animateIn={false}
            >
              <View style={styles.inputRow}>
                <Ionicons name="person-outline" size={20} color={isFullNameFocused ? Colors.primary : Colors.textMuted} />
                <View style={styles.divider} />
                <TextInput 
                  style={[styles.passInput, { color: Colors.textPrimary }, Platform.OS === 'web' && { outlineStyle: 'none' } as any]} 
                  placeholder="Full Name (Optional)" 
                  placeholderTextColor={Colors.textMuted} 
                  value={fullName} 
                  onChangeText={setFullName} 
                  onFocus={() => setIsFullNameFocused(true)}
                  onBlur={() => setIsFullNameFocused(false)}
                />
              </View>
            </GlassCard>

            <GlassCard 
              style={[
                { padding: 0, marginTop: Spacing.sm },
                isPassFocused && { borderColor: Colors.primary, shadowColor: Colors.primary, shadowOpacity: 0.2, elevation: 4 }
              ]} 
              animateIn={false}
            >
              <View style={styles.inputRow}>
                <Ionicons name="lock-closed-outline" size={20} color={isPassFocused ? Colors.primary : Colors.textMuted} />
                <View style={styles.divider} />
                <TextInput 
                  style={[styles.passInput, { color: Colors.textPrimary }, Platform.OS === 'web' && { outlineStyle: 'none' } as any]} 
                  placeholder="Create Password" 
                  placeholderTextColor={Colors.textMuted} 
                  value={password} 
                  onChangeText={setPassword} 
                  secureTextEntry={!showPass}
                  onFocus={() => setIsPassFocused(true)}
                  onBlur={() => setIsPassFocused(false)}
                />
                <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                  <Ionicons name={showPass ? 'eye-outline' : 'eye-off-outline'} size={20} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
            </GlassCard>
            <GlassCard 
              style={[
                { padding: 0, marginTop: Spacing.sm },
                isPinFocused && { borderColor: Colors.primary, shadowColor: Colors.primary, shadowOpacity: 0.2, elevation: 4 }
              ]} 
              animateIn={false}
            >
              <View style={styles.inputRow}>
                <Ionicons name="keypad-outline" size={20} color={isPinFocused ? Colors.primary : Colors.textMuted} />
                <View style={styles.divider} />
                <TextInput 
                  style={[styles.passInput, { color: Colors.textPrimary }, Platform.OS === 'web' && { outlineStyle: 'none' } as any]} 
                  placeholder="4-Digit Transaction PIN" 
                  placeholderTextColor={Colors.textMuted} 
                  value={pin} 
                  onChangeText={setPin} 
                  keyboardType="number-pad" 
                  maxLength={4} 
                  secureTextEntry 
                  onFocus={() => setIsPinFocused(true)}
                  onBlur={() => setIsPinFocused(false)}
                />
              </View>
            </GlassCard>
            {errorMsg ? <Text style={{ color: Colors.error, textAlign: 'center' }}>{errorMsg}</Text> : null}
            <TouchableOpacity style={[styles.nextBtn, isSubmitting && { opacity: 0.7 }]} onPress={handleRegister} activeOpacity={0.8} disabled={isSubmitting}>
              <LinearGradient colors={['#34A853', '#2D8F47']} style={[StyleSheet.absoluteFillObject, { borderRadius: BorderRadius.lg }]} />
              <Text style={styles.nextText}>{isSubmitting ? 'Creating...' : 'Create Account'}</Text>
              {!isSubmitting && <Ionicons name="rocket" size={20} color="#FFF" />}
            </TouchableOpacity>
          </View>
        );

      case 'success':
        return (
          <Animated.View style={[styles.successContent, { transform: [{ scale: successScale }] }]}>
            <View style={styles.successCircle}>
              <Text style={{ fontSize: 48 }}>🎉</Text>
            </View>
            <Text style={[styles.successTitle, { color: Colors.textPrimary }]}>Welcome to DataPlug!</Text>
            <Text style={[styles.successDesc, { color: Colors.textSecondary }]}>1GB has been added to your MTN line as a welcome bonus!</Text>
            <GlassCard variant="green" glowing>
              <View style={styles.bonusRow}>
                <Text style={{ fontSize: 28 }}>🎁</Text>
                <View>
                  <Text style={styles.bonusTitle}>Welcome Bonus</Text>
                  <Text style={styles.bonusValue}>1GB Free Data</Text>
                </View>
              </View>
            </GlassCard>
            <Animated.View style={{ width: '100%', transform: [{ scale: explorePulse }] }}>
              <TouchableOpacity style={[styles.nextBtn, { marginTop: Spacing.xl, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 }]} onPress={() => router.replace('/(tabs)')} activeOpacity={0.8}>
                <LinearGradient colors={['#34A853', '#2D8F47']} style={[StyleSheet.absoluteFillObject, { borderRadius: BorderRadius.lg }]} />
                <Text style={[styles.nextText, { fontSize: 18, letterSpacing: 0.5 }]}>Start Exploring</Text>
                <Ionicons name="arrow-forward" size={22} color="#FFF" />
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        );
    }
  };

  return (
    <KeyboardAvoidingView style={[styles.screen, { paddingTop: insets.top, backgroundColor: Colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {isDark ? null : <LinearGradient colors={Gradients.backgroundMain} style={StyleSheet.absoluteFillObject} />}
      <View style={styles.ambientGlow} />

      {step !== 'success' && (
        <View style={styles.topBar}>
          {step !== 'phone' ? (
            <TouchableOpacity onPress={() => animateStep(step === 'password' ? 'otp' : 'phone')} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
            </TouchableOpacity>
          )}
          <View style={styles.progressRow}>
            {['phone', 'otp', 'password'].map((s, i) => (
              <View key={i} style={[styles.progressDot, ['phone', 'otp', 'password'].indexOf(step) >= i && styles.progressDotActive]} />
            ))}
          </View>
        </View>
      )}

      <Animated.View style={[styles.body, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {renderStep()}
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: StaticColors.background },
  ambientGlow: { position: 'absolute', top: -50, left: SW / 2 - 100, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(52,168,83,0.1)' },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, gap: Spacing.lg },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: StaticColors.glassBackground, borderWidth: 1, borderColor: StaticColors.glassBorder, alignItems: 'center', justifyContent: 'center' },
  progressRow: { flexDirection: 'row', flex: 1, gap: 6 },
  progressDot: { flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.08)' },
  progressDotActive: { backgroundColor: StaticColors.primary },
  body: { flex: 1, justifyContent: 'center', paddingHorizontal: Spacing.xl },
  stepContent: { gap: Spacing.lg },
  iconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: StaticColors.primaryMuted, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  stepTitle: { ...Typography.h1, color: StaticColors.textPrimary, textAlign: 'center' },
  stepDesc: { ...Typography.body, color: StaticColors.textSecondary, textAlign: 'center', lineHeight: 22 },
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, height: 56, gap: Spacing.sm },
  divider: { width: 1, height: 24, backgroundColor: 'rgba(150,150,150,0.2)', marginHorizontal: 4 },
  prefix: { ...Typography.bodyBold, color: StaticColors.textSecondary },
  phoneInput: { flex: 1, ...Typography.h3, color: StaticColors.textPrimary, height: '100%' },
  passInput: { flex: 1, ...Typography.body, color: StaticColors.textPrimary, height: '100%' },
  otpRow: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm },
  otpBox: { width: 48, height: 56, alignItems: 'center', justifyContent: 'center', padding: 0 },
  otpInput: { ...Typography.h2, color: StaticColors.textPrimary, textAlign: 'center', width: '100%', height: '100%' },
  resendText: { ...Typography.caption, color: StaticColors.textMuted, textAlign: 'center' },
  nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 54, borderRadius: BorderRadius.lg, overflow: 'hidden', marginTop: Spacing.sm },
  nextText: { ...Typography.button, color: '#FFF' },
  successContent: { alignItems: 'center', gap: Spacing.xl, paddingHorizontal: Spacing.xl },
  successCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: StaticColors.primaryMuted, alignItems: 'center', justifyContent: 'center' },
  successTitle: { ...Typography.h1, color: StaticColors.textPrimary, textAlign: 'center' },
  successDesc: { ...Typography.body, color: StaticColors.textSecondary, textAlign: 'center', lineHeight: 22 },
  bonusRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  bonusTitle: { ...Typography.captionBold, color: StaticColors.textSecondary },
  bonusValue: { ...Typography.h3, color: StaticColors.primary },
});
