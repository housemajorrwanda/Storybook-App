import { Link } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState<'email' | 'password' | null>(null);

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

  function inputStyle(field: 'email' | 'password') {
    return [
      styles.input,
      {
        borderColor: focused === field ? theme.ring : theme.border,
        backgroundColor: theme.card,
        color: theme.foreground,
      },
    ];
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
            <Animated.View entering={FadeInDown.duration(500).springify()} style={styles.brand}>
              <View style={[styles.monogram, { backgroundColor: theme.primary }]}>
                <ThemedText style={[styles.monogramText, { color: theme.primaryForeground }]}>
                  HM
                </ThemedText>
              </View>
              <ThemedText type="subtitle" style={styles.center}>
                Welcome back
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.center}>
                Sign in to HouseMajor.
              </ThemedText>
            </Animated.View>

            {/* Form */}
            <Animated.View entering={FadeInUp.delay(120).duration(500).springify()} style={styles.form}>
              <View>
                <ThemedText type="small" style={styles.label}>
                  Email
                </ThemedText>
                <TextInput
                  style={inputStyle('email')}
                  placeholder="you@example.com"
                  placeholderTextColor={theme.mutedForeground}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  returnKeyType="next"
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused(null)}
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />
              </View>

              <View>
                <ThemedText type="small" style={styles.label}>
                  Password
                </ThemedText>
                <TextInput
                  ref={passwordRef}
                  style={inputStyle('password')}
                  placeholder="••••••••"
                  placeholderTextColor={theme.mutedForeground}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete="current-password"
                  returnKeyType="done"
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused(null)}
                  onSubmitEditing={handleSignIn}
                />
              </View>

              {error ? (
                <View style={[styles.errorBox, { backgroundColor: theme.destructive + '18', borderColor: theme.destructive + '40' }]}>
                  <ThemedText style={[styles.errorText, { color: theme.destructive }]}>
                    {error}
                  </ThemedText>
                </View>
              ) : null}

              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  { backgroundColor: theme.primary, opacity: pressed || loading ? 0.8 : 1 },
                ]}
                onPress={handleSignIn}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator color={theme.primaryForeground} />
                ) : (
                  <ThemedText style={[styles.buttonText, { color: theme.primaryForeground }]}>
                    Sign in
                  </ThemedText>
                )}
              </Pressable>
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
  label: { marginBottom: Spacing.one, fontWeight: '500' },
  input: {
    height: 48,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.two + 4,
  },
  errorText: { fontSize: 14 },
  button: {
    height: 50,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.one,
  },
  buttonText: { fontSize: 16, fontWeight: '600' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
});
