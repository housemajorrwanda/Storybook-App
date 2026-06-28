import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';

import { PanoramaViewer } from '@/components/panorama-viewer';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { getTourById } from '@/constants/tours';

export default function VirtualTourViewerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tour = id ? getTourById(id) : undefined;
  const [sceneTitle, setSceneTitle] = useState(tour?.scenes[0]?.title ?? '');

  if (!tour) {
    return (
      <View style={[styles.container, styles.center]}>
        <StatusBar style="light" />
        <ThemedText style={styles.missing}>Tour not found.</ThemedText>
        <Pressable onPress={() => router.back()} style={styles.missingBtn}>
          <ThemedText style={styles.missingBtnText}>Go back</ThemedText>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <PanoramaViewer tour={tour} onSceneChange={setSceneTitle} />

      {/* Top bar overlay */}
      <View style={[styles.topBar, { top: insets.top + 8 }]} pointerEvents="box-none">
        <Pressable style={styles.iconBtn} onPress={() => router.back()} hitSlop={8}>
          <SymbolView name="xmark" size={18} tintColor="#fff" />
        </Pressable>

        <View style={styles.titlePill}>
          <ThemedText style={styles.tourName} numberOfLines={1}>
            {tour.name}
          </ThemedText>
          {sceneTitle ? (
            <Animated.View entering={FadeIn.duration(250)} key={sceneTitle}>
              <ThemedText style={styles.sceneName} numberOfLines={1}>
                {sceneTitle}
              </ThemedText>
            </Animated.View>
          ) : null}
        </View>

        <View style={styles.iconBtnGhost} />
      </View>

      {/* Hint */}
      <View style={[styles.hint, { bottom: insets.bottom + Spacing.four }]} pointerEvents="none">
        <SymbolView name="hand.draw" size={14} tintColor="rgba(255,255,255,0.9)" />
        <ThemedText style={styles.hintText}>Drag to look around · tap markers to move</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { alignItems: 'center', justifyContent: 'center', gap: Spacing.three },
  missing: { color: '#fff', fontSize: 16 },
  missingBtn: { paddingHorizontal: Spacing.four, paddingVertical: Spacing.two, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)' },
  missingBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  topBar: {
    position: 'absolute',
    left: Spacing.three,
    right: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnGhost: { width: 40, height: 40 },
  titlePill: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 20,
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
  },
  tourName: { color: '#fff', fontSize: 13, fontWeight: '700' },
  sceneName: { color: 'rgba(255,255,255,0.8)', fontSize: 11 },
  hint: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    borderRadius: 20,
  },
  hintText: { color: 'rgba(255,255,255,0.9)', fontSize: 12 },
});
