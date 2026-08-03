import Feather from '@expo/vector-icons/Feather';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/ui/screen-header';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/state-views';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAsync } from '@/hooks/use-async';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import { familyTreeService } from '@/services/family-tree.service';
import {
  memberLifespan,
  memberPlace,
  type FamilyMember,
  type FamilyTree,
} from '@/types/family-tree';

function MemberCard({
  member,
  relationLabel,
  index,
}: {
  member: FamilyMember;
  relationLabel: string | null;
  index: number;
}) {
  const theme = useTheme();
  const router = useRouter();

  const lifespan = memberLifespan(member);
  const place = memberPlace(member);
  const initials = member.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  const body = (
    <View
      style={[styles.member, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={[styles.avatar, { backgroundColor: theme.backgroundElement }]}>
        {member.photoUrl ? (
          <Image
            source={{ uri: member.photoUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <ThemedText themeColor="textSecondary" style={styles.initials}>
            {initials || '?'}
          </ThemedText>
        )}
      </View>

      <View style={styles.memberBody}>
        <View style={styles.nameRow}>
          <ThemedText style={styles.memberName} numberOfLines={1}>
            {member.name}
          </ThemedText>
          {!member.isAlive ? (
            <View style={[styles.chip, { borderColor: theme.border }]}>
              <ThemedText themeColor="textSecondary" style={styles.chipText}>
                In memory
              </ThemedText>
            </View>
          ) : null}
        </View>

        {relationLabel ? (
          <ThemedText themeColor="textSecondary" style={styles.memberMeta}>
            {relationLabel}
          </ThemedText>
        ) : null}

        {lifespan ? (
          <ThemedText themeColor="textSecondary" style={styles.memberMeta}>
            {lifespan}
          </ThemedText>
        ) : null}

        {place ? (
          <View style={styles.metaRow}>
            <Feather name="map-pin" size={11} color={theme.mutedForeground} />
            <ThemedText themeColor="textSecondary" style={styles.memberMeta} numberOfLines={1}>
              {place}
            </ThemedText>
          </View>
        ) : null}

        {member.bio ? (
          <ThemedText themeColor="textSecondary" style={styles.bio} numberOfLines={3}>
            {member.bio}
          </ThemedText>
        ) : null}

        {member.testimony ? (
          <View style={[styles.testimonyRow, { borderTopColor: theme.border }]}>
            <Feather name="book-open" size={12} color={theme.foreground} />
            <ThemedText style={styles.testimonyText} numberOfLines={1}>
              {member.testimony.eventTitle}
            </ThemedText>
            <Feather name="chevron-right" size={14} color={theme.mutedForeground} />
          </View>
        ) : null}
      </View>
    </View>
  );

  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 45).duration(320)}>
      {member.testimony ? (
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            router.push({
              pathname: '/testimony/[id]',
              params: { id: String(member.testimony!.id) },
            });
          }}
          style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
          {body}
        </Pressable>
      ) : (
        body
      )}
    </Animated.View>
  );
}

export default function FamilyTreeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { contentWidth } = useResponsive();

  const treeId = Number(id);

  const { data: tree, loading, refreshing, error, refresh, retry } = useAsync<FamilyTree>(
    useCallback(async () => {
      // A public tree is readable without auth; fall back to the owner endpoint
      // so someone viewing their own private tree still gets it.
      try {
        return await familyTreeService.getPublicTreeById(treeId);
      } catch {
        return await familyTreeService.getTreeById(treeId);
      }
    }, [treeId]),
    [treeId],
  );

  /**
   * Relations are stored as edges between member ids. This resolves each member's
   * relations into a readable label rather than showing raw ids.
   */
  const relationLabels = useMemo(() => {
    const labels = new Map<number, string>();
    if (!tree) return labels;

    const nameOf = new Map(tree.members.map((m) => [m.id, m.name]));

    for (const relation of tree.relations ?? []) {
      const from = nameOf.get(relation.fromMemberId);
      const to = nameOf.get(relation.toMemberId);
      if (!from || !to) continue;

      const existing = labels.get(relation.fromMemberId);
      const label = `${relation.relationType} of ${to}`;
      labels.set(relation.fromMemberId, existing ? `${existing} · ${label}` : label);
    }
    return labels;
  }, [tree]);

  const listStyle = {
    width: contentWidth,
    alignSelf: 'center' as const,
    maxWidth: '100%' as const,
    paddingBottom: insets.bottom + Spacing.six,
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title={tree?.title ?? 'Family Tree'} showBack />

      {loading ? (
        <LoadingState label="Loading family tree…" />
      ) : error || !tree ? (
        <ErrorState message={error ?? 'This family tree could not be found.'} onRetry={retry} />
      ) : (
        <FlatList
          data={tree.members ?? []}
          keyExtractor={(m) => String(m.id)}
          renderItem={({ item, index }) => (
            <MemberCard
              member={item}
              relationLabel={relationLabels.get(item.id) ?? null}
              index={index}
            />
          )}
          contentContainerStyle={[
            styles.list,
            listStyle,
            !tree.members?.length && styles.emptyList,
          ]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          ListHeaderComponent={
            <View style={styles.header}>
              {tree.description ? (
                <ThemedText themeColor="textSecondary" style={styles.desc}>
                  {tree.description}
                </ThemedText>
              ) : null}
              <View style={styles.headerMeta}>
                <View style={[styles.pill, { borderColor: theme.border }]}>
                  <Feather name="users" size={12} color={theme.mutedForeground} />
                  <ThemedText themeColor="textSecondary" style={styles.pillText}>
                    {tree.members?.length ?? 0} members
                  </ThemedText>
                </View>
                {tree.user?.fullName ? (
                  <View style={[styles.pill, { borderColor: theme.border }]}>
                    <Feather name="user" size={12} color={theme.mutedForeground} />
                    <ThemedText themeColor="textSecondary" style={styles.pillText} numberOfLines={1}>
                      {tree.user.fullName}
                    </ThemedText>
                  </View>
                ) : null}
              </View>
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              icon="users"
              title="No members yet"
              description="Members added to this tree from the web dashboard will appear here."
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingHorizontal: Spacing.three, gap: Spacing.three },
  emptyList: { flexGrow: 1 },
  header: { gap: Spacing.three, paddingBottom: Spacing.one },
  desc: { fontSize: 14, lineHeight: 20 },
  headerMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxWidth: 220,
  },
  pillText: { fontSize: 12, flexShrink: 1 },
  member: {
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: 16,
    borderWidth: 1,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { fontSize: 16, fontWeight: '600' },
  memberBody: { flex: 1, gap: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  memberName: { fontSize: 15, fontWeight: '600', flexShrink: 1 },
  chip: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  chipText: { fontSize: 10, fontWeight: '500' },
  memberMeta: { fontSize: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  bio: { fontSize: 13, lineHeight: 18, marginTop: 3 },
  testimonyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.two,
    paddingTop: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  testimonyText: { flex: 1, fontSize: 12, fontWeight: '500' },
});
