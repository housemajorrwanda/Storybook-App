import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { FlatList, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ScreenHeader } from '@/components/ui/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { VIRTUAL_TOURS } from '@/constants/tours';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import type { VirtualTour } from '@/types/tour';

function TourCard({ tour, index }: { tour: VirtualTour; index: number }) {
  const theme = useTheme();
  const router = useRouter();
  const roomCount = tour.scenes.length;

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(350)}>
      <Pressable
        style={({ pressed }) => [styles.card, { opacity: pressed ? 0.9 : 1 }]}
        onPress={() => {
          Haptics.selectionAsync();
          router.push({ pathname: '/virtual-tour/[id]', params: { id: tour.id } });
        }}>
        <View style={[styles.imageWrap, Platform.OS === 'ios' && styles.shadow]}>
          <Image source={{ uri: tour.cover }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.75)']} style={StyleSheet.absoluteFill} pointerEvents="none" />

          {/* 360 badge */}
          <View style={styles.badge}>
            <SymbolView name="view.3d" size={13} tintColor="#fff" />
            <ThemedText style={styles.badgeText}>360° Tour</ThemedText>
          </View>

          {/* Bottom info */}
          <View style={styles.cardInfo}>
            <ThemedText style={styles.cardTitle} numberOfLines={1}>
              {tour.name}
            </ThemedText>
            <View style={styles.cardMetaRow}>
              <SymbolView name="mappin.circle.fill" size={12} tintColor="rgba(255,255,255,0.85)" />
              <ThemedText style={styles.cardMeta} numberOfLines={1}>
                {tour.location}
              </ThemedText>
              <View style={styles.dot} />
              <ThemedText style={styles.cardMeta}>
                {roomCount} {roomCount === 1 ? 'view' : 'views'}
              </ThemedText>
            </View>
          </View>
        </View>

        <ThemedText themeColor="textSecondary" style={styles.cardDesc} numberOfLines={2}>
          {tour.description}
        </ThemedText>
      </Pressable>
    </Animated.View>
  );
}

export default function VirtualTourListScreen() {
  const insets = useSafeAreaInsets();
  const { contentWidth } = useResponsive();

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Virtual Tours" showBack />
      <FlatList
        data={VIRTUAL_TOURS}
        keyExtractor={t => t.id}
        renderItem={({ item, index }) => <TourCard tour={item} index={index} />}
        contentContainerStyle={[
          styles.list,
          { width: contentWidth, alignSelf: 'center', maxWidth: '100%', paddingBottom: insets.bottom + Spacing.six },
        ]}
        ListHeaderComponent={
          <ThemedText themeColor="textSecondary" style={styles.intro}>
            Step inside Rwanda&apos;s memorial sites in immersive 360°. Drag to look around, or move
            your phone to explore.
          </ThemedText>
        }
        showsVerticalScrollIndicator={false}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: Spacing.three, gap: Spacing.four },
  intro: { fontSize: 14, lineHeight: 20, paddingHorizontal: Spacing.one, paddingBottom: Spacing.two },
  card: { gap: Spacing.two },
  imageWrap: { width: '100%', height: 200, borderRadius: 16, overflow: 'hidden' },
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
  cardInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.three,
    gap: 4,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardMeta: { fontSize: 12, color: 'rgba(255,255,255,0.85)' },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: 'rgba(255,255,255,0.6)' },
  cardDesc: { fontSize: 13, lineHeight: 19, paddingHorizontal: Spacing.one },
});
