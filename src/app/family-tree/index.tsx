import Feather from '@expo/vector-icons/Feather';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppInput } from '@/components/ui/app-input';
import { ScreenHeader } from '@/components/ui/screen-header';
import { EmptyState, ErrorState } from '@/components/ui/state-views';
import { formatCount, pluralise } from '@/utils/format';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useAsync } from '@/hooks/use-async';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import { familyTreeService } from '@/services/family-tree.service';
import type { FamilyTree } from '@/types/family-tree';

type Scope = 'public' | 'mine';

function ScopeTabs({ value, onChange }: { value: Scope; onChange: (s: Scope) => void }) {
  const theme = useTheme();
  const tabs: { key: Scope; label: string }[] = [
    { key: 'public', label: 'Discover' },
    { key: 'mine', label: 'My trees' },
  ];

  return (
    <View style={[styles.tabs, { backgroundColor: theme.backgroundElement }]}>
      {tabs.map((tab) => {
        const active = tab.key === value;
        return (
          <Pressable
            key={tab.key}
            onPress={() => {
              Haptics.selectionAsync();
              onChange(tab.key);
            }}
            style={[styles.tab, active && { backgroundColor: theme.background }]}>
            <ThemedText
              themeColor={active ? 'text' : 'textSecondary'}
              style={[styles.tabText, active && styles.tabTextActive]}>
              {tab.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

function TreeCard({ tree, index }: { tree: FamilyTree; index: number }) {
  const theme = useTheme();
  const router = useRouter();
  const memberCount = tree._count?.members ?? tree.members?.length ?? 0;

  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index, 6) * 50).duration(320)}
      layout={LinearTransition.springify().damping(20)}>
      <Pressable
        onPress={() => {
          Haptics.selectionAsync();
          router.push({ pathname: '/family-tree/[id]', params: { id: String(tree.id) } });
        }}
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: theme.card, borderColor: theme.border, opacity: pressed ? 0.85 : 1 },
        ]}>
        <View style={[styles.cardIcon, { backgroundColor: theme.backgroundElement }]}>
          <Feather name="git-merge" size={18} color={theme.foreground} />
        </View>

        <View style={styles.cardBody}>
          <ThemedText style={styles.cardTitle} numberOfLines={1}>
            {tree.title}
          </ThemedText>

          {tree.description ? (
            <ThemedText themeColor="textSecondary" style={styles.cardDesc} numberOfLines={2}>
              {tree.description}
            </ThemedText>
          ) : null}

          <View style={styles.metaRow}>
            <Feather name="users" size={11} color={theme.mutedForeground} />
            <ThemedText themeColor="textSecondary" style={styles.meta}>
              {formatCount(memberCount)} {pluralise(memberCount, 'member')}
            </ThemedText>
            {tree.user?.fullName ? (
              <>
                <View style={[styles.dot, { backgroundColor: theme.mutedForeground }]} />
                <ThemedText themeColor="textSecondary" style={styles.meta} numberOfLines={1}>
                  {tree.user.fullName}
                </ThemedText>
              </>
            ) : null}
          </View>
        </View>

        <Feather name="chevron-right" size={18} color={theme.mutedForeground} />
      </Pressable>
    </Animated.View>
  );
}

export default function FamilyTreeListScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const router = useRouter();
  const { contentWidth } = useResponsive();
  const { user } = useAuth();

  const [scope, setScope] = useState<Scope>('public');
  const [search, setSearch] = useState('');

  const { data, loading, refreshing, error, refresh, retry } = useAsync<FamilyTree[]>(
    useCallback(async () => {
      if (scope === 'mine') return familyTreeService.getMyTrees();
      const page = await familyTreeService.getPublicTrees({ limit: 20 });
      return page.data;
    }, [scope]),
    [scope],
  );

  // Filtering client-side keeps typing instant; the lists are small enough that a
  // request per keystroke would be slower and noisier than this.
  const term = search.trim().toLowerCase();
  const trees = (data ?? []).filter(
    (t) =>
      !term ||
      t.title.toLowerCase().includes(term) ||
      (t.description ?? '').toLowerCase().includes(term),
  );

  const listStyle = {
    width: contentWidth,
    alignSelf: 'center' as const,
    maxWidth: '100%' as const,
    paddingBottom: insets.bottom + Spacing.six,
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Family Trees" showBack />

      <View style={[styles.controls, { width: contentWidth, alignSelf: 'center', maxWidth: '100%' }]}>
        <ScopeTabs value={scope} onChange={setScope} />
        <AppInput
          placeholder="Search trees"
          value={search}
          onChangeText={setSearch}
          iconLeft="search"
          iconRight={search ? 'x' : undefined}
          onIconRightPress={() => setSearch('')}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
      </View>

      {loading ? (
        <View style={[styles.list, listStyle]}>
          {Array.from({ length: 4 }).map((_, i) => (
            <View
              key={i}
              style={[styles.card, styles.skeleton, { backgroundColor: theme.backgroundElement }]}
            />
          ))}
        </View>
      ) : error ? (
        <ErrorState message={error} onRetry={retry} />
      ) : (
        <Animated.FlatList
          data={trees}
          keyExtractor={(t) => String(t.id)}
          renderItem={({ item, index }) => <TreeCard tree={item} index={index} />}
          itemLayoutAnimation={LinearTransition.springify().damping(22)}
          contentContainerStyle={[styles.list, listStyle, !trees.length && styles.emptyList]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <Animated.View entering={FadeIn.duration(250)} style={styles.flex}>
              {term ? (
                <EmptyState
                  icon="search"
                  title="No matches"
                  description={`Nothing matched “${search.trim()}”. Try a different name.`}
                  actionLabel="Clear search"
                  onAction={() => setSearch('')}
                />
              ) : scope === 'mine' ? (
                <EmptyState
                  icon="git-merge"
                  title={user ? 'No trees yet' : 'Sign in to see your trees'}
                  description={
                    user
                      ? 'Family trees you create on the web dashboard will show up here.'
                      : 'Your family trees are private to your account.'
                  }
                  actionLabel={user ? undefined : 'Sign in'}
                  onAction={user ? undefined : () => router.push('/(auth)/login')}
                />
              ) : (
                <EmptyState
                  icon="users"
                  title="No public trees yet"
                  description="Family trees shared publicly will appear here. Pull down to check again."
                />
              )}
            </Animated.View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  controls: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.three, gap: Spacing.three },
  tabs: { flexDirection: 'row', borderRadius: 12, padding: 3, gap: 3 },
  tab: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center' },
  tabText: { fontSize: 14 },
  tabTextActive: { fontWeight: '600' },
  list: { paddingHorizontal: Spacing.three, gap: Spacing.three },
  emptyList: { flexGrow: 1 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: 16,
    borderWidth: 1,
  },
  skeleton: { height: 92, borderWidth: 0 },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1, gap: 3 },
  cardTitle: { fontSize: 15, fontWeight: '600' },
  cardDesc: { fontSize: 13, lineHeight: 18 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  meta: { fontSize: 12, flexShrink: 1 },
  dot: { width: 3, height: 3, borderRadius: 1.5 },
});
