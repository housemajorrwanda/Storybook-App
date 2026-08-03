import Feather from '@expo/vector-icons/Feather';
import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  /** Optional supporting text, e.g. what the consent actually covers. */
  description?: ReactNode;
};

export function Checkbox({ checked, onChange, label, description }: Props) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onChange(!checked);
      }}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      // The whole row is the target — a 20px box alone is an awkward tap.
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.8 : 1 }]}>
      <View
        style={[
          styles.box,
          {
            backgroundColor: checked ? theme.brand : 'transparent',
            borderColor: checked ? theme.brand : theme.border,
          },
        ]}>
        {checked ? (
          <Animated.View entering={ZoomIn.springify().damping(14)}>
            <Feather name="check" size={14} color={theme.brandForeground} />
          </Animated.View>
        ) : null}
      </View>

      <View style={styles.body}>
        <ThemedText style={styles.label}>{label}</ThemedText>
        {description ? (
          <ThemedText themeColor="textSecondary" style={styles.desc}>
            {description}
          </ThemedText>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.three },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  body: { flex: 1, gap: 3 },
  label: { fontSize: 14, fontWeight: '500', lineHeight: 19 },
  desc: { fontSize: 12, lineHeight: 17 },
});
