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
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/app-button';
import { AppInput } from '@/components/ui/app-input';
import { useToast } from '@/components/ui/toast';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useTheme } from '@/hooks/use-theme';

export default function SignUpScreen() {
  const theme = useTheme();
  const toast = useToast();
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
  

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/;

  async function handleSignUp() {
    if (!fullName.trim() || !email.trim() || !password || !confirm) {
      toast.error('Please fill in all fields.');
      return;
    }
    if (password !== confirm) {
      toast.error('Passwords do not match.');
      return;
    }
    if (password.length < 8 || !passwordRegex.test(password)) {
      toast.error('Password must be 8+ characters with uppercase, lowercase, number, and special character (@$!%*?&).');
      return;
    }
    
    setLoading(true);
    try {
      await signUp(fullName.trim(), email.trim(), password);
      toast.success('Account created. Welcome to StoryBook.');
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to create account. Please try again.');
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
              <View style={[styles.logoRing, { borderColor: theme.border, backgroundColor: theme.card }]}>
                <Image
                  source={require('@/assets/images/icon.png')}
                  style={styles.logo}
                  resizeMode="cover"
                />
              </View>
              <ThemedText type="title" style={styles.center}>
                Create account
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={[styles.center, styles.subtitle]}>
                Join StoryBook and help preserve testimonies
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
                iconLeft="user"
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
                iconLeft="mail"
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
                iconRight={showPassword ? 'eye-off' : 'eye'}
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
                iconLeft="lock"
                iconRight={showConfirm ? 'eye-off' : 'eye'}
                onIconRightPress={() => setShowConfirm(v => !v)}
                onSubmitEditing={handleSignUp}
                ref={confirmRef}
              />

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
    maxWidth: 400,
    paddingHorizontal: Spacing.four,
    justifyContent: 'center',
    gap: Spacing.five,
    paddingVertical: Spacing.six,
  },
  brand: { alignItems: 'center', gap: Spacing.two },
  subtitle: { maxWidth: 280, lineHeight: 20, fontSize: 14 },
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
  form: { gap: Spacing.three },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' },
});
