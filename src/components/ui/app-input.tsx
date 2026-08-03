import Feather from '@expo/vector-icons/Feather';
import { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, type TextInputProps, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type IconName = keyof typeof Feather.glyphMap;

type Props = TextInputProps & {
  label?: string;
  error?: string;
  hint?: string;
  iconLeft?: IconName;
  iconRight?: IconName;
  onIconRightPress?: () => void;
};

const AnimatedView = Animated.createAnimatedComponent(View);

export const AppInput = forwardRef<TextInput, Props>(function AppInput(
  {
    label,
    error,
    hint,
    iconLeft,
    iconRight,
    onIconRightPress,
    multiline,
    numberOfLines,
    style,
    ...rest
  },
  ref,
) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  // Drives the border/icon colour transition so focus feels continuous rather
  // than snapping between two states.
  const progress = useDerivedValue(() => withTiming(focused ? 1 : 0, { duration: 180 }), [focused]);

  const animatedBorder = useAnimatedStyle(() => ({
    borderColor: error
      ? theme.destructive
      : interpolateColor(progress.value, [0, 1], [theme.border, theme.ring]),
  }));

  const iconColor = error ? theme.destructive : focused ? theme.foreground : theme.mutedForeground;

  return (
    <View style={styles.wrapper}>
      {label ? (
        <ThemedText themeColor="textSecondary" style={styles.label}>
          {label}
        </ThemedText>
      ) : null}

      <AnimatedView
        style={[
          styles.container,
          animatedBorder,
          {
            backgroundColor: theme.card,
            minHeight: multiline ? (numberOfLines ?? 4) * 24 + 24 : 52,
            alignItems: multiline ? 'flex-start' : 'center',
            paddingTop: multiline ? Spacing.three : 0,
          },
        ]}>
        {iconLeft ? <Feather name={iconLeft} size={18} color={iconColor} /> : null}

        <TextInput
          ref={ref}
          style={[styles.input, { color: theme.foreground }, multiline && styles.multilineInput, style]}
          placeholderTextColor={theme.mutedForeground}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          multiline={multiline}
          numberOfLines={numberOfLines}
          textAlignVertical={multiline ? 'top' : 'center'}
          {...rest}
        />

        {iconRight ? (
          <Pressable onPress={onIconRightPress} hitSlop={12}>
            <Feather name={iconRight} size={18} color={iconColor} />
          </Pressable>
        ) : null}
      </AnimatedView>

      {error ? (
        <ThemedText style={[styles.hint, { color: theme.destructive }]}>{error}</ThemedText>
      ) : hint ? (
        <ThemedText style={[styles.hint, { color: theme.mutedForeground }]}>{hint}</ThemedText>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { gap: Spacing.two },
  label: { fontSize: 13, fontWeight: '500' },
  container: {
    flexDirection: 'row',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderRadius: 14,
  },
  input: { flex: 1, fontSize: 16, paddingVertical: 0 },
  multilineInput: { paddingBottom: Spacing.three },
  hint: { fontSize: 12 },
});
