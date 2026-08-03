import Feather from '@expo/vector-icons/Feather';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { AppButton } from '@/components/ui/app-button';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { IconName } from './app-input';

/** Centred spinner for a first load, when there is nothing to show yet. */
export function LoadingState({ label }: { label?: string }) {
  const theme = useTheme();
  return (
    <View style={styles.wrap}>
      <ActivityIndicator color={theme.mutedForeground} />
      {label ? (
        <ThemedText themeColor="textSecondary" style={styles.body}>
          {label}
        </ThemedText>
      ) : null}
    </View>
  );
}

/**
 * Shown when a request fails. Always pairs the message with a retry — a dead end
 * is the worst possible response to a flaky network.
 */
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const theme = useTheme();
  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.wrap}>
      <View style={[styles.ring, { borderColor: theme.border, backgroundColor: theme.card }]}>
        <Feather name="wifi-off" size={26} color={theme.mutedForeground} />
      </View>
      <ThemedText style={styles.title}>Couldn&apos;t load this</ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.body}>
        {message}
      </ThemedText>
      {onRetry ? (
        <View style={styles.action}>
          <AppButton label="Try again" onPress={onRetry} variant="outline" iconLeft="refresh-cw" />
        </View>
      ) : null}
    </Animated.View>
  );
}

/**
 * Shown when a request succeeds but returns nothing. Distinct from ErrorState on
 * purpose: "nothing here yet" and "we failed to load" call for different actions.
 */
export function EmptyState({
  icon = 'inbox',
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon?: IconName;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const theme = useTheme();
  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.wrap}>
      <View style={[styles.ring, { borderColor: theme.border, backgroundColor: theme.card }]}>
        <Feather name={icon} size={26} color={theme.mutedForeground} />
      </View>
      <ThemedText style={styles.title}>{title}</ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.body}>
        {description}
      </ThemedText>
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <AppButton label={actionLabel} onPress={onAction} variant="outline" />
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.six,
  },
  ring: {
    width: 64,
    height: 64,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  title: { fontSize: 17, fontWeight: '600', textAlign: 'center' },
  body: { fontSize: 14, lineHeight: 20, textAlign: 'center', maxWidth: 300 },
  action: { marginTop: Spacing.three, alignSelf: 'stretch', maxWidth: 260 },
});
