import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

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
    ? stripHtml(testimony.fullTestimony).slice(0, featured ? 200 : 120)
    : testimony.eventDescription?.slice(0, featured ? 200 : 120) ?? '';

  return (
    <Pressable
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.92 : 1 }]}
      onPress={() => router.push({ pathname: '/testimony/[id]', params: { id: testimony.id } })}>
      <ThemedView style={[styles.inner, { borderColor: theme.border }]}>
        {/* Cover image */}
        {coverImage && (
          <Image
            source={{ uri: coverImage }}
            style={[styles.image, featured && styles.imageFeatured]}
            contentFit="cover"
            transition={200}
          />
        )}

        {/* Content */}
        <View style={styles.content}>
          {/* Type badge + date */}
          <View style={styles.meta}>
            <View style={[styles.badge, { backgroundColor: theme.secondary }]}>
              <SymbolView
                name={meta.symbol as any}
                size={11}
                tintColor={theme.mutedForeground}
              />
              <ThemedText style={[styles.badgeText, { color: theme.mutedForeground }]}>
                {meta.label}
              </ThemedText>
            </View>
            <ThemedText style={[styles.date, { color: theme.mutedForeground }]}>
              {formatDate(testimony.createdAt)}
            </ThemedText>
          </View>

          {/* Title */}
          <ThemedText
            style={styles.title}
            numberOfLines={featured ? 3 : 2}>
            {testimony.eventTitle}
          </ThemedText>

          {/* Excerpt */}
          {excerpt ? (
            <ThemedText
              themeColor="textSecondary"
              style={styles.excerpt}
              numberOfLines={featured ? 4 : 2}>
              {excerpt}
            </ThemedText>
          ) : null}

          {/* Footer */}
          <View style={styles.footer}>
            {/* Author */}
            <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
              <ThemedText style={[styles.avatarText, { color: theme.primaryForeground }]}>
                {authorName.charAt(0).toUpperCase()}
              </ThemedText>
            </View>
            <ThemedText
              themeColor="textSecondary"
              style={styles.footerText}
              numberOfLines={1}>
              {authorName}
            </ThemedText>

            <View style={styles.footerRight}>
              {testimony.location ? (
                <ThemedText themeColor="textSecondary" style={styles.footerText}>
                  {testimony.location.split(',')[0]}
                </ThemedText>
              ) : null}
              <View style={styles.impressions}>
                <SymbolView name="eye" size={12} tintColor={theme.mutedForeground} />
                <ThemedText themeColor="textSecondary" style={styles.footerText}>
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
    borderRadius: 14,
    overflow: 'hidden',
  },
  image: { width: '100%', height: 180 },
  imageFeatured: { height: 220 },
  content: { padding: Spacing.three, gap: Spacing.two },
  meta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
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
  title: { fontSize: 16, fontWeight: '600', lineHeight: 22 },
  excerpt: { fontSize: 14, lineHeight: 20 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginTop: 2 },
  avatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 10, fontWeight: '700' },
  footerText: { fontSize: 12 },
  footerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginLeft: 'auto' },
  impressions: { flexDirection: 'row', alignItems: 'center', gap: 3 },
});
