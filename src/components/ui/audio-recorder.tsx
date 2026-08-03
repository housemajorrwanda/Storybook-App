import Feather from '@expo/vector-icons/Feather';
import * as Haptics from 'expo-haptics';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { AppButton } from '@/components/ui/app-button';
import { useToast } from '@/components/ui/toast';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type RecordedAudio = { uri: string; durationSeconds: number; fileName: string };

type Props = {
  value: RecordedAudio | null;
  onChange: (audio: RecordedAudio | null) => void;
};

function clock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function AudioRecorder({ value, onChange }: Props) {
  const theme = useTheme();
  const toast = useToast();

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 250);
  const player = useAudioPlayer(value ? { uri: value.uri } : null);
  const playerStatus = useAudioPlayerStatus(player);

  const [preparing, setPreparing] = useState(false);

  // Pulsing dot while recording — a static red dot reads as "stopped" to many people.
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = recorderState.isRecording
      ? withRepeat(withTiming(0.3, { duration: 700 }), -1, true)
      : withTiming(1, { duration: 150 });
  }, [recorderState.isRecording, pulse]);
  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  async function start() {
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        toast.error('Microphone access is needed to record your testimony.');
        return;
      }

      setPreparing(true);
      // Required on iOS: without this the session stays in playback mode and
      // recording produces a silent file.
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not start recording.');
    } finally {
      setPreparing(false);
    }
  }

  async function stop() {
    try {
      const seconds = Math.round(recorderState.durationMillis / 1000);
      await recorder.stop();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Restore playback mode so the preview is audible through the speaker.
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });

      const uri = recorder.uri;
      if (!uri) {
        toast.error('Recording failed — no audio was captured.');
        return;
      }
      if (seconds < 1) {
        toast.error('That recording was too short.');
        return;
      }
      onChange({ uri, durationSeconds: seconds, fileName: `testimony-${Date.now()}.m4a` });
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not save the recording.');
    }
  }

  function discard() {
    if (playerStatus.playing) player.pause();
    onChange(null);
  }

  // ── Recorded: preview + re-record ──────────────────────────────────────────
  if (value) {
    return (
      <Animated.View
        entering={FadeIn.duration(220)}
        style={[styles.card, { borderColor: theme.border, backgroundColor: theme.card }]}>
        <View style={styles.previewRow}>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              if (playerStatus.playing) {
                player.pause();
              } else {
                player.seekTo(0);
                player.play();
              }
            }}
            style={[styles.playBtn, { backgroundColor: theme.brand }]}
            accessibilityRole="button"
            accessibilityLabel={playerStatus.playing ? 'Pause preview' : 'Play preview'}>
            <Feather
              name={playerStatus.playing ? 'pause' : 'play'}
              size={20}
              color={theme.brandForeground}
            />
          </Pressable>

          <View style={styles.previewBody}>
            <ThemedText style={styles.previewTitle}>Recording ready</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.previewMeta}>
              {clock(value.durationSeconds)} · tap to preview
            </ThemedText>
          </View>

          <Pressable onPress={discard} hitSlop={10} accessibilityLabel="Delete recording">
            <Feather name="trash-2" size={18} color={theme.mutedForeground} />
          </Pressable>
        </View>
      </Animated.View>
    );
  }

  // ── Idle / recording ───────────────────────────────────────────────────────
  return (
    <View style={[styles.card, { borderColor: theme.border, backgroundColor: theme.card }]}>
      <View style={styles.center}>
        {recorderState.isRecording ? (
          <View style={styles.recordingRow}>
            <Animated.View style={[styles.dot, { backgroundColor: theme.brand }, pulseStyle]} />
            <ThemedText style={styles.timer}>
              {clock(recorderState.durationMillis / 1000)}
            </ThemedText>
          </View>
        ) : (
          <>
            <Feather name="mic" size={28} color={theme.mutedForeground} />
            <ThemedText themeColor="textSecondary" style={styles.idleText}>
              Record your testimony in your own voice. You can listen back before submitting.
            </ThemedText>
          </>
        )}
      </View>

      <AppButton
        label={recorderState.isRecording ? 'Stop recording' : 'Start recording'}
        onPress={recorderState.isRecording ? stop : start}
        loading={preparing}
        variant={recorderState.isRecording ? 'outline' : 'primary'}
        iconLeft={recorderState.isRecording ? 'square' : 'mic'}
        size="lg"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: Spacing.four, borderRadius: 16, borderWidth: 1, gap: Spacing.four },
  center: { alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.two },
  idleText: { fontSize: 13, lineHeight: 18, textAlign: 'center', maxWidth: 260 },
  recordingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  dot: { width: 12, height: 12, borderRadius: 6 },
  timer: { fontSize: 30, fontWeight: '700', fontVariant: ['tabular-nums'] },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  playBtn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  previewBody: { flex: 1, gap: 2 },
  previewTitle: { fontSize: 15, fontWeight: '600' },
  previewMeta: { fontSize: 12 },
});
