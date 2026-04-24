import React, { createContext, useContext, useState, ReactNode } from 'react';

// ─── Light Theme ────────────────────────────────────────────────────────────
export const LightColors = {
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
  cardShadow: 'rgba(0,0,0,0.1)',
};

// ─── Dark Theme ─────────────────────────────────────────────────────────────
export const DarkColors = {
  primary: '#34A853',
  primaryLight: '#4CD964',
  primaryDark: '#2D8F47',
  primaryMuted: 'rgba(52, 168, 83, 0.15)',
  primaryGlow: 'rgba(52, 168, 83, 0.4)',

  background: '#0A0E14',
  backgroundElevated: '#0F1520',
  backgroundCard: '#131B27',
  surface: '#1A2332',
  surfaceLight: '#1E293B',

  glassBackground: 'rgba(255, 255, 255, 0.06)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
  glassHighlight: 'rgba(255, 255, 255, 0.12)',

  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textMuted: 'rgba(255, 255, 255, 0.45)',
  textAccent: '#34A853',

  accentBlue: '#4A90D9',
  accentPurple: '#8B5CF6',
  accentOrange: '#F59E0B',
  accentPink: '#EC4899',
  accentTeal: '#14B8A6',

  success: '#34A853',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#4A90D9',

  shadowDark: 'rgba(0, 0, 0, 0.5)',
  shadowGreen: 'rgba(52, 168, 83, 0.3)',

  navBar: 'rgba(10, 14, 20, 0.97)',
  navBarBorder: 'rgba(255,255,255,0.08)',
  cardShadow: 'rgba(0,0,0,0.4)',
};

export const LightGradients = {
  primary: ['#34A853', '#2D8F47', '#1B6B33'] as const,
  primarySoft: ['rgba(52,168,83,0.15)', 'rgba(52,168,83,0.03)'] as const,
  card: ['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)'] as const,
  cardGreen: ['rgba(52,168,83,0.1)', 'rgba(52,168,83,0.02)'] as const,
  backgroundMain: ['#EEF2F7', '#F5F7FA', '#EEF2F7'] as const,
  banner: ['#1B6B33', '#34A853', '#4CD964'] as const,
  reward: ['rgba(245,158,11,0.12)', 'rgba(245,158,11,0.03)'] as const,
  purple: ['#8B5CF6', '#6D28D9'] as const,
};

export const DarkGradients = {
  primary: ['#34A853', '#2D8F47', '#1B6B33'] as const,
  primarySoft: ['rgba(52,168,83,0.3)', 'rgba(52,168,83,0.05)'] as const,
  card: ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)'] as const,
  cardGreen: ['rgba(52,168,83,0.15)', 'rgba(52,168,83,0.03)'] as const,
  backgroundMain: ['#0A0E14', '#0F1520', '#0A0E14'] as const,
  banner: ['#1B6B33', '#34A853', '#4CD964'] as const,
  reward: ['rgba(245,158,11,0.2)', 'rgba(245,158,11,0.05)'] as const,
  purple: ['#8B5CF6', '#6D28D9'] as const,
};

// ─── Context ─────────────────────────────────────────────────────────────────
type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
  Colors: typeof LightColors;
  Gradients: typeof LightGradients;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  toggleTheme: () => {},
  Colors: LightColors,
  Gradients: LightGradients,
  isDark: false,
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<ThemeMode>('light');
  const isDark = mode === 'dark';

  const toggleTheme = () => setMode((m) => (m === 'light' ? 'dark' : 'light'));

  return (
    <ThemeContext.Provider
      value={{
        mode,
        toggleTheme,
        Colors: isDark ? DarkColors : LightColors,
        Gradients: isDark ? DarkGradients : LightGradients,
        isDark,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
