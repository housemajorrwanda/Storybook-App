import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Link } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/app-button';
import { AppInput } from '@/components/ui/app-input';
import { GoogleIcon } from '@/components/ui/google-icon';
import { useToast } from '@/components/ui/toast';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useTheme } from '@/hooks/use-theme';
import { authService } from '@/services/auth.service';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const theme = useTheme();
  const toast = useToast();
  const { signIn, signInWithToken } = useAuth();
  const passwordRef = useRef<TextInput>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSignIn() {
    if (!email.trim() || !password) {
      toast.error('Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      toast.success('Welcome back.');
    } catch (e: any) {
      toast.error(e?.message ?? 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    try {
      // `makeRedirectUri` resolves to exp://<lan-ip> inside Expo Go and to the
      // app's own scheme in a build, so the same code path serves both.
      const redirectUri = makeRedirectUri({ scheme: 'storybookapp', path: 'auth' });

      const result = await WebBrowser.openAuthSessionAsync(
        authService.googleAuthUrl(redirectUri),
        redirectUri,
      );

      if (result.type !== 'success') {
        // 'cancel' and 'dismiss' are the user backing out — not failures.
        return;
      }

      const params = new URL(result.url).searchParams;
      const errorMessage = params.get('error');
      if (errorMessage) {
        toast.error(decodeURIComponent(errorMessage));
        return;
      }

      const token = params.get('token');
      if (!token) {
        toast.error('Google sign-in did not return a token.');
        return;
      }

      await signInWithToken(token);
      toast.success('Signed in with Google.');
    } catch (e: any) {
      toast.error(e?.message ?? 'Google sign-in failed. Try again.');
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.inner}>
            {/* Branding */}
            <Animated.View entering={FadeInDown.duration(600).springify()} style={styles.brand}>
              <View
                style={[styles.logoRing, { borderColor: theme.border, backgroundColor: theme.card }]}>
                <Image
                  source={require('@/assets/images/icon.png')}
                  style={styles.logo}
                  resizeMode="cover"
                />
              </View>
              <ThemedText type="title" style={styles.center}>
                Welcome back
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={[styles.center, styles.subtitle]}>
                Sign in to continue preserving testimonies
              </ThemedText>
            </Animated.View>

            {/* Form */}
            <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.form}>
              <AppInput
                label="Email"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                returnKeyType="next"
                iconLeft="mail"
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
                iconRight={showPassword ? 'eye-off' : 'eye'}
                onIconRightPress={() => setShowPassword((v) => !v)}
                onSubmitEditing={handleSignIn}
                ref={passwordRef}
              />

              <Link href="/(auth)/forgot-password" style={styles.forgotLink}>
                <ThemedText themeColor="textSecondary" style={styles.forgotText}>
                  Forgot password?
                </ThemedText>
              </Link>

              <AppButton label="Sign in" onPress={handleSignIn} loading={loading} size="lg" />
            </Animated.View>

            {/* Alternate sign-in */}
            <Animated.View entering={FadeIn.delay(220).duration(400)} style={styles.alt}>
              <View style={styles.dividerRow}>
                <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
                <ThemedText themeColor="textSecondary" style={styles.dividerText}>
                  or
                </ThemedText>
                <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
              </View>

              <AppButton
                label="Continue with Google"
                onPress={handleGoogleSignIn}
                loading={googleLoading}
                variant="outline"
                size="lg"
                iconNode={<GoogleIcon size={18} />}
              />
            </Animated.View>

            {/* Footer */}
            <Animated.View entering={FadeIn.delay(320).duration(400)} style={styles.footer}>
              <ThemedText themeColor="textSecondary" style={styles.footerText}>
                Don&apos;t have an account?{' '}
              </ThemedText>
              <Link href="/(auth)/sign-up">
                <ThemedText type="linkPrimary" style={styles.footerText}>
                  Sign up
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
  brand: { alignItems: 'center', gap: Spacing.two },
  logoRing: {
    width: 72,
    height: 72,
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  logo: { width: '100%', height: '100%' },
  center: { textAlign: 'center' },
  subtitle: { maxWidth: 280, lineHeight: 20, fontSize: 14 },
  form: { gap: Spacing.three },
  forgotLink: { alignSelf: 'flex-end', marginTop: -Spacing.one },
  forgotText: { fontSize: 13 },
  alt: { gap: Spacing.three },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth },
  dividerText: { fontSize: 12 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' },
  footerText: { fontSize: 14 },
});
