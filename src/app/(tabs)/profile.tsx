import Feather from '@expo/vector-icons/Feather';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/app-button';
import type { IconName } from '@/components/ui/app-input';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import { notificationService } from '@/services/notification.service';
import { formatCount } from '@/utils/format';

type RowProps = {
  icon: IconName;
  label: string;
  /** Trailing text, e.g. a secondary detail. */
  value?: string;
  /** Trailing count rendered as a badge rather than plain text. */
  badge?: number;
  onPress?: () => void;
};

function SettingsRow({ icon, label, value, badge, onPress }: RowProps) {
  const theme = useTheme();
  const interactive = Boolean(onPress);

  return (
    <Pressable
      disabled={!interactive}
      accessibilityRole={interactive ? 'button' : undefined}
      onPress={() => {
        Haptics.selectionAsync();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.card, opacity: pressed ? 0.7 : 1 },
      ]}>
      <Feather
        name={icon}
        size={18}
        color={interactive ? theme.foreground : theme.mutedForeground}
      />

      <ThemedText
        themeColor={interactive ? 'text' : 'textSecondary'}
        style={styles.rowLabel}
        numberOfLines={1}>
        {label}
      </ThemedText>

      {badge && badge > 0 ? (
        <View style={[styles.badge, { backgroundColor: theme.brand }]}>
          <ThemedText style={[styles.badgeText, { color: theme.brandForeground }]}>
            {formatCount(badge)}
          </ThemedText>
        </View>
      ) : value ? (
        <ThemedText themeColor="textSecondary" style={styles.rowValue} numberOfLines={1}>
          {value}
        </ThemedText>
      ) : null}

      {/* A chevron promises navigation, so it only appears when there is one. */}
      {interactive ? (
        <Feather name="chevron-right" size={16} color={theme.mutedForeground} />
      ) : (
        <ThemedText themeColor="textSecondary" style={styles.soon}>
          Soon
        </ThemedText>
      )}
    </Pressable>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={styles.section}>
      <ThemedText themeColor="textSecondary" style={styles.sectionTitle}>
        {title}
      </ThemedText>
      <View style={[styles.card, { borderColor: theme.border }]}>{children}</View>
    </View>
  );
}

function Separator() {
  const theme = useTheme();
  return <View style={[styles.sep, { backgroundColor: theme.border }]} />;
}

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { contentWidth } = useResponsive();
  const { user, signOut } = useAuth();

  const [unreadCount, setUnreadCount] = useState(0);

  // Refetched on focus so the count matches the bell after reading notifications.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      notificationService
        .getUnreadCount()
        .then((n) => active && setUnreadCount(n))
        .catch(() => active && setUnreadCount(0));
      return () => {
        active = false;
      };
    }, []),
  );

  const initials =
    user?.fullName
      ?.split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase() || '?';

  function handleSignOut() {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);
  }

  const layout = {
    width: contentWidth,
    alignSelf: 'center' as const,
    maxWidth: '100%' as const,
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          layout,
          { paddingBottom: insets.bottom + BottomTabInset + Spacing.four },
        ]}
        showsVerticalScrollIndicator={false}>
        {/* Identity */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <View
            style={[styles.avatar, { borderColor: theme.border, backgroundColor: theme.card }]}>
            <ThemedText style={styles.avatarText}>{initials}</ThemedText>
          </View>

          <ThemedText style={styles.name} numberOfLines={1}>
            {user?.fullName ?? 'Your profile'}
          </ThemedText>

          {user?.email ? (
            <ThemedText themeColor="textSecondary" style={styles.email} numberOfLines={1}>
              {user.email}
            </ThemedText>
          ) : null}

          <View style={styles.chips}>
            {user?.role === 'admin' ? (
              <View style={[styles.chip, { borderColor: theme.brand }]}>
                <Feather name="shield" size={11} color={theme.brand} />
                <ThemedText style={[styles.chipText, { color: theme.brand }]}>Admin</ThemedText>
              </View>
            ) : null}
            {user?.residentPlace ? (
              <View style={[styles.chip, { borderColor: theme.border }]}>
                <Feather name="map-pin" size={11} color={theme.mutedForeground} />
                <ThemedText themeColor="textSecondary" style={styles.chipText}>
                  {user.residentPlace}
                </ThemedText>
              </View>
            ) : null}
          </View>
        </Animated.View>

        <Section title="My content">
          <SettingsRow
            icon="file-text"
            label="My submissions"
            onPress={() => router.push('/my-submissions')}
          />
          <Separator />
          <SettingsRow
            icon="bookmark"
            label="Bookmarks"
            onPress={() => router.push('/bookmarks')}
          />
        </Section>

        <Section title="Account">
          <SettingsRow
            icon="bell"
            label="Notifications"
            badge={unreadCount}
            onPress={() => router.push('/notifications')}
          />
          <Separator />
          <SettingsRow
            icon="user"
            label="Edit profile"
            value={user?.residentPlace ?? undefined}
            onPress={() => router.push('/edit-profile')}
          />
          <Separator />
          <SettingsRow icon="lock" label="Privacy & security" />
        </Section>

        <Section title="More">
          <SettingsRow icon="help-circle" label="Help & support" />
          <Separator />
          <SettingsRow icon="info" label="About" />
        </Section>

        {/* Sign out is an action, not a destination — a button, set apart. */}
        <View style={styles.signOut}>
          <AppButton
            label="Sign out"
            onPress={handleSignOut}
            variant="outline"
            iconLeft="log-out"
            size="lg"
          />
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.three, gap: Spacing.five },
  header: { alignItems: 'center', paddingTop: Spacing.five, gap: Spacing.one },
  // Bordered surface rather than a solid fill — a white disc dominated the screen.
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  avatarText: { fontSize: 28, fontWeight: '600', letterSpacing: 1 },
  name: { fontSize: 20, fontWeight: '700' },
  email: { fontSize: 14 },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    maxWidth: 220,
  },
  chipText: { fontSize: 12, flexShrink: 1 },
  section: { gap: Spacing.two },
  sectionTitle: { fontSize: 13, fontWeight: '600', paddingHorizontal: Spacing.two },
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
  },
  rowLabel: { flex: 1, fontSize: 15 },
  rowValue: { fontSize: 14, maxWidth: 140 },
  soon: { fontSize: 11, fontWeight: '500' },
  badge: {
    minWidth: 22,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
  // Aligned to the label, not the card edge — the icon column is 18 + gap.
  sep: { height: StyleSheet.hairlineWidth, marginLeft: Spacing.three + 18 + Spacing.three },
  signOut: { paddingHorizontal: Spacing.one },
});
