import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { Skeleton } from '@/components/ui/skeleton';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { testimonyService } from '@/services/testimony.service';
import type { Testimony } from '@/types/testimony';

const TYPE_META = {
  written: { symbol: 'doc.text.fill', label: 'Written Testimony' },
  audio: { symbol: 'waveform', label: 'Audio Testimony' },
  video: { symbol: 'video.fill', label: 'Video Testimony' },
};

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s{2,}/g, ' ').trim();
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function TestimonyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [testimony, setTestimony] = useState<Testimony | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarking, setBookmarking] = useState(false);

  useEffect(() => {
    if (!id) return;
    testimonyService
      .getById(Number(id))
      .then(setTestimony)
      .catch(() => setError('Failed to load testimony.'))
      .finally(() => setLoading(false));
  }, [id]);

  async function toggleBookmark() {
    if (!testimony || bookmarking) return;
    setBookmarking(true);
    const wasBookmarked = bookmarked;
    setBookmarked(!wasBookmarked);
    try {
      if (wasBookmarked) {
        await testimonyService.removeBookmark(testimony.id);
      } else {
        await testimonyService.addBookmark(testimony.id);
      }
    } catch {
      setBookmarked(wasBookmarked);
    } finally {
      setBookmarking(false);
    }
  }

  const coverImage = testimony?.images?.[0]?.imageUrl;
  const authorName =
    testimony?.identityPreference === 'anonymous' ? 'Anonymous' : testimony?.fullName ?? '';
  const authorInitials = authorName
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const meta = testimony ? TYPE_META[testimony.submissionType] : null;

  return (
    <ThemedView style={styles.container}>
      {/* Fixed top bar */}
      <View style={[styles.backBar, { paddingTop: insets.top + 8, paddingBottom: 8 }]}>
        <Pressable
          style={[styles.backBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => router.back()}>
          <SymbolView name="chevron.left" size={16} tintColor={theme.foreground} />
          <ThemedText style={styles.backText}>Back</ThemedText>
        </Pressable>

        {testimony && (
          <Pressable
            style={[styles.bookmarkBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={toggleBookmark}
            disabled={bookmarking}>
            <SymbolView
              name={bookmarked ? 'bookmark.fill' : 'bookmark'}
              size={16}
              tintColor={bookmarked ? theme.primary : theme.foreground}
            />
          </Pressable>
        )}
      </View>

      {loading ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          <Skeleton height={300} borderRadius={0} />
          <View style={[styles.skeletonBody, { paddingTop: insets.top + 68 }]}>
            <Skeleton width={100} height={28} borderRadius={20} />
            <Skeleton width="80%" height={28} borderRadius={8} />
            <Skeleton width="55%" height={28} borderRadius={8} />
            <View style={styles.skeletonAuthorRow}>
              <Skeleton width={36} height={36} borderRadius={18} />
              <View style={{ flex: 1, gap: 6 }}>
                <Skeleton width="40%" height={14} borderRadius={6} />
                <Skeleton width="25%" height={12} borderRadius={6} />
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {[80, 110, 72].map((w, i) => <Skeleton key={i} width={w} height={28} borderRadius={14} />)}
            </View>
            <Skeleton height={StyleSheet.hairlineWidth * 2} borderRadius={0} />
            <Skeleton width="35%" height={16} borderRadius={6} />
            {[100, 90, 100, 70, 85].map((p, i) => (
              <Skeleton key={i} width={`${p}%`} height={14} borderRadius={6} />
            ))}
          </View>
        </ScrollView>
      ) : error || !testimony ? (
        <View style={styles.center}>
          <ThemedText themeColor="textSecondary">{error || 'Testimony not found.'}</ThemedText>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.six }}>
          {/* Hero image */}
          {coverImage ? (
            <Animated.View entering={FadeIn.duration(400)} style={{ width }}>
              <Image
                source={{ uri: coverImage }}
                style={[styles.hero, { width }]}
                contentFit="cover"
                transition={300}
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.6)']}
                style={styles.heroOverlay}
                pointerEvents="none"
              />
            </Animated.View>
          ) : (
            <View
              style={[styles.heroPlaceholder, { width, backgroundColor: theme.secondary }]}
            />
          )}

          <Animated.View
            entering={FadeInDown.delay(100).duration(400)}
            style={[styles.body, { paddingTop: insets.top + 60 }]}>
            {/* Type badge */}
            {meta && (
              <View style={[styles.typeBadge, { backgroundColor: theme.secondary }]}>
                <SymbolView name={meta.symbol as any} size={13} tintColor={theme.mutedForeground} />
                <ThemedText style={[styles.typeLabel, { color: theme.mutedForeground }]}>
                  {meta.label}
                </ThemedText>
              </View>
            )}

            {/* Title */}
            <ThemedText style={styles.title}>{testimony.eventTitle}</ThemedText>

            {/* Author row */}
            <View style={styles.authorRow}>
              <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                <ThemedText style={[styles.avatarText, { color: theme.primaryForeground }]}>
                  {authorInitials || '?'}
                </ThemedText>
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.authorName}>{authorName}</ThemedText>
                {testimony.relationToEvent ? (
                  <ThemedText themeColor="textSecondary" style={styles.authorMeta}>
                    {testimony.relationToEvent}
                  </ThemedText>
                ) : null}
              </View>
              <ThemedText themeColor="textSecondary" style={styles.dateMeta}>
                {formatDate(testimony.createdAt)}
              </ThemedText>
            </View>

            {/* Meta chips */}
            <View style={styles.chips}>
              {testimony.location ? (
                <View style={[styles.chip, { backgroundColor: theme.secondary }]}>
                  <SymbolView name="mappin.circle" size={12} tintColor={theme.mutedForeground} />
                  <ThemedText style={[styles.chipText, { color: theme.mutedForeground }]}>
                    {testimony.location}
                  </ThemedText>
                </View>
              ) : null}
              {testimony.dateOfEventFrom ? (
                <View style={[styles.chip, { backgroundColor: theme.secondary }]}>
                  <SymbolView name="calendar" size={12} tintColor={theme.mutedForeground} />
                  <ThemedText style={[styles.chipText, { color: theme.mutedForeground }]}>
                    {formatDate(testimony.dateOfEventFrom)}
                    {testimony.dateOfEventTo ? ` – ${formatDate(testimony.dateOfEventTo)}` : ''}
                  </ThemedText>
                </View>
              ) : null}
              <View style={[styles.chip, { backgroundColor: theme.secondary }]}>
                <SymbolView name="eye" size={12} tintColor={theme.mutedForeground} />
                <ThemedText style={[styles.chipText, { color: theme.mutedForeground }]}>
                  {testimony.impressions.toLocaleString()} views
                </ThemedText>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            {/* Event description */}
            {testimony.eventDescription ? (
              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>About this Event</ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.body16}>
                  {testimony.eventDescription}
                </ThemedText>
              </View>
            ) : null}

            {/* Full written testimony */}
            {testimony.submissionType === 'written' && testimony.fullTestimony ? (
              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>Testimony</ThemedText>
                <ThemedText style={[styles.body16, styles.readingText]}>
                  {stripHtml(testimony.fullTestimony)}
                </ThemedText>
              </View>
            ) : null}

            {/* Audio info */}
            {testimony.submissionType === 'audio' && testimony.audioDuration ? (
              <View style={[styles.mediaCard, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
                <SymbolView name="waveform.circle.fill" size={36} tintColor={theme.primary} />
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.mediaTitle}>Audio Recording</ThemedText>
                  <ThemedText themeColor="textSecondary" style={styles.mediaMeta}>
                    Duration: {formatDuration(testimony.audioDuration)}
                  </ThemedText>
                </View>
              </View>
            ) : null}

            {/* Video info */}
            {testimony.submissionType === 'video' && testimony.videoDuration ? (
              <View style={[styles.mediaCard, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
                <SymbolView name="play.circle.fill" size={36} tintColor={theme.primary} />
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.mediaTitle}>Video Recording</ThemedText>
                  <ThemedText themeColor="textSecondary" style={styles.mediaMeta}>
                    Duration: {formatDuration(testimony.videoDuration)}
                  </ThemedText>
                </View>
              </View>
            ) : null}

            {/* Transcript */}
            {testimony.transcript ? (
              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>Transcript</ThemedText>
                <ThemedText themeColor="textSecondary" style={[styles.body16, { lineHeight: 26 }]}>
                  {testimony.transcript}
                </ThemedText>
              </View>
            ) : null}

            {/* Summary */}
            {testimony.summary ? (
              <View style={[styles.summaryBox, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
                <ThemedText style={styles.sectionTitle}>Summary</ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.body16}>
                  {testimony.summary}
                </ThemedText>
              </View>
            ) : null}

            {/* Relatives mentioned */}
            {testimony.relatives && testimony.relatives.length > 0 ? (
              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>Relatives Mentioned</ThemedText>
                {testimony.relatives.map(r => (
                  <View
                    key={r.id}
                    style={[styles.relativeRow, { borderColor: theme.border }]}>
                    <View>
                      <ThemedText style={styles.relativeName}>{r.personName}</ThemedText>
                      <ThemedText themeColor="textSecondary" style={styles.relativeType}>
                        {r.relativeType.displayName}
                      </ThemedText>
                    </View>
                    {r.notes ? (
                      <ThemedText themeColor="textSecondary" style={styles.relativeNotes}>
                        {r.notes}
                      </ThemedText>
                    ) : null}
                  </View>
                ))}
              </View>
            ) : null}

            {/* Image gallery */}
            {testimony.images.length > 1 ? (
              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>Gallery</ThemedText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.gallery}>
                    {testimony.images.map((img, i) => (
                      <Image
                        key={i}
                        source={{ uri: img.imageUrl }}
                        style={styles.galleryThumb}
                        contentFit="cover"
                        transition={200}
                      />
                    ))}
                  </View>
                </ScrollView>
              </View>
            ) : null}
          </Animated.View>
        </ScrollView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: Spacing.four,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  backText: { fontSize: 14, fontWeight: '500' },
  bookmarkBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { height: 300 },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 140,
  },
  skeletonBody: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  skeletonAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  heroPlaceholder: { height: 200 },
  body: { padding: Spacing.four, gap: Spacing.three },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: 20,
  },
  typeLabel: { fontSize: 12, fontWeight: '500' },
  title: { fontSize: 24, fontWeight: '700', lineHeight: 32 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 14, fontWeight: '700' },
  authorName: { fontSize: 14, fontWeight: '600' },
  authorMeta: { fontSize: 12 },
  dateMeta: { fontSize: 12, flexShrink: 0 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  chipText: { fontSize: 12 },
  divider: { height: StyleSheet.hairlineWidth },
  section: { gap: Spacing.two },
  sectionTitle: { fontSize: 15, fontWeight: '600' },
  body16: { fontSize: 15, lineHeight: 24 },
  readingText: { fontSize: 16, lineHeight: 30, letterSpacing: 0.1 },
  mediaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
  },
  mediaTitle: { fontSize: 15, fontWeight: '600' },
  mediaMeta: { fontSize: 13 },
  summaryBox: {
    padding: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
    gap: Spacing.two,
  },
  relativeRow: {
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  relativeName: { fontSize: 14, fontWeight: '600' },
  relativeType: { fontSize: 12 },
  relativeNotes: { fontSize: 13 },
  gallery: { flexDirection: 'row', gap: Spacing.two, paddingBottom: 4 },
  galleryThumb: { width: 140, height: 100, borderRadius: 10 },
});
