import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { TestimonyCard } from '@/components/testimony-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { testimonyService } from '@/services/testimony.service';
import type { SubmissionType, Testimony, TrendingTestimony } from '@/types/testimony';

const TYPE_OPTIONS: { type: SubmissionType; symbol: string; label: string; desc: string }[] = [
  { type: 'written', symbol: 'doc.text.fill', label: 'Written', desc: 'Text testimonies' },
  { type: 'audio', symbol: 'waveform', label: 'Audio', desc: 'Voice recordings' },
  { type: 'video', symbol: 'video.fill', label: 'Video', desc: 'Video testimonies' },
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

  const inputRef = useRef<TextInput>(null);
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

  function clearSearch() {
    setQuery('');
    setResults([]);
    setHasSearched(false);
    inputRef.current?.focus();
  }

  const isSearchMode = focused || query.length > 0;

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <ThemedText type="subtitle" style={styles.headerTitle}>
          Explore
        </ThemedText>
      </View>

      {/* Search bar */}
      <View style={[styles.searchRow, { borderBottomColor: theme.border }]}>
        <View
          style={[
            styles.searchBox,
            {
              backgroundColor: theme.secondary,
              borderColor: focused ? theme.ring : theme.border,
            },
          ]}>
          <SymbolView name="magnifyingglass" size={16} tintColor={theme.mutedForeground} />
          <TextInput
            ref={inputRef}
            style={[styles.searchInput, { color: theme.foreground }]}
            placeholder="Search testimonies…"
            placeholderTextColor={theme.mutedForeground}
            value={query}
            onChangeText={onChangeText}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <Pressable onPress={clearSearch} hitSlop={8}>
              <SymbolView name="xmark.circle.fill" size={16} tintColor={theme.mutedForeground} />
            </Pressable>
          )}
        </View>
      </View>

      {isSearchMode && hasSearched ? (
        /* Search results */
        <FlatList
          data={results}
          keyExtractor={t => String(t.id)}
          renderItem={({ item }) => <TestimonyCard testimony={item} />}
          contentContainerStyle={[styles.resultsList, { paddingBottom: insets.bottom + Spacing.six }]}
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
                <SymbolView name="magnifyingglass" size={40} tintColor={theme.mutedForeground} />
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
          contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.six }}>

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
                    <SymbolView name={opt.symbol as any} size={22} tintColor={theme.foreground} />
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
          <Animated.View entering={FadeInDown.delay(120).duration(400)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>Trending</ThemedText>
              <SymbolView name="flame.fill" size={14} tintColor={theme.mutedForeground} />
            </View>

            {trendingLoading ? (
              <ActivityIndicator color={theme.primary} style={{ paddingVertical: Spacing.four }} />
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
                            <SymbolView name="eye" size={11} tintColor={theme.mutedForeground} />
                            <ThemedText themeColor="textSecondary" style={styles.trendMetaText}>
                              {t.impressions.toLocaleString()}
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
  header: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 22 },
  searchRow: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  searchInput: { flex: 1, fontSize: 15 },
  resultsList: { paddingHorizontal: Spacing.three, paddingTop: Spacing.two },
  resultsLabel: { fontSize: 13, marginBottom: Spacing.two },
  emptyState: { alignItems: 'center', paddingTop: Spacing.six, gap: Spacing.three },
  emptyText: { textAlign: 'center', fontSize: 15, lineHeight: 22 },
  section: { paddingHorizontal: Spacing.four, paddingTop: Spacing.four, gap: Spacing.three },
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
  trendingRow: { flexDirection: 'row', gap: Spacing.three, paddingLeft: Spacing.four, paddingRight: Spacing.four },
  trendCard: { width: 180 },
  trendInner: { borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  trendImage: { width: '100%', height: 110 },
  trendImagePlaceholder: { width: '100%', height: 110 },
  trendContent: { padding: Spacing.two, gap: 4 },
  trendTitle: { fontSize: 13, fontWeight: '600', lineHeight: 18 },
  trendMeta: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  trendMetaText: { fontSize: 11 },
});
