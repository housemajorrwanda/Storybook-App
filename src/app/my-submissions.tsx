import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/state-views';
import { ScreenHeader } from '@/components/ui/screen-header';
import { formatDate } from '@/utils/format';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import { testimonyService } from '@/services/testimony.service';
import type { Testimony, TestimonyStatus } from '@/types/testimony';

const STATUS_META: Record<TestimonyStatus, { label: string; icon: string; color: (t: any) => string }> = {
  pending: {
    label: 'Under Review',
    icon: 'clock',
    color: t => t.mutedForeground,
  },
  approved: {
    label: 'Published',
    icon: 'check-circle',
    color: t => t.foreground,
  },
  rejected: {
    label: 'Rejected',
    icon: 'x-circle',
    color: t => t.destructive,
  },
};

const TYPE_ICONS: Record<string, string> = {
  written: 'doc.text',
  audio: 'waveform',
  video: 'video',
};

function SubmissionRow({ testimony }: { testimony: Testimony }) {
  const theme = useTheme();
  const router = useRouter();
  const statusMeta = STATUS_META[testimony.status];
  const statusColor = statusMeta.color(theme);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.card, borderColor: theme.border, opacity: pressed ? 0.8 : 1 },
      ]}
      onPress={() => router.push({ pathname: '/testimony/[id]', params: { id: testimony.id } })}>
      {/* Type icon */}
      <View style={[styles.typeIcon, { backgroundColor: theme.secondary }]}>
        <Feather
          name={TYPE_ICONS[testimony.submissionType] as any}
          size={18}
          color={theme.mutedForeground}
        />
      </View>

      {/* Content */}
      <View style={styles.rowContent}>
        <ThemedText style={styles.rowTitle} numberOfLines={2}>
          {testimony.eventTitle}
        </ThemedText>
        <View style={styles.rowMeta}>
          <Feather name={statusMeta.icon as any} size={12} color={statusColor} />
          <ThemedText style={[styles.rowStatus, { color: statusColor }]}>
            {statusMeta.label}
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.rowDate}>
            · {formatDate(testimony.createdAt)}
          </ThemedText>
        </View>
        {/* Theme colours are hsl() strings, so appending a hex alpha ('…12')
            produced an invalid colour and this box rendered untinted. It uses
            real surface tokens now. */}
        {testimony.status === 'rejected' && testimony.adminFeedback ? (
          <View
            style={[
              styles.feedbackBox,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}>
            <ThemedText themeColor="textSecondary" style={styles.feedbackText}>
              {testimony.adminFeedback}
            </ThemedText>
          </View>
        ) : null}
      </View>

      <Feather name="chevron-right" size={14} color={theme.mutedForeground} />
    </Pressable>
  );
}

export default function MySubmissionsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { contentWidth } = useResponsive();

  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      const data = await testimonyService.getMyTestimonies();
      setTestimonies(data);
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

  const counts = {
    total: testimonies.length,
    approved: testimonies.filter(t => t.status === 'approved').length,
    pending: testimonies.filter(t => t.status === 'pending').length,
    rejected: testimonies.filter(t => t.status === 'rejected').length,
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="My Submissions" showBack />

      {loading ? (
        <View style={[styles.list, styles.centered, { width: contentWidth }]}>
          {/* Stats row skeleton */}
          <View style={styles.statsRow}>
            {[0, 1, 2, 3].map(i => (
              <View key={i} style={[styles.statCard, { backgroundColor: theme.secondary }]}>
                <Skeleton width={28} height={24} borderRadius={6} />
                <Skeleton width={44} height={11} borderRadius={4} />
              </View>
            ))}
          </View>
          {/* Row skeletons */}
          {[0, 1, 2, 3].map(i => (
            <View key={i} style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Skeleton width={40} height={40} borderRadius={10} />
              <View style={{ flex: 1, gap: 6 }}>
                <Skeleton width="80%" height={14} borderRadius={6} />
                <Skeleton width="50%" height={12} borderRadius={6} />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={testimonies}
          keyExtractor={t => String(t.id)}
          renderItem={({ item }) => <SubmissionRow testimony={item} />}
          contentContainerStyle={[
            styles.list,
            styles.centered,
            { width: contentWidth, paddingBottom: insets.bottom + Spacing.six },
          ]}
          ListHeaderComponent={
            testimonies.length > 0 ? (
              <View style={styles.statsRow}>
                {([
                  { label: 'Total', count: counts.total, color: theme.foreground },
                  { label: 'Published', count: counts.approved, color: theme.foreground },
                  { label: 'Pending', count: counts.pending, color: theme.mutedForeground },
                  { label: 'Rejected', count: counts.rejected, color: theme.destructive },
                ] as const).map(s => (
                  <View key={s.label} style={[styles.statCard, { backgroundColor: theme.secondary }]}>
                    <ThemedText style={[styles.statNum, { color: s.color }]}>{s.count}</ThemedText>
                    <ThemedText themeColor="textSecondary" style={styles.statLabel}>{s.label}</ThemedText>
                  </View>
                ))}
              </View>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon="file-text"
              title="No submissions yet"
              description="Your submitted testimonies will appear here."
            />
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.primary} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: Spacing.three, gap: Spacing.two },
  centered: { alignSelf: 'center', maxWidth: '100%' },
  statsRow: { flexDirection: 'row', gap: Spacing.two, marginBottom: Spacing.two },
  statCard: { flex: 1, borderRadius: 10, padding: Spacing.two, alignItems: 'center', gap: 2 },
  statNum: { fontSize: 20, fontWeight: '700' },
  statLabel: { fontSize: 11 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowContent: { flex: 1, gap: 4 },
  rowTitle: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowStatus: { fontSize: 12, fontWeight: '500' },
  rowDate: { fontSize: 12 },
  feedbackBox: {
    marginTop: 4,
    padding: Spacing.two,
    borderRadius: 6,
    borderWidth: 1,
  },
  feedbackText: { fontSize: 12, lineHeight: 16 },
});
