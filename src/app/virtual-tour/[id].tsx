import Feather from '@expo/vector-icons/Feather';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PanoramaViewer } from '@/components/panorama-viewer';
import { AppButton } from '@/components/ui/app-button';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAsync } from '@/hooks/use-async';
import { useResponsive } from '@/hooks/use-responsive';
import { tourService } from '@/services/tour.service';
import type { VirtualTourHotspot } from '@/types/tour';

export default function VirtualTourViewerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isTablet } = useResponsive();

  const tourId = Number(id);
  const {
    data: tour,
    loading,
    error,
    retry,
  } = useAsync(useCallback(() => tourService.getTourById(tourId), [tourId]), [tourId]);

  const [hotspot, setHotspot] = useState<VirtualTourHotspot | null>(null);
  const [chromeVisible, setChromeVisible] = useState(true);

  // Counted once the tour actually resolves, so a failed load isn't a view.
  useEffect(() => {
    if (tour) tourService.incrementViewCount(tour.id);
  }, [tour]);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <StatusBar style="light" />
        <ActivityIndicator color="#fff" />
        <ThemedText style={styles.notice}>Loading tour…</ThemedText>
      </View>
    );
  }

  if (error || !tour) {
    return (
      <View style={[styles.container, styles.center, styles.errorPad]}>
        <StatusBar style="light" />
        <Feather name="alert-circle" size={30} color="rgba(255,255,255,0.7)" />
        <ThemedText style={styles.notice}>{error ?? 'This tour could not be found.'}</ThemedText>
        <View style={styles.errorActions}>
          <AppButton label="Try again" onPress={retry} variant="outline" />
          <AppButton label="Go back" onPress={() => router.back()} variant="ghost" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Tapping the panorama toggles the overlays so the view can go full-bleed. */}
      <Pressable style={styles.flex} onPress={() => setChromeVisible((v) => !v)}>
        <PanoramaViewer
          tour={tour}
          onHotspotPress={(h) => {
            Haptics.selectionAsync();
            setHotspot(h);
          }}
        />
      </Pressable>

      {chromeVisible ? (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={[styles.topBar, { top: insets.top + Spacing.two }]}
          pointerEvents="box-none">
          <Pressable style={styles.iconBtn} onPress={() => router.back()} hitSlop={10}>
            <Feather name="x" size={18} color="#fff" />
          </Pressable>

          <View style={styles.titlePill}>
            <ThemedText style={styles.titleText} numberOfLines={1}>
              {tour.title}
            </ThemedText>
            {tour.location ? (
              <ThemedText style={styles.subText} numberOfLines={1}>
                {tour.location}
              </ThemedText>
            ) : null}
          </View>
        </Animated.View>
      ) : null}

      {chromeVisible && !hotspot ? (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={[styles.hint, { bottom: insets.bottom + Spacing.four }]}
          pointerEvents="none">
          <Feather name="move" size={13} color="rgba(255,255,255,0.85)" />
          <ThemedText style={styles.hintText}>
            {tour.hotspots?.length ? 'Drag to look around · tap a marker' : 'Drag to look around'}
          </ThemedText>
        </Animated.View>
      ) : null}

      {/* Hotspot detail — a native sheet rather than a WebView tooltip. */}
      {hotspot ? (
        <Animated.View
          entering={FadeInDown.springify().damping(20)}
          exiting={FadeOut.duration(180)}
          style={[
            styles.sheet,
            {
              paddingBottom: insets.bottom + Spacing.four,
              width: isTablet ? 460 : '100%',
              alignSelf: isTablet ? 'center' : 'stretch',
            },
          ]}>
          <View style={styles.sheetHandle} />
          <ScrollView contentContainerStyle={styles.sheetBody} showsVerticalScrollIndicator={false}>
            <ThemedText style={styles.sheetTitle}>
              {hotspot.title ?? 'Point of interest'}
            </ThemedText>
            {hotspot.description ? (
              <ThemedText style={styles.sheetDesc}>{hotspot.description}</ThemedText>
            ) : null}
          </ScrollView>
          <AppButton label="Close" onPress={() => setHotspot(null)} variant="outline" />
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  flex: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center', gap: Spacing.three },
  errorPad: { padding: Spacing.four },
  notice: { color: '#fff', fontSize: 15, textAlign: 'center', lineHeight: 21 },
  errorActions: { alignSelf: 'stretch', maxWidth: 260, gap: Spacing.two },
  topBar: {
    position: 'absolute',
    left: Spacing.three,
    right: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titlePill: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 19,
    paddingHorizontal: Spacing.three,
    paddingVertical: 7,
  },
  titleText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  subText: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
  hint: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: Spacing.three,
    paddingVertical: 7,
    borderRadius: 20,
  },
  hintText: { color: 'rgba(255,255,255,0.85)', fontSize: 12 },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '55%',
    backgroundColor: 'rgba(18,18,18,0.98)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    gap: Spacing.three,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignSelf: 'center',
    marginBottom: Spacing.two,
  },
  sheetBody: { gap: Spacing.two, paddingBottom: Spacing.two },
  sheetTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  sheetDesc: { color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 21 },
});
