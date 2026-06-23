import { SymbolView } from 'expo-symbols';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useTheme } from '@/hooks/use-theme';

function SettingsRow({
  icon,
  label,
  onPress,
  destructive = false,
}: {
  icon: string;
  label: string;
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
      <View style={[styles.rowIcon, { backgroundColor: destructive ? theme.destructive + '18' : theme.secondary }]}>
        <SymbolView
          name={icon as any}
          size={18}
          tintColor={destructive ? theme.destructive : theme.foreground}
        />
      </View>
      <ThemedText
        style={[styles.rowLabel, destructive && { color: theme.destructive }]}>
        {label}
      </ThemedText>
      {!destructive && (
        <SymbolView name="chevron.right" size={14} tintColor={theme.mutedForeground} />
      )}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const theme = useTheme();
  const { user, signOut } = useAuth();

  const initials = user?.fullName
    ?.split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '?';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <ThemedText style={[styles.avatarText, { color: theme.primaryForeground }]}>
              {initials}
            </ThemedText>
          </View>
          <ThemedText type="subtitle">{user?.fullName}</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.email}>
            {user?.email}
          </ThemedText>
        </View>

        {/* Account section */}
        <View style={styles.section}>
          <ThemedText type="small" style={[styles.sectionTitle, { color: theme.mutedForeground }]}>
            ACCOUNT
          </ThemedText>
          <View style={[styles.card, { borderColor: theme.border }]}>
            <SettingsRow icon="person.circle" label="Edit profile" />
            <View style={[styles.separator, { backgroundColor: theme.border }]} />
            <SettingsRow icon="bell" label="Notifications" />
            <View style={[styles.separator, { backgroundColor: theme.border }]} />
            <SettingsRow icon="lock" label="Privacy & security" />
          </View>
        </View>

        {/* More section */}
        <View style={styles.section}>
          <ThemedText type="small" style={[styles.sectionTitle, { color: theme.mutedForeground }]}>
            MORE
          </ThemedText>
          <View style={[styles.card, { borderColor: theme.border }]}>
            <SettingsRow icon="questionmark.circle" label="Help & support" />
            <View style={[styles.separator, { backgroundColor: theme.border }]} />
            <SettingsRow icon="info.circle" label="About" />
          </View>
        </View>

        {/* Sign out */}
        <View style={styles.section}>
          <View style={[styles.card, { borderColor: theme.border }]}>
            <SettingsRow icon="rectangle.portrait.and.arrow.right" label="Sign out" onPress={signOut} destructive />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
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
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  avatarText: { fontSize: 28, fontWeight: '700' },
  email: { fontSize: 14 },
  section: { gap: Spacing.two },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    paddingHorizontal: Spacing.two,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.three - 2,
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { flex: 1, fontSize: 16 },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: Spacing.three + 32 + Spacing.three },
});
