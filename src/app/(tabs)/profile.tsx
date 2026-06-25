import { SymbolView } from 'expo-symbols';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useTheme } from '@/hooks/use-theme';
import { notificationService } from '@/services/notification.service';

function SettingsRow({
  icon,
  label,
  value,
  onPress,
  destructive = false,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.card, opacity: pressed ? 0.7 : 1 },
      ]}
      onPress={onPress}>
      <View
        style={[
          styles.rowIcon,
          { backgroundColor: destructive ? theme.destructive + '18' : theme.secondary },
        ]}>
        <SymbolView
          name={icon as any}
          size={18}
          tintColor={destructive ? theme.destructive : theme.foreground}
        />
      </View>
      <ThemedText style={[styles.rowLabel, destructive && { color: theme.destructive }]}>
        {label}
      </ThemedText>
      {value ? (
        <ThemedText themeColor="textSecondary" style={styles.rowValue}>
          {value}
        </ThemedText>
      ) : null}
      {!destructive && (
        <SymbolView name="chevron.right" size={14} tintColor={theme.mutedForeground} />
      )}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    notificationService.getUnreadCount().then(setUnreadCount).catch(() => {});
  }, []);

  const initials = user?.fullName
    ?.split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '?';

  function handleSignOut() {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Avatar + name */}
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <ThemedText style={[styles.avatarText, { color: theme.primaryForeground }]}>
              {initials}
            </ThemedText>
          </View>
          <ThemedText style={styles.name}>{user?.fullName}</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.email}>
            {user?.email}
          </ThemedText>
          {user?.residentPlace ? (
            <View style={styles.locationRow}>
              <SymbolView name="mappin.circle" size={13} tintColor={theme.mutedForeground} />
              <ThemedText themeColor="textSecondary" style={styles.location}>
                {user.residentPlace}
              </ThemedText>
            </View>
          ) : null}
        </View>

        {/* My content */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.mutedForeground }]}>
            MY CONTENT
          </ThemedText>
          <View style={[styles.card, { borderColor: theme.border }]}>
            <SettingsRow
              icon="doc.text.fill"
              label="My Submissions"
              onPress={() => router.push('/my-submissions')}
            />
            <View style={[styles.sep, { backgroundColor: theme.border }]} />
            <SettingsRow
              icon="bookmark.fill"
              label="Bookmarks"
              onPress={() => router.push('/bookmarks')}
            />
          </View>
        </View>

        {/* Account */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.mutedForeground }]}>
            ACCOUNT
          </ThemedText>
          <View style={[styles.card, { borderColor: theme.border }]}>
            <SettingsRow
              icon="person.circle"
              label="Edit profile"
              value={user?.fullName?.split(' ')[0]}
              onPress={() => router.push('/my-submissions')}
            />
            <View style={[styles.sep, { backgroundColor: theme.border }]} />
            <SettingsRow
              icon="bell"
              label="Notifications"
              value={unreadCount > 0 ? String(unreadCount) : undefined}
              onPress={() => router.push('/notifications')}
            />
            <View style={[styles.sep, { backgroundColor: theme.border }]} />
            <SettingsRow icon="lock" label="Privacy & security" />
          </View>
        </View>

        {/* More */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.mutedForeground }]}>
            MORE
          </ThemedText>
          <View style={[styles.card, { borderColor: theme.border }]}>
            <SettingsRow icon="questionmark.circle" label="Help & support" />
            <View style={[styles.sep, { backgroundColor: theme.border }]} />
            <SettingsRow icon="info.circle" label="About" />
          </View>
        </View>

        {/* Sign out */}
        <View style={styles.section}>
          <View style={[styles.card, { borderColor: theme.border }]}>
            <SettingsRow
              icon="rectangle.portrait.and.arrow.right"
              label="Sign out"
              onPress={handleSignOut}
              destructive
            />
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.four,
  },
  header: {
    alignItems: 'center',
    paddingTop: Spacing.five,
    paddingBottom: Spacing.three,
    gap: Spacing.two,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12 },
    }),
  },
  avatarText: { fontSize: 34, fontWeight: '700' },
  name: { fontSize: 22, fontWeight: '700' },
  email: { fontSize: 14 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  location: { fontSize: 13 },
  section: { gap: Spacing.two },
  sectionTitle: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, paddingHorizontal: Spacing.two },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 8 },
    }),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.three - 2,
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
  },
  rowIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontSize: 16 },
  rowValue: { fontSize: 14 },
  sep: { height: StyleSheet.hairlineWidth, marginLeft: Spacing.three + 32 + Spacing.three },
});
