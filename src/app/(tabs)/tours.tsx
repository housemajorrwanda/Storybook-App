import Feather from '@expo/vector-icons/Feather';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, Platform, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/ui/screen-header';
import { EmptyState, ErrorState } from '@/components/ui/state-views';
import { formatCount, pluralise } from '@/utils/format';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useAsync } from '@/hooks/use-async';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import { tourService } from '@/services/tour.service';
import { tourMediaUrl, type VirtualTour } from '@/types/tour';

function TourCard({ tour, index, height }: { tour: VirtualTour; index: number; height: number }) {
  const router = useRouter();
  const theme = useTheme();
  const cover = tour.image360Url ?? tourMediaUrl(tour);
  const hotspotCount = tour._count?.hotspots ?? tour.hotspots?.length ?? 0;

  return (
    // Stagger caps at 6 so a long list doesn't leave later cards visibly late.
    <Animated.View entering={FadeInDown.delay(Math.min(index, 6) * 60).duration(350)} style={styles.cardWrap}>
      <Pressable
        style={({ pressed }) => [styles.card, { opacity: pressed ? 0.9 : 1 }]}
        onPress={() => {
          Haptics.selectionAsync();
          router.push({ pathname: '/virtual-tour/[id]', params: { id: String(tour.id) } });
        }}>
        <View
          style={[
            styles.imageWrap,
            { height, backgroundColor: theme.backgroundElement },
            Platform.OS === 'ios' && styles.shadow,
          ]}>
          {cover ? (
            <Image
              source={{ uri: cover }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={220}
            />
          ) : null}
          {/* Flat scrim instead of a gradient — keeps text legible over any image
              without introducing a colour ramp. */}
          <View style={styles.scrim} pointerEvents="none" />

          <View style={styles.badge}>
            <Feather name="compass" size={12} color="#fff" />
            <ThemedText style={styles.badgeText}>360° Tour</ThemedText>
          </View>

          <View style={styles.cardInfo}>
            <ThemedText style={styles.cardTitle} numberOfLines={1}>
              {tour.title}
            </ThemedText>
            <View style={styles.cardMetaRow}>
              <Feather name="map-pin" size={11} color="rgba(255,255,255,0.85)" />
              <ThemedText style={styles.cardMeta} numberOfLines={1}>
                {tour.location}
              </ThemedText>
              {hotspotCount > 0 ? (
                <>
                  <View style={styles.dot} />
                  <ThemedText style={styles.cardMeta}>
                    {formatCount(hotspotCount)} {pluralise(hotspotCount, 'point')}
                  </ThemedText>
                </>
              ) : null}
            </View>
          </View>
        </View>

        {tour.description ? (
          <ThemedText themeColor="textSecondary" style={styles.cardDesc} numberOfLines={2}>
            {tour.description}
          </ThemedText>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

/** Shimmer-free skeleton — matches the card's silhouette so nothing jumps on load. */
function CardSkeleton({ height }: { height: number }) {
  const theme = useTheme();
  return (
    <View style={styles.cardWrap}>
      <View style={[styles.imageWrap, { height, backgroundColor: theme.backgroundElement }]} />
      <View style={[styles.skelLine, { backgroundColor: theme.backgroundElement, width: '70%' }]} />
      <View style={[styles.skelLine, { backgroundColor: theme.backgroundElement, width: '45%' }]} />
    </View>
  );
}

export default function VirtualTourListScreen() {
  const insets = useSafeAreaInsets();
  const { contentWidth, isTablet, scale } = useResponsive();

  const { data, loading, refreshing, error, refresh, retry } = useAsync(
    useCallback(() => tourService.getTours({ limit: 20 }), []),
  );

  const tours = data?.data ?? [];
  const columns = isTablet ? 2 : 1;
  const cardHeight = scale(isTablet ? 180 : 200);

  const listPadding = {
    width: contentWidth,
    alignSelf: 'center' as const,
    maxWidth: '100%' as const,
    paddingBottom: insets.bottom + BottomTabInset + Spacing.six,
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Virtual Tours" />

      {loading ? (
        <View style={[styles.list, listPadding]}>
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} height={cardHeight} />
          ))}
        </View>
      ) : error ? (
        <ErrorState message={error} onRetry={retry} />
      ) : (
        <FlatList
          data={tours}
          key={columns} // FlatList cannot change numColumns without a remount
          numColumns={columns}
          columnWrapperStyle={columns > 1 ? styles.column : undefined}
          keyExtractor={(t) => String(t.id)}
          renderItem={({ item, index }) => (
            <TourCard tour={item} index={index} height={cardHeight} />
          )}
          contentContainerStyle={[styles.list, listPadding, !tours.length && styles.emptyList]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          ListHeaderComponent={
            tours.length ? (
              <ThemedText themeColor="textSecondary" style={styles.intro}>
                Step inside Rwanda&apos;s memorial sites in immersive 360°. Drag to look around, and
                tap the markers to learn more.
              </ThemedText>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon="compass"
              title="No tours published yet"
              description="Virtual tours added from the web dashboard will appear here. Pull down to check again."
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
  list: { padding: Spacing.three, gap: Spacing.four },
  emptyList: { flexGrow: 1 },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.42)' },
  column: { gap: Spacing.three },
  intro: {
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: Spacing.one,
    paddingBottom: Spacing.two,
  },
  cardWrap: { flex: 1, gap: Spacing.two },
  card: { gap: Spacing.two },
  imageWrap: { width: '100%', borderRadius: 16, overflow: 'hidden' },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
  },
  badge: {
    position: 'absolute',
    top: Spacing.three,
    left: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  cardInfo: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.three, gap: 4 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardMeta: { fontSize: 12, color: 'rgba(255,255,255,0.85)', flexShrink: 1 },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: 'rgba(255,255,255,0.6)' },
  cardDesc: { fontSize: 13, lineHeight: 19, paddingHorizontal: Spacing.one },
  skelLine: { height: 12, borderRadius: 6, marginLeft: Spacing.one },
});
