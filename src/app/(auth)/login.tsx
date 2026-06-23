import { Link } from 'expo-router';
import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/app-button';
import { AppInput } from '@/components/ui/app-input';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useTheme } from '@/hooks/use-theme';

export default function LoginScreen() {
  const theme = useTheme();
  const { signIn } = useAuth();
  const passwordRef = useRef<TextInput>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSignIn() {
    if (!email.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (e: any) {
      setError(e?.message ?? 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.inner}>

            {/* Branding */}
            <Animated.View entering={FadeInDown.duration(500).springify()} style={styles.brand}>
              <View style={[styles.monogram, { backgroundColor: theme.primary }]}>
                <ThemedText style={[styles.monogramText, { color: theme.primaryForeground }]}>
                  HM
                </ThemedText>
              </View>
              <ThemedText type="subtitle" style={styles.center}>Welcome back</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.center}>
                Sign in to HouseMajor.
              </ThemedText>
            </Animated.View>

            {/* Form */}
            <Animated.View entering={FadeInUp.delay(120).duration(500).springify()} style={styles.form}>
              <AppInput
                label="Email"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                returnKeyType="next"
                iconLeft="envelope"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />

              <AppInput
                label="Password"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete="current-password"
                returnKeyType="done"
                iconLeft="lock"
                iconRight={showPassword ? 'eye.slash' : 'eye'}
                onIconRightPress={() => setShowPassword(v => !v)}
                onSubmitEditing={handleSignIn}
                ref={passwordRef}
              />

              {error ? (
                <View style={[styles.errorBox, { backgroundColor: theme.destructive + '18', borderColor: theme.destructive + '40' }]}>
                  <ThemedText style={{ color: theme.destructive, fontSize: 14 }}>{error}</ThemedText>
                </View>
              ) : null}

              <Link href="/(auth)/forgot-password" style={{ alignSelf: 'flex-end' }}>
                <ThemedText type="linkPrimary" style={styles.forgotText}>Forgot password?</ThemedText>
              </Link>

              <AppButton label="Sign in" onPress={handleSignIn} loading={loading} size="lg" />
            </Animated.View>

            {/* Footer */}
            <Animated.View entering={FadeInUp.delay(220).duration(400)} style={styles.footer}>
              <ThemedText themeColor="textSecondary">Don't have an account? </ThemedText>
              <Link href="/(auth)/sign-up">
                <ThemedText type="linkPrimary">Sign up</ThemedText>
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
    maxWidth: 420,
    paddingHorizontal: Spacing.four,
    justifyContent: 'center',
    gap: Spacing.five,
    paddingVertical: Spacing.six,
  },
  brand: { alignItems: 'center', gap: Spacing.two },
  monogram: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  monogramText: { fontSize: 22, fontWeight: '700', letterSpacing: 1 },
  center: { textAlign: 'center' },
  form: { gap: Spacing.three },
  forgotText: { fontSize: 13 },
  errorBox: { borderWidth: 1, borderRadius: 8, padding: Spacing.two + 4 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' },
});
