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

export default function SignUpScreen() {
  const theme = useTheme();
  const { signUp } = useAuth();

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/;

  async function handleSignUp() {
    if (!fullName.trim() || !email.trim() || !password || !confirm) {
      setError('Please fill in all fields.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8 || !passwordRegex.test(password)) {
      setError('Password must be 8+ characters with uppercase, lowercase, number, and special character (@$!%*?&).');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await signUp(fullName.trim(), email.trim(), password);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to create account. Please try again.');
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
              <ThemedText type="subtitle" style={styles.center}>Create account</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.center}>
                Join HouseMajor. It's free.
              </ThemedText>
            </Animated.View>

            {/* Form */}
            <Animated.View entering={FadeInUp.delay(120).duration(500).springify()} style={styles.form}>
              <AppInput
                label="Full name"
                placeholder="John Doe"
                value={fullName}
                onChangeText={setFullName}
                autoComplete="name"
                autoCapitalize="words"
                returnKeyType="next"
                iconLeft="person"
                onSubmitEditing={() => emailRef.current?.focus()}
              />

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
                ref={emailRef}
              />

              <AppInput
                label="Password"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete="new-password"
                returnKeyType="next"
                iconLeft="lock"
                iconRight={showPassword ? 'eye.slash' : 'eye'}
                onIconRightPress={() => setShowPassword(v => !v)}
                hint="8+ chars, uppercase, lowercase, number, special char"
                onSubmitEditing={() => confirmRef.current?.focus()}
                ref={passwordRef}
              />

              <AppInput
                label="Confirm password"
                placeholder="••••••••"
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry={!showConfirm}
                returnKeyType="done"
                iconLeft="lock.fill"
                iconRight={showConfirm ? 'eye.slash' : 'eye'}
                onIconRightPress={() => setShowConfirm(v => !v)}
                onSubmitEditing={handleSignUp}
                ref={confirmRef}
              />

              {error ? (
                <View style={[styles.errorBox, { backgroundColor: theme.destructive + '18', borderColor: theme.destructive + '40' }]}>
                  <ThemedText style={{ color: theme.destructive, fontSize: 14 }}>{error}</ThemedText>
                </View>
              ) : null}

              <AppButton label="Create account" onPress={handleSignUp} loading={loading} size="lg" />
            </Animated.View>

            {/* Footer */}
            <Animated.View entering={FadeInUp.delay(220).duration(400)} style={styles.footer}>
              <ThemedText themeColor="textSecondary">Already have an account? </ThemedText>
              <Link href="/(auth)/login">
                <ThemedText type="linkPrimary">Sign in</ThemedText>
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
  errorBox: { borderWidth: 1, borderRadius: 8, padding: Spacing.two + 4 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' },
});
