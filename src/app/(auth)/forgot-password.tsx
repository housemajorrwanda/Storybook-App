import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';

import { AppButton } from '@/components/ui/app-button';
import { AppInput } from '@/components/ui/app-input';
import { ScreenHeader } from '@/components/ui/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { authService } from '@/services/auth.service';

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await authService.forgotPassword(email.trim());
      setSent(true);
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScreenHeader title="Reset Password" showBack />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.inner}>

            {sent ? (
              <Animated.View entering={FadeInDown.duration(400)} style={styles.successState}>
                <View style={[styles.successIcon, { backgroundColor: theme.secondary }]}>
                  <SymbolView name="checkmark.circle.fill" size={40} tintColor={theme.primary} />
                </View>
                <ThemedText style={styles.successTitle}>Check your email</ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.successDesc}>
                  If an account exists for {email}, we've sent a password reset link. Check your inbox and spam folder.
                </ThemedText>
                <AppButton
                  label="Resend email"
                  onPress={() => { setSent(false); }}
                  variant="outline"
                  size="md"
                />
              </Animated.View>
            ) : (
              <>
                <Animated.View entering={FadeInDown.duration(500).springify()} style={styles.header}>
                  <View style={[styles.iconWrap, { backgroundColor: theme.secondary }]}>
                    <SymbolView name="lock.rotation" size={32} tintColor={theme.primary} />
                  </View>
                  <ThemedText type="subtitle" style={styles.center}>Forgot password?</ThemedText>
                  <ThemedText themeColor="textSecondary" style={styles.center}>
                    Enter your email and we'll send you a reset link.
                  </ThemedText>
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.form}>
                  <AppInput
                    label="Email address"
                    placeholder="you@example.com"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                    returnKeyType="done"
                    iconLeft="envelope"
                    error={error}
                    onSubmitEditing={handleSubmit}
                  />

                  <AppButton
                    label="Send reset link"
                    onPress={handleSubmit}
                    loading={loading}
                    size="lg"
                    iconLeft="paperplane"
                  />
                </Animated.View>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1 },
  inner: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.five,
    maxWidth: 420,
    alignSelf: 'center',
    width: '100%',
    gap: Spacing.five,
  },
  header: { alignItems: 'center', gap: Spacing.three },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { textAlign: 'center' },
  form: { gap: Spacing.three },
  successState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.four },
  successIcon: {
    width: 88,
    height: 88,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: { fontSize: 22, fontWeight: '700', textAlign: 'center' },
  successDesc: { fontSize: 15, lineHeight: 22, textAlign: 'center' },
});
