import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Testimony } from '@/types/testimony';

const TYPE_META = {
  written: { symbol: 'doc.text', label: 'Written' },
  audio: { symbol: 'waveform', label: 'Audio' },
  video: { symbol: 'video', label: 'Video' },
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}

function formatImpressions(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

type Props = { testimony: Testimony; featured?: boolean };

export function TestimonyCard({ testimony, featured = false }: Props) {
  const theme = useTheme();
  const router = useRouter();
  const meta = TYPE_META[testimony.submissionType];
  const coverImage = testimony.images?.[0]?.imageUrl;
  const authorName =
    testimony.identityPreference === 'anonymous' ? 'Anonymous' : testimony.fullName;
  const excerpt = testimony.fullTestimony
    ? stripHtml(testimony.fullTestimony).slice(0, featured ? 180 : 110)
    : testimony.eventDescription?.slice(0, featured ? 180 : 110) ?? '';

  return (
    <Pressable
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.88 : 1 }]}
      onPress={() => {
        Haptics.selectionAsync();
        router.push({ pathname: '/testimony/[id]', params: { id: testimony.id } });
      }}>
      <ThemedView style={[styles.inner, { borderColor: theme.border }, Platform.OS === 'ios' && styles.shadow]}>
        {/* Cover image */}
        {coverImage ? (
          <View style={[styles.imageWrap, featured && styles.imageWrapFeatured]}>
            <Image
              source={{ uri: coverImage }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={200}
            />
            {/* Bottom gradient so content below is readable */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.55)']}
              style={styles.imageGradient}
              pointerEvents="none"
            />
            {/* Type badge sits on the image bottom-left */}
            <View style={styles.imageFooter}>
              <View style={styles.imageBadge}>
                <SymbolView name={meta.symbol as any} size={11} tintColor="#fff" />
                <ThemedText style={styles.imageBadgeText}>{meta.label}</ThemedText>
              </View>
              <ThemedText style={styles.imageDate}>{formatDate(testimony.createdAt)}</ThemedText>
            </View>
          </View>
        ) : null}

        {/* Content */}
        <View style={[styles.content, !coverImage && styles.contentNoBadge]}>
          {/* Badge row when no image */}
          {!coverImage && (
            <View style={styles.metaRow}>
              <View style={[styles.badge, { backgroundColor: theme.secondary }]}>
                <SymbolView name={meta.symbol as any} size={11} tintColor={theme.mutedForeground} />
                <ThemedText style={[styles.badgeText, { color: theme.mutedForeground }]}>
                  {meta.label}
                </ThemedText>
              </View>
              <ThemedText style={[styles.date, { color: theme.mutedForeground }]}>
                {formatDate(testimony.createdAt)}
              </ThemedText>
            </View>
          )}

          {/* Title */}
          <ThemedText style={[styles.title, featured && styles.titleFeatured]} numberOfLines={featured ? 2 : 2}>
            {testimony.eventTitle}
          </ThemedText>

          {/* Excerpt */}
          {excerpt ? (
            <ThemedText themeColor="textSecondary" style={styles.excerpt} numberOfLines={featured ? 3 : 2}>
              {excerpt}
            </ThemedText>
          ) : null}

          {/* Footer */}
          <View style={styles.footer}>
            <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
              <ThemedText style={[styles.avatarText, { color: theme.primaryForeground }]}>
                {authorName.charAt(0).toUpperCase()}
              </ThemedText>
            </View>
            <ThemedText themeColor="textSecondary" style={styles.footerAuthor} numberOfLines={1}>
              {authorName}
            </ThemedText>
            <View style={styles.footerRight}>
              {testimony.location ? (
                <ThemedText themeColor="textSecondary" style={styles.footerMeta} numberOfLines={1}>
                  {testimony.location.split(',')[0]}
                </ThemedText>
              ) : null}
              <View style={styles.impressionsRow}>
                <SymbolView name="eye" size={12} tintColor={theme.mutedForeground} />
                <ThemedText themeColor="textSecondary" style={styles.footerMeta}>
                  {formatImpressions(testimony.impressions)}
                </ThemedText>
              </View>
            </View>
          </View>
        </View>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: Spacing.three },
  inner: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
  },
  imageWrap: { width: '100%', height: 190, overflow: 'hidden' },
  imageWrapFeatured: { height: 230 },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  imageFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
  },
  imageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  imageBadgeText: { fontSize: 11, fontWeight: '600', color: '#fff' },
  imageDate: { fontSize: 11, color: 'rgba(255,255,255,0.85)' },
  content: { padding: Spacing.three, gap: Spacing.two },
  contentNoBadge: { paddingTop: Spacing.three },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: { fontSize: 11, fontWeight: '500' },
  date: { fontSize: 12 },
  title: { fontSize: 16, fontWeight: '700', lineHeight: 22 },
  titleFeatured: { fontSize: 18, lineHeight: 25 },
  excerpt: { fontSize: 14, lineHeight: 20 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginTop: 2 },
  avatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 10, fontWeight: '700' },
  footerAuthor: { flex: 1, fontSize: 12 },
  footerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  footerMeta: { fontSize: 12 },
  impressionsRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
});
