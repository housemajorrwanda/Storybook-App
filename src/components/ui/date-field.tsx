import Feather from '@expo/vector-icons/Feather';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, useColorScheme, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDate } from '@/utils/format';

type Props = {
  label: string;
  /** ISO date, `YYYY-MM-DD`. Empty string means unset. */
  value: string;
  onChange: (isoDate: string) => void;
  minimumDate?: Date;
  maximumDate?: Date;
  error?: boolean;
};

/** `YYYY-MM-DD` in local time — `toISOString()` would shift the day across timezones. */
function toIsoDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseIsoDate(value: string): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Date input backed by the platform's native picker.
 *
 * Replaces a free-text `YYYY-MM-DD` field, which let people type impossible or
 * mis-ordered dates that only failed server-side — and made the expected format
 * something you had to guess.
 */
export function DateField({ label, value, onChange, minimumDate, maximumDate, error }: Props) {
  const theme = useTheme();
  const scheme = useColorScheme();
  const [open, setOpen] = useState(false);

  const selected = parseIsoDate(value);
  // Events here are historical, so an empty field should not open on today.
  const initial = selected ?? maximumDate ?? new Date(1994, 3, 7);

  function commit(date: Date) {
    Haptics.selectionAsync();
    onChange(toIsoDate(date));
  }

  const picker = (
    <DateTimePicker
      value={initial}
      mode="date"
      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
      minimumDate={minimumDate}
      maximumDate={maximumDate}
      themeVariant={scheme === 'dark' ? 'dark' : 'light'}
      onChange={(event, date) => {
        // Android's dialog is modal and reports dismissal; iOS updates inline.
        if (Platform.OS === 'android') {
          setOpen(false);
          if (event.type === 'set' && date) commit(date);
          return;
        }
        if (date) commit(date);
      }}
    />
  );

  return (
    <View style={styles.wrap}>
      <ThemedText themeColor="textSecondary" style={styles.label}>
        {label}
      </ThemedText>

      <Pressable
        onPress={() => {
          Haptics.selectionAsync();
          setOpen(true);
        }}
        accessibilityRole="button"
        accessibilityLabel={`${label}. ${selected ? formatDate(value) : 'Not set'}`}
        style={({ pressed }) => [
          styles.field,
          {
            backgroundColor: theme.card,
            borderColor: error ? theme.destructive : theme.border,
            opacity: pressed ? 0.85 : 1,
          },
        ]}>
        <Feather name="calendar" size={18} color={theme.mutedForeground} />
        <ThemedText
          themeColor={selected ? 'text' : 'textSecondary'}
          style={styles.valueText}
          numberOfLines={1}>
          {selected ? formatDate(value) : 'Select a date'}
        </ThemedText>
        {selected ? (
          <Pressable onPress={() => onChange('')} hitSlop={10} accessibilityLabel={`Clear ${label}`}>
            <Feather name="x" size={16} color={theme.mutedForeground} />
          </Pressable>
        ) : null}
      </Pressable>

      {/* iOS gets a sheet with an explicit Done; Android uses its own dialog. */}
      {open && Platform.OS === 'ios' ? (
        <Modal transparent animationType="fade" onRequestClose={() => setOpen(false)}>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
            <Pressable
              style={[styles.sheet, { backgroundColor: theme.popover, borderColor: theme.border }]}
              onPress={(e) => e.stopPropagation()}>
              <ThemedText style={styles.sheetTitle}>{label}</ThemedText>
              {picker}
              <AppButton
                label="Done"
                onPress={() => {
                  // Nothing selected yet means accept the wheel's current value.
                  if (!selected) commit(initial);
                  setOpen(false);
                }}
                size="lg"
              />
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}

      {open && Platform.OS !== 'ios' ? picker : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.two },
  label: { fontSize: 13, fontWeight: '500' },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    minHeight: 52,
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderRadius: 14,
  },
  valueText: { flex: 1, fontSize: 15 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    padding: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  sheetTitle: { fontSize: 16, fontWeight: '600', textAlign: 'center' },
});
