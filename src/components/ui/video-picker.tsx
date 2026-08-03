import Feather from '@expo/vector-icons/Feather';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { AppButton } from '@/components/ui/app-button';
import { useToast } from '@/components/ui/toast';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type PickedVideo = { uri: string; durationSeconds: number; fileName: string };

type Props = {
  value: PickedVideo | null;
  onChange: (video: PickedVideo | null) => void;
  /** Cap in seconds; the OS enforces it during capture. */
  maxDurationSeconds?: number;
};

function clock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Records or picks a video.
 *
 * Uses the system camera and library UI rather than a custom `expo-camera`
 * surface: the OS handles permissions, orientation, codecs and the record
 * button identically on iOS and Android, which is far more reliable than
 * reimplementing capture per platform.
 */
export function VideoPicker({ value, onChange, maxDurationSeconds = 900 }: Props) {
  const theme = useTheme();
  const toast = useToast();

  const player = useVideoPlayer(value ? { uri: value.uri } : null, (p) => {
    p.loop = false;
  });

  function accept(result: ImagePicker.ImagePickerResult) {
    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    const seconds = asset.duration ? Math.round(asset.duration / 1000) : 0;

    if (seconds > 0 && seconds < 2) {
      toast.error('That video is too short.');
      return;
    }

    onChange({
      uri: asset.uri,
      durationSeconds: seconds,
      fileName: asset.fileName ?? `testimony-${Date.now()}.mp4`,
    });
  }

  async function record() {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        toast.error('Camera access is needed to record your testimony.');
        return;
      }
      Haptics.selectionAsync();
      accept(
        await ImagePicker.launchCameraAsync({
          mediaTypes: ['videos'],
          videoMaxDuration: maxDurationSeconds,
          quality: 1,
        }),
      );
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not open the camera.');
    }
  }

  async function choose() {
    try {
      // The library picker needs no permission prompt on modern iOS/Android.
      Haptics.selectionAsync();
      accept(
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['videos'],
          quality: 1,
        }),
      );
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not open your library.');
    }
  }

  if (value) {
    return (
      <Animated.View
        entering={FadeIn.duration(220)}
        style={[styles.card, { borderColor: theme.border, backgroundColor: theme.card }]}>
        <View style={styles.previewWrap}>
          <VideoView
            player={player}
            style={styles.video}
            nativeControls
            contentFit="contain"
            allowsFullscreen
          />
        </View>

        <View style={styles.previewRow}>
          <View style={styles.previewBody}>
            <ThemedText style={styles.previewTitle} numberOfLines={1}>
              {value.fileName}
            </ThemedText>
            {value.durationSeconds > 0 ? (
              <ThemedText themeColor="textSecondary" style={styles.previewMeta}>
                {clock(value.durationSeconds)}
              </ThemedText>
            ) : null}
          </View>
          <Pressable onPress={() => onChange(null)} hitSlop={10} accessibilityLabel="Remove video">
            <Feather name="trash-2" size={18} color={theme.mutedForeground} />
          </Pressable>
        </View>
      </Animated.View>
    );
  }

  return (
    <View style={[styles.card, { borderColor: theme.border, backgroundColor: theme.card }]}>
      <View style={styles.center}>
        <Feather name="video" size={28} color={theme.mutedForeground} />
        <ThemedText themeColor="textSecondary" style={styles.idleText}>
          Record a video testimony, or choose one you have already filmed.
        </ThemedText>
      </View>

      <View style={styles.actions}>
        <AppButton label="Record" onPress={record} iconLeft="video" size="lg" />
        <AppButton label="Choose from library" onPress={choose} variant="outline" iconLeft="folder" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: Spacing.four, borderRadius: 16, borderWidth: 1, gap: Spacing.four },
  center: { alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.two },
  idleText: { fontSize: 13, lineHeight: 18, textAlign: 'center', maxWidth: 260 },
  actions: { gap: Spacing.two },
  previewWrap: { borderRadius: 12, overflow: 'hidden', backgroundColor: '#000' },
  video: { width: '100%', aspectRatio: 16 / 9 },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  previewBody: { flex: 1, gap: 2 },
  previewTitle: { fontSize: 14, fontWeight: '600' },
  previewMeta: { fontSize: 12 },
});
