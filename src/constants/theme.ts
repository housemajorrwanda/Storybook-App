/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: 'hsl(0, 0%, 100%)',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
    foreground: 'hsl(0, 0%, 3.9%)',
    card: 'hsl(0, 0%, 100%)',
    cardForeground: 'hsl(0, 0%, 3.9%)',
    popover: 'hsl(0, 0%, 100%)',
    popoverForeground: 'hsl(0, 0%, 3.9%)',
    primary: 'hsl(0, 0%, 9%)',
    primaryForeground: 'hsl(0, 0%, 98%)',
    secondary: 'hsl(0, 0%, 96.1%)',
    secondaryForeground: 'hsl(0, 0%, 9%)',
    muted: 'hsl(0, 0%, 96.1%)',
    mutedForeground: 'hsl(0, 0%, 45.1%)',
    accent: 'hsl(0, 0%, 96.1%)',
    accentForeground: 'hsl(0, 0%, 9%)',
    destructive: 'hsl(0, 84.2%, 60.2%)',
    destructiveForeground: 'hsl(0, 0%, 98%)',
    border: 'hsl(0, 0%, 89.8%)',
    input: 'hsl(0, 0%, 89.8%)',
    ring: 'hsl(0, 0%, 3.9%)',
  },
  dark: {
    text: '#ffffff',
    background: 'hsl(0, 0%, 3.9%)',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
    foreground: 'hsl(0, 0%, 98%)',
    card: 'hsl(0, 0%, 3.9%)',
    cardForeground: 'hsl(0, 0%, 98%)',
    popover: 'hsl(0, 0%, 3.9%)',
    popoverForeground: 'hsl(0, 0%, 98%)',
    primary: 'hsl(0, 0%, 98%)',
    primaryForeground: 'hsl(0, 0%, 9%)',
    secondary: 'hsl(0, 0%, 14.9%)',
    secondaryForeground: 'hsl(0, 0%, 98%)',
    muted: 'hsl(0, 0%, 14.9%)',
    mutedForeground: 'hsl(0, 0%, 63.9%)',
    accent: 'hsl(0, 0%, 14.9%)',
    accentForeground: 'hsl(0, 0%, 98%)',
    destructive: 'hsl(0, 62.8%, 30.6%)',
    destructiveForeground: 'hsl(0, 0%, 98%)',
    border: 'hsl(0, 0%, 14.9%)',
    input: 'hsl(0, 0%, 14.9%)',
    ring: 'hsl(0, 0%, 83.1%)',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
