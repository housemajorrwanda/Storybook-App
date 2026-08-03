import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/app-button';
import { AppInput } from '@/components/ui/app-input';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useToast } from '@/components/ui/toast';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';

export default function EditProfileScreen() {
  const theme = useTheme();
  const toast = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { contentWidth } = useResponsive();
  const { user, updateProfile } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [residentPlace, setResidentPlace] = useState(user?.residentPlace ?? '');
  const [saving, setSaving] = useState(false);

  const trimmedName = fullName.trim();
  const trimmedPlace = residentPlace.trim();

  // Nothing to save until something actually differs — keeps the button honest.
  const dirty =
    trimmedName !== (user?.fullName ?? '').trim() ||
    trimmedPlace !== (user?.residentPlace ?? '').trim();

  async function save() {
    if (trimmedName.length < 2) {
      toast.error('Your name needs at least 2 characters.');
      return;
    }

    setSaving(true);
    try {
      await updateProfile({ fullName: trimmedName, residentPlace: trimmedPlace });
      toast.success('Profile updated.');
      router.back();
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not save your profile.');
    } finally {
      setSaving(false);
    }
  }

  const layout = {
    width: contentWidth,
    alignSelf: 'center' as const,
    maxWidth: '100%' as const,
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Edit profile" showBack />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            layout,
            { paddingBottom: insets.bottom + Spacing.six },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.duration(360)} style={styles.body}>
            <AppInput
              label="Full name"
              placeholder="Your name"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              iconLeft="user"
              returnKeyType="next"
            />

            <AppInput
              label="Where you live"
              placeholder="e.g. Kigali, Rwanda"
              value={residentPlace}
              onChangeText={setResidentPlace}
              iconLeft="map-pin"
              returnKeyType="done"
              onSubmitEditing={save}
              hint="Optional. Shown on your profile."
            />

            {/* Email is read-only: it identifies the account and changing it
                would need re-verification, which the API does not support. */}
            <View style={[styles.readOnly, { borderColor: theme.border, backgroundColor: theme.card }]}>
              <Feather name="mail" size={16} color={theme.mutedForeground} />
              <View style={styles.readOnlyBody}>
                <ThemedText themeColor="textSecondary" style={styles.readOnlyLabel}>
                  Email
                </ThemedText>
                <ThemedText style={styles.readOnlyValue} numberOfLines={1}>
                  {user?.email ?? '—'}
                </ThemedText>
              </View>
              <Feather name="lock" size={14} color={theme.mutedForeground} />
            </View>

            <AppButton
              label="Save changes"
              onPress={save}
              loading={saving}
              disabled={!dirty}
              size="lg"
            />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.four, paddingTop: Spacing.four },
  body: { gap: Spacing.four },
  readOnly: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: 14,
    borderWidth: 1,
  },
  readOnlyBody: { flex: 1, gap: 2 },
  readOnlyLabel: { fontSize: 12 },
  readOnlyValue: { fontSize: 15 },
});
