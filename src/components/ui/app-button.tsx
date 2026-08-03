import Feather from '@expo/vector-icons/Feather';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { IconName } from './app-input';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  iconLeft?: IconName;
  iconRight?: IconName;
  /** Custom leading element — use for brand marks that can't be a tinted glyph. */
  iconNode?: ReactNode;
  fullWidth?: boolean;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  iconLeft,
  iconRight,
  iconNode,
  fullWidth = true,
}: Props) {
  const theme = useTheme();

  // A small spring scale reads as physical feedback; opacity alone feels dead.
  const pressed = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(pressed.value ? 0.97 : 1, { damping: 18, stiffness: 260 }) }],
    opacity: withTiming(pressed.value ? 0.9 : 1, { duration: 120 }),
  }));

  const bg: Record<Variant, string> = {
    primary: theme.brand,
    secondary: theme.secondary,
    outline: 'transparent',
    ghost: 'transparent',
    destructive: theme.destructive,
  };

  const textColor: Record<Variant, string> = {
    primary: theme.brandForeground,
    secondary: theme.secondaryForeground,
    outline: theme.foreground,
    ghost: theme.foreground,
    destructive: theme.destructiveForeground,
  };

  const borderColor: Record<Variant, string | undefined> = {
    primary: undefined,
    secondary: undefined,
    outline: theme.border,
    ghost: undefined,
    destructive: undefined,
  };

  const heights: Record<Size, number> = { sm: 38, md: 50, lg: 56 };
  const fontSizes: Record<Size, number> = { sm: 13, md: 15, lg: 16 };
  const iconSizes: Record<Size, number> = { sm: 15, md: 17, lg: 18 };
  const radii: Record<Size, number> = { sm: 10, md: 14, lg: 16 };
  const pads: Record<Size, number> = { sm: Spacing.two, md: Spacing.three, lg: Spacing.four };

  const isDisabled = disabled || loading;

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={isDisabled}
      onPressIn={() => (pressed.value = 1)}
      onPressOut={() => (pressed.value = 0)}
      style={[
        styles.base,
        animatedStyle,
        {
          height: heights[size],
          borderRadius: radii[size],
          paddingHorizontal: pads[size],
          backgroundColor: bg[variant],
          borderWidth: borderColor[variant] ? 1 : 0,
          borderColor: borderColor[variant],
          opacity: isDisabled ? 0.5 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
      ]}>
      {loading ? (
        <ActivityIndicator color={textColor[variant]} size="small" />
      ) : (
        <>
          {iconNode}
          {iconLeft && <Feather name={iconLeft} size={iconSizes[size]} color={textColor[variant]} />}
          <ThemedText style={[styles.label, { color: textColor[variant], fontSize: fontSizes[size] }]}>
            {label}
          </ThemedText>
          {iconRight && <Feather name={iconRight} size={iconSizes[size]} color={textColor[variant]} />}
        </>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  label: { fontWeight: '600', letterSpacing: 0.1 },
});
