import Feather from '@expo/vector-icons/Feather';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { AppButton } from '@/components/ui/app-button';
import { AppInput } from '@/components/ui/app-input';
import { OptionGroup, type Option } from '@/components/ui/option-group';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Relationship slug → `relativeTypeId`, copied verbatim from the web client's
 * `src/utils/relatives.utils.ts`.
 *
 * The API does expose `/testimonies/relative-types`, but that route is declared
 * after `@Get(':id')` in the controller so it is shadowed and returns a 400.
 * Both clients therefore hardcode the same map — keep them in sync.
 */
export const RELATIVE_TYPE_IDS: Record<string, number> = {
  mother: 1,
  father: 2,
  grandmother: 3,
  grandfather: 4,
  brother: 5,
  sister: 6,
  uncle: 7,
  aunt: 8,
  cousin: 9,
};

const RELATIVE_OPTIONS: Option<string>[] = [
  { value: 'mother', label: 'Mother' },
  { value: 'father', label: 'Father' },
  { value: 'grandmother', label: 'Grandmother' },
  { value: 'grandfather', label: 'Grandfather' },
  { value: 'brother', label: 'Brother' },
  { value: 'sister', label: 'Sister' },
  { value: 'uncle', label: 'Uncle' },
  { value: 'aunt', label: 'Aunt' },
  { value: 'cousin', label: 'Cousin' },
];

export type RelativeEntry = { id: string; slug: string; personName: string };

type Props = {
  value: RelativeEntry[];
  onChange: (entries: RelativeEntry[]) => void;
};

/** Shapes entries into the API's `relatives` payload, dropping unnamed rows. */
export function toRelativesPayload(entries: RelativeEntry[]) {
  return entries
    .filter((e) => e.personName.trim().length > 0)
    .map((e, index) => ({
      relativeTypeId: RELATIVE_TYPE_IDS[e.slug] ?? RELATIVE_TYPE_IDS.mother,
      personName: e.personName.trim(),
      order: index,
    }));
}

export function RelativesEditor({ value, onChange }: Props) {
  const theme = useTheme();

  function add() {
    Haptics.selectionAsync();
    onChange([
      ...value,
      { id: `${Date.now()}-${value.length}`, slug: 'mother', personName: '' },
    ]);
  }

  function update(id: string, patch: Partial<RelativeEntry>) {
    onChange(value.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }

  function remove(id: string) {
    Haptics.selectionAsync();
    onChange(value.filter((e) => e.id !== id));
  }

  return (
    <View style={styles.wrap}>
      <View>
        <ThemedText themeColor="textSecondary" style={styles.label}>
          Names of relatives
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.hint}>
          Remember family members connected to this testimony. Optional.
        </ThemedText>
      </View>

      {value.map((entry, index) => (
        <Animated.View
          key={entry.id}
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          layout={LinearTransition.springify().damping(20)}
          style={[styles.row, { borderColor: theme.border, backgroundColor: theme.card }]}>
          <View style={styles.rowHeader}>
            <ThemedText themeColor="textSecondary" style={styles.rowIndex}>
              Relative {index + 1}
            </ThemedText>
            <Pressable
              onPress={() => remove(entry.id)}
              hitSlop={10}
              accessibilityLabel={`Remove relative ${index + 1}`}>
              <Feather name="x" size={16} color={theme.mutedForeground} />
            </Pressable>
          </View>

          <AppInput
            placeholder="Their name"
            value={entry.personName}
            onChangeText={(text) => update(entry.id, { personName: text })}
            autoCapitalize="words"
            iconLeft="user"
          />

          <OptionGroup
            options={RELATIVE_OPTIONS}
            value={entry.slug}
            onChange={(slug) => update(entry.id, { slug })}
          />
        </Animated.View>
      ))}

      <AppButton
        label={value.length ? 'Add another relative' : 'Add a relative'}
        onPress={add}
        variant="outline"
        iconLeft="plus"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.three },
  label: { fontSize: 13, fontWeight: '500' },
  hint: { fontSize: 12, lineHeight: 16, marginTop: 2 },
  row: { gap: Spacing.three, padding: Spacing.three, borderRadius: 14, borderWidth: 1 },
  rowHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowIndex: { fontSize: 12, fontWeight: '600' },
});
