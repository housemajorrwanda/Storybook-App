import { SymbolView } from 'expo-symbols';
import { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, type TextInputProps, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = TextInputProps & {
  label?: string;
  error?: string;
  hint?: string;
  iconLeft?: string;
  iconRight?: string;
  onIconRightPress?: () => void;
};

export const AppInput = forwardRef<TextInput, Props>(function AppInput(
  { label, error, hint, iconLeft, iconRight, onIconRightPress, multiline, numberOfLines, style, ...rest },
  ref,
) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error ? theme.destructive : focused ? theme.ring : theme.border;

  return (
    <View style={styles.wrapper}>
      {label ? <ThemedText style={styles.label}>{label}</ThemedText> : null}

      <View
        style={[
          styles.container,
          {
            borderColor,
            backgroundColor: theme.card,
            minHeight: multiline ? (numberOfLines ?? 4) * 24 + 20 : 48,
            alignItems: multiline ? 'flex-start' : 'center',
            paddingTop: multiline ? Spacing.two : 0,
          },
        ]}>
        {iconLeft ? (
          <SymbolView name={iconLeft as any} size={16} tintColor={theme.mutedForeground} />
        ) : null}

        <TextInput
          ref={ref}
          style={[
            styles.input,
            { color: theme.foreground },
            multiline && styles.multilineInput,
            style,
          ]}
          placeholderTextColor={theme.mutedForeground}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          multiline={multiline}
          numberOfLines={numberOfLines}
          textAlignVertical={multiline ? 'top' : 'center'}
          {...rest}
        />

        {iconRight ? (
          <Pressable onPress={onIconRightPress} hitSlop={8}>
            <SymbolView name={iconRight as any} size={16} tintColor={theme.mutedForeground} />
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <ThemedText style={[styles.hint, { color: theme.destructive }]}>{error}</ThemedText>
      ) : hint ? (
        <ThemedText style={[styles.hint, { color: theme.mutedForeground }]}>{hint}</ThemedText>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { gap: Spacing.one },
  label: { fontSize: 13, fontWeight: '500' },
  container: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderWidth: 1.5,
    borderRadius: 12,
  },
  input: { flex: 1, fontSize: 15, paddingVertical: 0 },
  multilineInput: { paddingBottom: Spacing.two },
  hint: { fontSize: 12 },
});
