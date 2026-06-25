import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NotificationRowSkeleton } from '@/components/notification-row-skeleton';
import { AppButton } from '@/components/ui/app-button';
import { EmptyState } from '@/components/ui/empty-state';
import { ScreenHeader } from '@/components/ui/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { notificationService } from '@/services/notification.service';
import type { AppNotification, NotificationType } from '@/types/notification';

const TYPE_META: Record<string, { icon: string; label: string }> = {
  testimony_submitted: { icon: 'doc.text.fill', label: 'Submission' },
  feedback_resolved: { icon: 'checkmark.bubble.fill', label: 'Feedback' },
  ai_connection: { icon: 'sparkles', label: 'AI Discovery' },
};

function getTypeMeta(type: NotificationType) {
  return TYPE_META[type] ?? { icon: 'bell.fill', label: 'Notification' };
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function NotificationRow({
  notification,
  onRead,
}: {
  notification: AppNotification;
  onRead: (id: number) => void;
}) {
  const theme = useTheme();
  const isUnread = notification.status === 'unread';
  const meta = getTypeMeta(notification.type);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: isUnread ? theme.secondary : theme.card,
          borderColor: theme.border,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
      onPress={() => isUnread && onRead(notification.id)}>
      {/* Icon */}
      <View style={[styles.iconWrap, { backgroundColor: isUnread ? theme.primary : theme.muted }]}>
        <SymbolView
          name={meta.icon as any}
          size={18}
          tintColor={isUnread ? theme.primaryForeground : theme.mutedForeground}
        />
      </View>

      {/* Body */}
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <ThemedText style={[styles.rowTitle, isUnread && { fontWeight: '700' }]} numberOfLines={1}>
            {notification.title}
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.rowTime}>
            {timeAgo(notification.createdAt)}
          </ThemedText>
        </View>
        {notification.message ? (
          <ThemedText themeColor="textSecondary" style={styles.rowMsg} numberOfLines={2}>
            {notification.message}
          </ThemedText>
        ) : null}
        <ThemedText style={[styles.rowType, { color: theme.mutedForeground }]}>
          {meta.label}
        </ThemedText>
      </View>

      {/* Unread dot */}
      {isUnread && (
        <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />
      )}
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const unreadCount = notifications.filter(n => n.status === 'unread').length;

  async function load() {
    try {
      const data = await notificationService.getMyNotifications();
      setNotifications(data);
    } catch {
      /* keep empty */
    }
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function handleMarkAll() {
    setMarkingAll(true);
    try {
      await notificationService.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, status: 'read' as const })));
    } finally {
      setMarkingAll(false);
    }
  }

  const handleMarkOne = useCallback(async (id: number) => {
    // Optimistic
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, status: 'read' as const } : n)),
    );
    try {
      await notificationService.markRead(id);
    } catch {
      // Revert
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, status: 'unread' as const } : n)),
      );
    }
  }, []);

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader
        title="Notifications"
        showBack
        rightAction={
          unreadCount > 0
            ? { icon: 'checkmark.circle', onPress: handleMarkAll }
            : undefined
        }
      />

      {loading ? (
        <View style={{ paddingTop: Spacing.two }}>
          {[0, 1, 2, 3, 4].map(i => (
            <NotificationRowSkeleton key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={n => String(n.id)}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 40).duration(300)}>
              <NotificationRow notification={item} onRead={handleMarkOne} />
            </Animated.View>
          )}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + Spacing.six }]}
          ListHeaderComponent={
            unreadCount > 0 ? (
              <View style={styles.headerRow}>
                <ThemedText themeColor="textSecondary" style={styles.headerCount}>
                  {unreadCount} unread
                </ThemedText>
                <AppButton
                  label="Mark all read"
                  onPress={handleMarkAll}
                  variant="ghost"
                  size="sm"
                  fullWidth={false}
                  loading={markingAll}
                />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon="bell.slash"
              title="No notifications"
              description="You're all caught up. New notifications will appear here."
            />
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.primary} />
          }
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => (
            <View style={[styles.sep, { backgroundColor: theme.border }]} />
          )}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingTop: Spacing.two },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.two,
  },
  headerCount: { fontSize: 13 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    gap: Spacing.three,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  rowBody: { flex: 1, gap: 4 },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  rowTitle: { flex: 1, fontSize: 14, fontWeight: '500' },
  rowTime: { fontSize: 12, flexShrink: 0 },
  rowMsg: { fontSize: 13, lineHeight: 18 },
  rowType: { fontSize: 11, fontWeight: '500' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6, flexShrink: 0 },
  sep: { height: StyleSheet.hairlineWidth },
});
