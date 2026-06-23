import { SymbolView } from 'expo-symbols';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  iconLeft?: string;
  iconRight?: string;
  fullWidth?: boolean;
};

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  iconLeft,
  iconRight,
  fullWidth = true,
}: Props) {
  const theme = useTheme();

  const bg: Record<Variant, string> = {
    primary: theme.primary,
    secondary: theme.secondary,
    outline: 'transparent',
    ghost: 'transparent',
    destructive: theme.destructive,
  };

  const textColor: Record<Variant, string> = {
    primary: theme.primaryForeground,
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

  const heights: Record<Size, number> = { sm: 36, md: 48, lg: 54 };
  const fontSizes: Record<Size, number> = { sm: 13, md: 15, lg: 16 };
  const iconSizes: Record<Size, number> = { sm: 14, md: 16, lg: 18 };
  const radii: Record<Size, number> = { sm: 8, md: 12, lg: 14 };
  const pads: Record<Size, number> = { sm: Spacing.two, md: Spacing.three, lg: Spacing.four };

  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          height: heights[size],
          borderRadius: radii[size],
          paddingHorizontal: pads[size],
          backgroundColor: bg[variant],
          borderWidth: borderColor[variant] ? 1.5 : 0,
          borderColor: borderColor[variant],
          opacity: pressed || isDisabled ? 0.65 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
      ]}>
      {loading ? (
        <ActivityIndicator color={textColor[variant]} size="small" />
      ) : (
        <>
          {iconLeft && (
            <SymbolView name={iconLeft as any} size={iconSizes[size]} tintColor={textColor[variant]} />
          )}
          <ThemedText
            style={[styles.label, { color: textColor[variant], fontSize: fontSizes[size] }]}>
            {label}
          </ThemedText>
          {iconRight && (
            <SymbolView name={iconRight as any} size={iconSizes[size]} tintColor={textColor[variant]} />
          )}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  label: { fontWeight: '600' },
});
