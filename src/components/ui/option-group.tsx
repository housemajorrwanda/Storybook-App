import Feather from '@expo/vector-icons/Feather';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { IconName } from './app-input';

export type Option<T extends string> = {
  value: T;
  label: string;
  description?: string;
  icon?: IconName;
  disabled?: boolean;
};

type Props<T extends string> = {
  label?: string;
  hint?: string;
  options: Option<T>[];
  value: T | null;
  onChange: (value: T) => void;
  /**
   * 'chips' wraps compact pills — good for short enums like a language.
   * 'cards' stacks full-width rows — good when each option needs a description.
   * 'grid' places cards side by side — good for two or three short choices,
   *   where stacking wastes vertical space and hides the alternative below.
   */
  variant?: 'chips' | 'cards' | 'grid';
};

/**
 * Single-select control for a fixed set of values.
 *
 * Replaces the ad-hoc Pressable grids that were duplicated per screen, so every
 * enum choice in the app looks and behaves identically.
 */
export function OptionGroup<T extends string>({
  label,
  hint,
  options,
  value,
  onChange,
  variant = 'chips',
}: Props<T>) {
  const theme = useTheme();

  return (
    <View style={styles.wrap}>
      {label ? (
        <ThemedText themeColor="textSecondary" style={styles.label}>
          {label}
        </ThemedText>
      ) : null}

      <View
        style={
          variant === 'chips'
            ? styles.chipRow
            : variant === 'grid'
              ? styles.gridRow
              : styles.cardCol
        }>
        {options.map((option) => {
          const selected = option.value === value;
          const disabled = option.disabled;

          return (
            <Pressable
              key={option.value}
              disabled={disabled}
              onPress={() => {
                Haptics.selectionAsync();
                onChange(option.value);
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected, disabled }}
              style={({ pressed }) => [
                variant === 'chips'
                  ? styles.chip
                  : variant === 'grid'
                    ? styles.gridCard
                    : styles.card,
                {
                  backgroundColor: selected ? theme.backgroundSelected : theme.card,
                  borderColor: selected ? theme.brand : theme.border,
                  opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
                },
              ]}>
              {option.icon ? (
                <Feather
                  name={option.icon}
                  size={variant === 'chips' ? 14 : variant === 'grid' ? 22 : 20}
                  color={selected ? theme.brand : theme.mutedForeground}
                />
              ) : null}

              <View
                style={
                  variant === 'cards'
                    ? styles.cardBody
                    : variant === 'grid'
                      ? styles.gridBody
                      : undefined
                }>
                <ThemedText
                  style={[
                    variant === 'chips' ? styles.chipText : styles.cardTitle,
                    variant === 'grid' && styles.gridTitle,
                    selected && styles.selectedText,
                  ]}>
                  {option.label}
                </ThemedText>
                {option.description && variant !== 'chips' ? (
                  <ThemedText
                    themeColor="textSecondary"
                    style={[styles.cardDesc, variant === 'grid' && styles.gridDesc]}>
                    {option.description}
                  </ThemedText>
                ) : null}
              </View>

              {selected && variant === 'cards' ? (
                <Animated.View entering={FadeIn.duration(150)}>
                  <Feather name="check" size={18} color={theme.brand} />
                </Animated.View>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      {hint ? (
        <ThemedText themeColor="textSecondary" style={styles.hint}>
          {hint}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.two },
  label: { fontSize: 13, fontWeight: '500' },
  // Chips wrap so a long enum reflows instead of overflowing on small screens.
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.three,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontWeight: '500' },
  cardCol: { gap: Spacing.two },
  // Equal-width columns that wrap if the labels get long on a small screen.
  gridRow: { flexDirection: 'row', gap: Spacing.two },
  gridCard: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.two,
    borderRadius: 14,
    borderWidth: 1,
  },
  gridBody: { alignItems: 'center', gap: 2 },
  gridTitle: { fontSize: 14 },
  gridDesc: { textAlign: 'center' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: 14,
    borderWidth: 1,
  },
  cardBody: { flex: 1, gap: 2 },
  cardTitle: { fontSize: 15, fontWeight: '600' },
  cardDesc: { fontSize: 12, lineHeight: 16 },
  selectedText: { fontWeight: '600' },
  hint: { fontSize: 12 },
});
