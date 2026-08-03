import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Feather from '@expo/vector-icons/Feather';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TestimonyCard } from '@/components/testimony-card';
import { TestimonyCardSkeleton } from '@/components/testimony-card-skeleton';
import { AppTopBar } from '@/components/ui/app-top-bar';
import { EmptyState } from '@/components/ui/state-views';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { testimonyService } from '@/services/testimony.service';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import { formatCount, pluralise } from '@/utils/format';
import type { Testimony, SubmissionType, TestimonyFilters } from '@/types/testimony';

const FILTERS: { label: string; value: SubmissionType | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Written', value: 'written' },
  { label: 'Audio', value: 'audio' },
  { label: 'Video', value: 'video' },
];

export default function HomeScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { contentWidth } = useResponsive();
  const { type: typeParam } = useLocalSearchParams<{ type?: string }>();

  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<SubmissionType | 'all'>(
    (typeParam as SubmissionType) ?? 'all',
  );

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipRef = useRef(0);

  const buildFilters = useCallback(
    (skip: number, query = search, type = activeFilter): TestimonyFilters => ({
      skip,
      ...(query.trim() ? { search: query.trim() } : {}),
      ...(type !== 'all' ? { submissionType: type } : {}),
    }),
    [search, activeFilter],
  );

  async function loadTestimonies(skip: number, replace: boolean) {
    try {
      const res = await testimonyService.getTestimonies(buildFilters(skip));
      setTotal(res.meta.total);
      setHasMore(skip + res.data.length < res.meta.total);
      setTestimonies(prev => (replace ? res.data : [...prev, ...res.data]));
      skipRef.current = skip + res.data.length;
    } catch (e) {
      // keep existing data on error
    }
  }

  async function initialLoad() {
    setLoading(true);
    skipRef.current = 0;
    await loadTestimonies(0, true);
    setLoading(false);
  }

  async function refresh() {
    setRefreshing(true);
    skipRef.current = 0;
    await loadTestimonies(0, true);
    setRefreshing(false);
  }

  async function loadMore() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await loadTestimonies(skipRef.current, false);
    setLoadingMore(false);
  }

  useEffect(() => {
    initialLoad();
  }, [activeFilter]);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      skipRef.current = 0;
      initialLoad();
    }, 400);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [search]);


  const ListHeader = (
    <View style={styles.listHeader}>
      {/* Filter chips */}
      <View style={styles.filters}>
        {FILTERS.map(f => {
          const active = f.value === activeFilter;
          return (
            <Pressable
              key={f.value}
              style={[
                styles.chip,
                {
                  // Selection is marked by the amber border and a raised surface,
                  // not a solid fill: a filled pill out-shouts the testimony cards,
                  // and solid amber is reserved for the primary action. Amber text
                  // was ruled out — 4.08:1 on this surface fails AA at 13px.
                  backgroundColor: active ? theme.backgroundSelected : theme.secondary,
                  borderColor: active ? theme.brand : theme.border,
                },
              ]}
              onPress={() => { Haptics.selectionAsync(); setActiveFilter(f.value); }}>
              <ThemedText
                style={[
                  styles.chipText,
                  active && styles.chipTextActive,
                  { color: active ? theme.foreground : theme.mutedForeground },
                ]}>
                {f.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      {!loading && (
        <ThemedText themeColor="textSecondary" style={styles.count}>
          {formatCount(total)} {pluralise(total, 'testimony', 'testimonies')}
        </ThemedText>
      )}
    </View>
  );

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <AppTopBar
        title="StoryBook"
        searchPlaceholder="Search testimonies…"
        onQueryChange={setSearch}
      />

      {loading ? (
        <View style={[styles.list, styles.centered, { width: contentWidth, paddingTop: Spacing.three }]}>
          {[0, 1, 2, 3].map(i => (
            <TestimonyCardSkeleton key={i} featured={i === 0} />
          ))}
        </View>
      ) : (
        <FlatList
          data={testimonies}
          keyExtractor={t => String(t.id)}
          renderItem={({ item, index }) => (
            <TestimonyCard testimony={item} featured={index === 0} />
          )}
          contentContainerStyle={[
            styles.list,
            styles.centered,
            { width: contentWidth, paddingBottom: insets.bottom + BottomTabInset + Spacing.three },
          ]}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={
            <EmptyState
              icon="file-text"
              title="No testimonies found"
              description={search ? `No results for "${search}"` : 'Be the first to share a testimony.'}
            />
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                color={theme.mutedForeground}
                style={{ paddingVertical: Spacing.four }}
              />
            ) : null
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={theme.primary}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingHorizontal: Spacing.three },
  centered: { alignSelf: 'center', maxWidth: '100%' },
  listHeader: { paddingTop: Spacing.three, paddingBottom: Spacing.two, gap: Spacing.two },
  filters: { flexDirection: 'row', gap: Spacing.two, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontWeight: '500' },
  chipTextActive: { fontWeight: '600' },
  count: { fontSize: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: Spacing.six },
  empty: { textAlign: 'center', fontSize: 15 },
});
