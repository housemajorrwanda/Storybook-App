import Feather from '@expo/vector-icons/Feather';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth';
import { useTheme } from '@/hooks/use-theme';
import { notificationService } from '@/services/notification.service';

/** Beyond this the exact number stops being useful and the badge gets wide. */
const MAX_DISPLAY = 99;

export function NotificationBell({ size = 20 }: { size?: number }) {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  // Refetch every time the screen regains focus, so the badge clears as soon as
  // the user comes back from reading their notifications.
  useFocusEffect(
    useCallback(() => {
      let active = true;

      if (!user) {
        setCount(0);
        return;
      }

      notificationService
        .getUnreadCount()
        .then((value) => {
          if (active) setCount(Number.isFinite(value) ? value : 0);
        })
        .catch(() => {
          // A failed count must never block the header — just show no badge.
          if (active) setCount(0);
        });

      return () => {
        active = false;
      };
    }, [user]),
  );

  const label = count > MAX_DISPLAY ? `${MAX_DISPLAY}+` : String(count);
  const hasBadge = count > 0;

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        router.push('/notifications');
      }}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={
        hasBadge ? `Notifications, ${count} unread` : 'Notifications'
      }
      style={({ pressed }) => [styles.button, { opacity: pressed ? 0.6 : 1 }]}>
      <Feather name="bell" size={size} color={theme.foreground} />

      {hasBadge ? (
        <Animated.View
          entering={ZoomIn.springify().damping(14)}
          // The badge grows with the digit count instead of clipping: a circle
          // at one digit, a pill at two or three.
          style={[
            styles.badge,
            {
              backgroundColor: theme.brand,
              borderColor: theme.background,
              minWidth: label.length > 1 ? 18 : 16,
              paddingHorizontal: label.length > 1 ? 4 : 0,
            },
          ]}>
          <Animated.View entering={FadeIn.duration(150)}>
            <ThemedText
              style={[styles.badgeText, { color: theme.brandForeground }]}
              numberOfLines={1}>
              {label}
            </ThemedText>
          </Animated.View>
        </Animated.View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { padding: 2 },
  badge: {
    position: 'absolute',
    // Nudged onto the bell's shoulder rather than floating away from it.
    top: -4,
    right: -6,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 13,
    textAlign: 'center',
  },
});
