/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  /**
   * Strictly monochrome. Every value is a neutral gray (hue 0, saturation 0), so
   * nothing in the interface carries colour — including status and error, which
   * are distinguished by icon and weight instead of hue.
   */
  light: {
    text: '#000000',
    background: 'hsl(0, 0%, 100%)',
    backgroundElement: 'hsl(0, 0%, 95%)',
    backgroundSelected: 'hsl(0, 0%, 89%)',
    textSecondary: 'hsl(0, 0%, 40%)',
    foreground: 'hsl(0, 0%, 4%)',
    card: 'hsl(0, 0%, 100%)',
    cardForeground: 'hsl(0, 0%, 4%)',
    popover: 'hsl(0, 0%, 100%)',
    popoverForeground: 'hsl(0, 0%, 4%)',
    primary: 'hsl(0, 0%, 9%)',
    primaryForeground: 'hsl(0, 0%, 98%)',
    secondary: 'hsl(0, 0%, 96%)',
    secondaryForeground: 'hsl(0, 0%, 9%)',
    muted: 'hsl(0, 0%, 96%)',
    mutedForeground: 'hsl(0, 0%, 45%)',
    accent: 'hsl(0, 0%, 94%)',
    accentForeground: 'hsl(0, 0%, 9%)',
    destructive: 'hsl(0, 0%, 25%)',
    destructiveForeground: 'hsl(0, 0%, 98%)',
    border: 'hsl(0, 0%, 88%)',
    input: 'hsl(0, 0%, 88%)',
    ring: '#B0632A',
    /**
     * The single accent, sampled from the flame in the app icon. Reserved for
     * primary actions, focus and active state — never for decoration. Darkened
     * slightly here so it holds contrast against a white background.
     */
    brand: '#B0632A',
    brandForeground: 'hsl(0, 0%, 100%)',
  },
  /**
   * Dark mode is a neutral gray ramp rather than pure black — surfaces step
   * 7% → 11% → 14% so cards and inputs read as distinct layers instead of
   * dissolving into the background. White is reserved for primary actions
   * and headings, keeping the palette dark / gray / white.
   */
  dark: {
    text: '#ffffff',
    background: 'hsl(0, 0%, 7%)',
    backgroundElement: 'hsl(0, 0%, 13%)',
    backgroundSelected: 'hsl(0, 0%, 18%)',
    textSecondary: 'hsl(0, 0%, 64%)',
    foreground: 'hsl(0, 0%, 98%)',
    card: 'hsl(0, 0%, 11%)',
    cardForeground: 'hsl(0, 0%, 98%)',
    popover: 'hsl(0, 0%, 13%)',
    popoverForeground: 'hsl(0, 0%, 98%)',
    primary: 'hsl(0, 0%, 98%)',
    primaryForeground: 'hsl(0, 0%, 9%)',
    secondary: 'hsl(0, 0%, 16%)',
    secondaryForeground: 'hsl(0, 0%, 98%)',
    muted: 'hsl(0, 0%, 16%)',
    mutedForeground: 'hsl(0, 0%, 64%)',
    accent: 'hsl(0, 0%, 18%)',
    accentForeground: 'hsl(0, 0%, 98%)',
    destructive: 'hsl(0, 0%, 82%)',
    destructiveForeground: 'hsl(0, 0%, 9%)',
    border: 'hsl(0, 0%, 20%)',
    input: 'hsl(0, 0%, 18%)',
    ring: '#CE7734',
    /** Sampled from the flame in the app icon. Near-black text sits on it. */
    brand: '#CE7734',
    brandForeground: 'hsl(0, 0%, 8%)',
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
