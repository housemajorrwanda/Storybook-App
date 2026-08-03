import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';

import { FeatureBanner } from '@/components/ui/feature-banner';
import { AppTopBar } from '@/components/ui/app-top-bar';
import { TestimonyCard } from '@/components/testimony-card';
import { Skeleton } from '@/components/ui/skeleton';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { testimonyService } from '@/services/testimony.service';
import { formatCount } from '@/utils/format';
import type { SubmissionType, Testimony, TrendingTestimony } from '@/types/testimony';

const TYPE_OPTIONS: { type: SubmissionType; symbol: string; label: string; desc: string }[] = [
  { type: 'written', symbol: 'file-text', label: 'Written', desc: 'Text testimonies' },
  { type: 'audio', symbol: 'mic', label: 'Audio', desc: 'Voice recordings' },
  { type: 'video', symbol: 'video', label: 'Video', desc: 'Video testimonies' },
];

export default function ExploreScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [trending, setTrending] = useState<TrendingTestimony[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [results, setResults] = useState<Testimony[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    testimonyService
      .getTrending(6)
      .then(setTrending)
      .finally(() => setTrendingLoading(false));
  }, []);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    setSearching(true);
    setHasSearched(true);
    try {
      const res = await testimonyService.search(q.trim());
      setResults(res.data);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  function onChangeText(text: string) {
    setQuery(text);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => runSearch(text), 450);
  }



  const isSearchMode = focused || query.length > 0;

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <AppTopBar
        title="Explore"
        searchPlaceholder="Search testimonies…"
        onQueryChange={onChangeText}
        onSearchOpenChange={setFocused}
      />

      {isSearchMode && hasSearched ? (
        /* Search results */
        <FlatList
          data={results}
          keyExtractor={t => String(t.id)}
          renderItem={({ item }) => <TestimonyCard testimony={item} />}
          contentContainerStyle={[styles.resultsList, { paddingBottom: insets.bottom + BottomTabInset + Spacing.six }]}
          ListHeaderComponent={
            <ThemedText themeColor="textSecondary" style={styles.resultsLabel}>
              {searching ? 'Searching…' : `${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"`}
            </ThemedText>
          }
          ListEmptyComponent={
            searching ? (
              <ActivityIndicator color={theme.primary} style={{ marginTop: Spacing.six }} />
            ) : (
              <View style={styles.emptyState}>
                <Feather name="search" size={40} color={theme.mutedForeground} />
                <ThemedText themeColor="textSecondary" style={styles.emptyText}>
                  No testimonies found{'\n'}for "{query}"
                </ThemedText>
              </View>
            )
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        /* Discovery content */
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + BottomTabInset + Spacing.six }}>

          {/* Feature entry points. Both use the shared FeatureBanner so surface,
              border and text all come from the theme and invert in light mode. */}
          <View style={styles.section}>
            {/* Virtual Tours moved to its own bottom-tab, so it is no longer
                duplicated here — one destination, one entry point. */}
            <FeatureBanner
              icon="git-merge"
              title="Family Trees"
              description="Trace families and the testimonies that remember them"
              onPress={() => router.push('/family-tree')}
            />
          </View>

          {/* Browse by type */}
          <Animated.View entering={FadeInDown.delay(60).duration(400)} style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Browse by Type</ThemedText>
            <View style={styles.typeGrid}>
              {TYPE_OPTIONS.map(opt => (
                <Pressable
                  key={opt.type}
                  style={({ pressed }) => [
                    styles.typeCard,
                    {
                      backgroundColor: theme.secondary,
                      borderColor: theme.border,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                  onPress={() =>
                    router.push({ pathname: '/', params: { type: opt.type } })
                  }>
                  <View style={[styles.typeIconWrap, { backgroundColor: theme.background }]}>
                    <Feather name={opt.symbol as any} size={22} color={theme.foreground} />
                  </View>
                  <ThemedText style={styles.typeLabel}>{opt.label}</ThemedText>
                  <ThemedText themeColor="textSecondary" style={styles.typeDesc}>
                    {opt.desc}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </Animated.View>

          {/* Trending */}
          <Animated.View entering={FadeInDown.delay(120).duration(400)} style={styles.sectionFlush}>
            <View style={[styles.sectionHeader, styles.sectionHeaderInset]}>
              <ThemedText style={styles.sectionTitle}>Trending</ThemedText>
              <Feather name="trending-up" size={14} color={theme.mutedForeground} />
            </View>

            {trendingLoading ? (
              <View style={styles.trendingRow}>
                {[0, 1, 2].map(i => (
                  <View key={i} style={[styles.trendCard, { borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: theme.border }]}>
                    <Skeleton width={180} height={110} borderRadius={0} />
                    <View style={{ padding: Spacing.two, gap: 6 }}>
                      <Skeleton width="90%" height={13} borderRadius={6} />
                      <Skeleton width="60%" height={13} borderRadius={6} />
                      <Skeleton width={48} height={11} borderRadius={6} />
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.trendingRow}>
                  {trending.map(t => (
                    <Pressable
                      key={t.id}
                      style={({ pressed }) => [styles.trendCard, { opacity: pressed ? 0.88 : 1 }]}
                      onPress={() =>
                        router.push({ pathname: '/testimony/[id]', params: { id: t.id } })
                      }>
                      <View style={[styles.trendInner, { borderColor: theme.border }]}>
                        {t.images?.[0]?.imageUrl ? (
                          <Image
                            source={{ uri: t.images[0].imageUrl }}
                            style={styles.trendImage}
                            contentFit="cover"
                            transition={200}
                          />
                        ) : (
                          <View
                            style={[styles.trendImagePlaceholder, { backgroundColor: theme.secondary }]}
                          />
                        )}
                        <View style={styles.trendContent}>
                          <ThemedText style={styles.trendTitle} numberOfLines={2}>
                            {t.eventTitle}
                          </ThemedText>
                          <View style={styles.trendMeta}>
                            <Feather name="eye" size={11} color={theme.mutedForeground} />
                            <ThemedText themeColor="textSecondary" style={styles.trendMetaText}>
                              {formatCount(t.impressions)}
                            </ThemedText>
                          </View>
                        </View>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            )}
          </Animated.View>
        </ScrollView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  resultsList: { paddingHorizontal: Spacing.three, paddingTop: Spacing.two },
  resultsLabel: { fontSize: 13, marginBottom: Spacing.two },
  emptyState: { alignItems: 'center', paddingTop: Spacing.six, gap: Spacing.three },
  emptyText: { textAlign: 'center', fontSize: 15, lineHeight: 22 },
  section: { paddingHorizontal: Spacing.four, paddingTop: Spacing.four, gap: Spacing.three },
  sectionFlush: { paddingTop: Spacing.four, gap: Spacing.three },
  sectionHeaderInset: { paddingHorizontal: Spacing.four },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  sectionTitle: { fontSize: 17, fontWeight: '600' },
  typeGrid: { flexDirection: 'row', gap: Spacing.two },
  typeCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.one,
    alignItems: 'center',
  },
  typeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  typeLabel: { fontSize: 13, fontWeight: '600' },
  typeDesc: { fontSize: 11, textAlign: 'center' },
  // Sole horizontal padding for the carousel — the section around it is flush,
  // so cards line up with other sections yet scroll past the screen edge.
  trendingRow: { flexDirection: 'row', gap: Spacing.three, paddingHorizontal: Spacing.four },
  trendCard: { width: 180 },
  trendInner: { borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  trendImage: { width: '100%', height: 110 },
  trendImagePlaceholder: { width: '100%', height: 110 },
  trendContent: { padding: Spacing.two, gap: 4 },
  trendTitle: { fontSize: 13, fontWeight: '600', lineHeight: 18 },
  trendMeta: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  trendMetaText: { fontSize: 11 },
});
