/**
 * DataFlow Design System
 * Static constants (spacing, typography, border radius).
 * Colors & Gradients are now in ThemeContext and accessed via useTheme().
 */

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 50,
  circle: 999,
};

export const Typography = {
  hero: { fontSize: 36, fontWeight: '800' as const, letterSpacing: -0.5 },
  h1: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.3 },
  h2: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.2 },
  h3: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  bodyBold: { fontSize: 15, fontWeight: '600' as const },
  caption: { fontSize: 13, fontWeight: '400' as const },
  captionBold: { fontSize: 13, fontWeight: '600' as const },
  small: { fontSize: 11, fontWeight: '500' as const, letterSpacing: 0.3 },
  button: { fontSize: 16, fontWeight: '700' as const, letterSpacing: 0.5 },
};

/**
 * Static color & gradient exports used by components that don't yet use useTheme().
 * These default to the LIGHT theme values.
 */
export const Colors = {
  primary: '#34A853',
  primaryLight: '#4CD964',
  primaryDark: '#2D8F47',
  primaryMuted: 'rgba(52, 168, 83, 0.12)',
  primaryGlow: 'rgba(52, 168, 83, 0.3)',

  background: '#F0F4F8',
  backgroundElevated: '#FFFFFF',
  backgroundCard: '#FFFFFF',
  surface: '#F8FAFC',
  surfaceLight: '#EEF2F7',

  glassBackground: 'rgba(255, 255, 255, 0.85)',
  glassBorder: 'rgba(0, 0, 0, 0.07)',
  glassHighlight: 'rgba(255, 255, 255, 0.95)',

  textPrimary: '#0D1117',
  textSecondary: '#4A5568',
  textMuted: '#9AA5B4',
  textAccent: '#34A853',

  accentBlue: '#3B82F6',
  accentPurple: '#8B5CF6',
  accentOrange: '#F59E0B',
  accentPink: '#EC4899',
  accentTeal: '#14B8A6',

  success: '#34A853',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  shadowDark: 'rgba(0, 0, 0, 0.08)',
  shadowGreen: 'rgba(52, 168, 83, 0.2)',

  navBar: '#FFFFFF',
  navBarBorder: 'rgba(0,0,0,0.06)',
  cardShadow: 'rgba(0,0,0,0.08)',
};

export const Gradients = {
  primary: ['#34A853', '#2D8F47', '#1B6B33'] as const,
  primarySoft: ['rgba(52,168,83,0.15)', 'rgba(52,168,83,0.03)'] as const,
  card: ['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)'] as const,
  cardGreen: ['rgba(52,168,83,0.1)', 'rgba(52,168,83,0.02)'] as const,
  backgroundMain: ['#EEF2F7', '#F5F7FA', '#EEF2F7'] as const,
  banner: ['#1B6B33', '#34A853', '#4CD964'] as const,
  reward: ['rgba(245,158,11,0.12)', 'rgba(245,158,11,0.03)'] as const,
  purple: ['#8B5CF6', '#6D28D9'] as const,
};
