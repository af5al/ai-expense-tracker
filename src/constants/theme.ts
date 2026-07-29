import '@/global.css';
import { Platform } from 'react-native';

export const Colors = {
  light: {
    primary: '#6366F1',       // Indigo
    primaryLight: '#EEF2FF',
    accent: '#8B5CF6',        // Violet
    success: '#10B981',       // Emerald
    warning: '#F59E0B',       // Amber
    danger: '#EF4444',        // Rose
    text: '#1F2937',          // Slate 800
    textSecondary: '#6B7280', // Slate 500
    background: '#F9FAFB',    // Slate 50
    card: '#FFFFFF',          // Pure White
    border: '#E5E7EB',        // Slate 200
    tabBarBackground: 'rgba(255, 255, 255, 0.85)',
    cardSelected: '#EEF2FF',
    moneyHealthGood: '#10B981',
    moneyHealthAverage: '#F59E0B',
    moneyHealthPoor: '#EF4444',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
  },
  dark: {
    primary: '#818CF8',       // Indigo Light
    primaryLight: '#1E1B4B',
    accent: '#A78BFA',        // Violet Light
    success: '#34D399',       // Emerald Light
    warning: '#FBBF24',       // Amber Light
    danger: '#F87171',        // Rose Light
    text: '#F9FAFB',          // Slate 50
    textSecondary: '#9CA3AF', // Slate 400
    background: '#0B0F19',    // Deep Navy Slate
    card: '#1F2937',          // Slate 800
    border: '#374151',        // Slate 700
    tabBarBackground: 'rgba(11, 15, 25, 0.85)',
    cardSelected: '#1E1B4B',
    moneyHealthGood: '#34D399',
    moneyHealthAverage: '#FBBF24',
    moneyHealthPoor: '#F87171',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light;

export const Fonts = Platform.select({
  ios: {
    sans: 'System',
    serif: 'Georgia',
    rounded: 'System',
    mono: 'Courier',
  },
  default: {
    sans: 'sans-serif',
    serif: 'serif',
    rounded: 'sans-serif',
    mono: 'monospace',
  },
});

export const Spacing = {
  zero: 0,
  half: 4,
  one: 8,
  two: 12,
  three: 16,
  four: 24,
  five: 32,
  six: 48,
  seven: 64,
} as const;

export const Shadows = {
  light: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  dark: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
};

export const BottomTabInset = Platform.select({ ios: 40, android: 60 }) ?? 0;
export const MaxContentWidth = 720;
export const CornerRadius = {
  small: 6,
  medium: 12,
  large: 18,
  round: 9999,
};
export const AnimationDuration = {
  fast: 200,
  normal: 350,
  slow: 500,
};
