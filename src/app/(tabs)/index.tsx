import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SymbolView } from 'expo-symbols';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TestimonyCard } from '@/components/testimony-card';
import { TestimonyCardSkeleton } from '@/components/testimony-card-skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { testimonyService } from '@/services/testimony.service';
import { useTheme } from '@/hooks/use-theme';
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
  const [showSearch, setShowSearch] = useState(false);

  const searchRef = useRef<TextInput>(null);
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

  function toggleSearch() {
    Haptics.selectionAsync();
    setShowSearch(v => {
      if (!v) setTimeout(() => searchRef.current?.focus(), 100);
      else setSearch('');
      return !v;
    });
  }

  const ListHeader = (
    <View style={styles.listHeader}>
      {/* Search bar */}
      {showSearch && (
        <TextInput
          ref={searchRef}
          style={[
            styles.searchInput,
            { borderColor: theme.border, backgroundColor: theme.card, color: theme.foreground },
          ]}
          placeholder="Search testimonies…"
          placeholderTextColor={theme.mutedForeground}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          autoCapitalize="none"
        />
      )}

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
                  backgroundColor: active ? theme.primary : theme.secondary,
                  borderColor: active ? theme.primary : theme.border,
                },
              ]}
              onPress={() => { Haptics.selectionAsync(); setActiveFilter(f.value); }}>
              <ThemedText
                style={[
                  styles.chipText,
                  { color: active ? theme.primaryForeground : theme.mutedForeground },
                ]}>
                {f.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      {!loading && (
        <ThemedText themeColor="textSecondary" style={styles.count}>
          {total.toLocaleString()} {total === 1 ? 'testimony' : 'testimonies'}
        </ThemedText>
      )}
    </View>
  );

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top bar */}
      <View style={[styles.topBar, { borderBottomColor: theme.border }]}>
        <ThemedText type="subtitle" style={styles.appName}>
          HouseMajor
        </ThemedText>
        <Pressable onPress={toggleSearch} style={styles.searchBtn} hitSlop={8}>
          <SymbolView
            name={showSearch ? 'xmark' : 'magnifyingglass'}
            size={20}
            tintColor={theme.foreground}
          />
        </Pressable>
      </View>

      {loading ? (
        <View style={[styles.list, { paddingTop: Spacing.three }]}>
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
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + Spacing.three }]}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={
            <EmptyState
              icon="doc.text.magnifyingglass"
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  appName: { fontSize: 22 },
  searchBtn: { padding: Spacing.one },
  list: { paddingHorizontal: Spacing.three },
  listHeader: { paddingTop: Spacing.three, paddingBottom: Spacing.two, gap: Spacing.two },
  searchInput: {
    height: 44,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: Spacing.three,
    fontSize: 15,
  },
  filters: { flexDirection: 'row', gap: Spacing.two, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontWeight: '500' },
  count: { fontSize: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: Spacing.six },
  empty: { textAlign: 'center', fontSize: 15 },
});
