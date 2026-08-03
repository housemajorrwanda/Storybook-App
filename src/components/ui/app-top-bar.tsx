import Feather from '@expo/vector-icons/Feather';
import * as Haptics from 'expo-haptics';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInUp, FadeOut, FadeOutUp } from 'react-native-reanimated';

import { NotificationBell } from '@/components/ui/notification-bell';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  title: string;
  searchPlaceholder?: string;
  /** Fired on every keystroke. Debounce in the caller if the query hits the network. */
  onQueryChange?: (query: string) => void;
  /** Fired when search opens or closes, so a screen can swap its content. */
  onSearchOpenChange?: (open: boolean) => void;
  showBell?: boolean;
};

export type AppTopBarHandle = { closeSearch: () => void };

/**
 * The app's standard screen header: title on one row with the search toggle and
 * notification bell, and a search field that drops down beneath it.
 *
 * Home and Explore share this so their headers cannot drift apart — previously
 * each had its own layout, and Explore's search had no way to close.
 */
export const AppTopBar = forwardRef<AppTopBarHandle, Props>(function AppTopBar(
  { title, searchPlaceholder = 'Search…', onQueryChange, onSearchOpenChange, showBell = true },
  ref,
) {
  const theme = useTheme();
  const inputRef = useRef<TextInput>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  function close() {
    setOpen(false);
    setQuery('');
    onQueryChange?.('');
    onSearchOpenChange?.(false);
    inputRef.current?.blur();
    Keyboard.dismiss();
  }

  useImperativeHandle(ref, () => ({ closeSearch: close }));

  function toggle() {
    Haptics.selectionAsync();
    if (open) {
      close();
      return;
    }
    setOpen(true);
    onSearchOpenChange?.(true);
    // Focus after the row has rendered, otherwise the keyboard can miss it.
    setTimeout(() => inputRef.current?.focus(), 80);
  }

  function change(text: string) {
    setQuery(text);
    onQueryChange?.(text);
  }

  return (
    <View style={[styles.wrap, { borderBottomColor: theme.border }]}>
      <View style={styles.row}>
        <ThemedText type="subtitle" style={styles.title} numberOfLines={1}>
          {title}
        </ThemedText>

        <View style={styles.actions}>
          <Pressable onPress={toggle} hitSlop={10} style={styles.iconBtn}>
            <Feather name={open ? 'x' : 'search'} size={20} color={theme.foreground} />
          </Pressable>
          {showBell ? <NotificationBell size={20} /> : null}
        </View>
      </View>

      {open ? (
        <Animated.View
          entering={FadeInUp.duration(180)}
          exiting={FadeOutUp.duration(140)}
          style={styles.searchWrap}>
          <View
            style={[
              styles.searchBox,
              { backgroundColor: theme.card, borderColor: theme.ring },
            ]}>
            <Feather name="search" size={16} color={theme.mutedForeground} />
            <TextInput
              ref={inputRef}
              style={[styles.input, { color: theme.foreground }]}
              placeholder={searchPlaceholder}
              placeholderTextColor={theme.mutedForeground}
              value={query}
              onChangeText={change}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {query.length > 0 ? (
              <Animated.View entering={FadeIn.duration(120)} exiting={FadeOut.duration(100)}>
                <Pressable onPress={() => change('')} hitSlop={10}>
                  <Feather name="x-circle" size={16} color={theme.mutedForeground} />
                </Pressable>
              </Animated.View>
            ) : null}
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { borderBottomWidth: StyleSheet.hairlineWidth },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  title: { fontSize: 22, flexShrink: 1 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.four },
  iconBtn: { padding: Spacing.one },
  searchWrap: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.three },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    height: 44,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
  },
  input: { flex: 1, fontSize: 15, paddingVertical: 0 },
});
