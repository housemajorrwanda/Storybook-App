import Feather from '@expo/vector-icons/Feather';
import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/app-button';
import { AppInput } from '@/components/ui/app-input';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useToast } from '@/components/ui/toast';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { authService } from '@/services/auth.service';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit() {
    const address = email.trim();

    if (!address) {
      toast.error('Please enter your email address.');
      return;
    }
    if (!EMAIL_PATTERN.test(address)) {
      toast.error('That email address does not look right.');
      return;
    }

    setLoading(true);
    try {
      await authService.forgotPassword(address);
      setSent(true);
      toast.success('Reset link sent. Check your inbox.');
    } catch (e: any) {
      toast.error(e?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScreenHeader title="Reset password" showBack />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.inner}>
            {sent ? (
              <>
                <Animated.View entering={FadeInDown.duration(500).springify()} style={styles.head}>
                  <View
                    style={[styles.ring, { borderColor: theme.border, backgroundColor: theme.card }]}>
                    <Feather name="check-circle" size={30} color={theme.brand} />
                  </View>
                  <ThemedText type="title" style={styles.center}>
                    Check your email
                  </ThemedText>
                  <ThemedText themeColor="textSecondary" style={[styles.center, styles.body]}>
                    If an account exists for{' '}
                    <ThemedText style={styles.emphasis}>{email.trim()}</ThemedText>, a reset link is
                    on its way. It can take a minute — check your spam folder too.
                  </ThemedText>
                </Animated.View>

                <Animated.View entering={FadeIn.delay(120).duration(400)} style={styles.form}>
                  {/* Genuinely re-requests the link rather than just clearing the form. */}
                  <AppButton
                    label="Resend link"
                    onPress={submit}
                    loading={loading}
                    variant="outline"
                    size="lg"
                    iconLeft="refresh-cw"
                  />
                  <AppButton
                    label="Use a different email"
                    onPress={() => setSent(false)}
                    variant="ghost"
                    size="md"
                  />
                </Animated.View>
              </>
            ) : (
              <>
                <Animated.View entering={FadeInDown.duration(500).springify()} style={styles.head}>
                  <View
                    style={[styles.ring, { borderColor: theme.border, backgroundColor: theme.card }]}>
                    <Feather name="lock" size={28} color={theme.foreground} />
                  </View>
                  <ThemedText type="title" style={styles.center}>
                    Forgot password?
                  </ThemedText>
                  <ThemedText themeColor="textSecondary" style={[styles.center, styles.body]}>
                    Enter the email you signed up with and we&apos;ll send a link to reset it.
                  </ThemedText>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(100).duration(450)} style={styles.form}>
                  <AppInput
                    label="Email"
                    placeholder="you@example.com"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    autoComplete="email"
                    returnKeyType="done"
                    iconLeft="mail"
                    onSubmitEditing={submit}
                  />

                  <AppButton
                    label="Send reset link"
                    onPress={submit}
                    loading={loading}
                    size="lg"
                  />
                </Animated.View>
              </>
            )}

            <Animated.View entering={FadeIn.delay(240).duration(400)} style={styles.footer}>
              <ThemedText themeColor="textSecondary" style={styles.footerText}>
                Remembered it?{' '}
              </ThemedText>
              <Link href="/(auth)/login">
                <ThemedText type="linkPrimary" style={styles.footerText}>
                  Sign in
                </ThemedText>
              </Link>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, alignItems: 'center' },
  inner: {
    flex: 1,
    width: '100%',
    maxWidth: 400,
    paddingHorizontal: Spacing.four,
    justifyContent: 'center',
    gap: Spacing.five,
    paddingVertical: Spacing.six,
  },
  head: { alignItems: 'center', gap: Spacing.two },
  ring: {
    width: 72,
    height: 72,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  center: { textAlign: 'center' },
  body: { maxWidth: 300, lineHeight: 20, fontSize: 14 },
  emphasis: { fontSize: 14, fontWeight: '600' },
  form: { gap: Spacing.three },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' },
  footerText: { fontSize: 14 },
});
