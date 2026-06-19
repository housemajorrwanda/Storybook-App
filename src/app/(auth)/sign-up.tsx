import { Image } from "expo-image";
import { Link } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useAuth } from "@/context/auth";
import { useTheme } from "@/hooks/use-theme";

export default function SignUpScreen() {
  const theme = useTheme();
  const { signUp } = useAuth();

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState<string | null>(null);

  async function handleSignUp() {
    if (!name.trim() || !email.trim() || !password || !confirm) {
      setError("Please fill in all fields.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await signUp(name.trim(), email.trim(), password);
    } catch {
      setError("Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function inputStyle(field: string) {
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
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.inner}>
            {/* Branding */}
            <Animated.View entering={FadeInDown.duration(500).springify()} style={styles.brand}>
              <Image
                source={require("@/assets/images/expo-logo.png")}
                style={styles.logo}
                contentFit="contain"
              />
              <ThemedText type="subtitle" style={styles.center}>
                Create account
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.center}>
                Join us today. It's free.
              </ThemedText>
            </Animated.View>

            {/* Form */}
            <Animated.View entering={FadeInUp.delay(120).duration(500).springify()} style={styles.form}>
              <View>
                <ThemedText type="small" style={styles.label}>
                  Full name
                </ThemedText>
                <TextInput
                  style={inputStyle("name")}
                  placeholder="John Doe"
                  placeholderTextColor={theme.mutedForeground}
                  value={name}
                  onChangeText={setName}
                  autoComplete="name"
                  returnKeyType="next"
                  onFocus={() => setFocused("name")}
                  onBlur={() => setFocused(null)}
                  onSubmitEditing={() => emailRef.current?.focus()}
                />
              </View>

              <View>
                <ThemedText type="small" style={styles.label}>
                  Email
                </ThemedText>
                <TextInput
                  ref={emailRef}
                  style={inputStyle("email")}
                  placeholder="you@example.com"
                  placeholderTextColor={theme.mutedForeground}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  returnKeyType="next"
                  onFocus={() => setFocused("email")}
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
                  style={inputStyle("password")}
                  placeholder="••••••••"
                  placeholderTextColor={theme.mutedForeground}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete="new-password"
                  returnKeyType="next"
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused(null)}
                  onSubmitEditing={() => confirmRef.current?.focus()}
                />
              </View>

              <View>
                <ThemedText type="small" style={styles.label}>
                  Confirm password
                </ThemedText>
                <TextInput
                  ref={confirmRef}
                  style={inputStyle("confirm")}
                  placeholder="••••••••"
                  placeholderTextColor={theme.mutedForeground}
                  value={confirm}
                  onChangeText={setConfirm}
                  secureTextEntry
                  returnKeyType="done"
                  onFocus={() => setFocused("confirm")}
                  onBlur={() => setFocused(null)}
                  onSubmitEditing={handleSignUp}
                />
              </View>

              {error ? (
                <View
                  style={[
                    styles.errorBox,
                    {
                      backgroundColor: theme.destructive + "18",
                      borderColor: theme.destructive + "40",
                    },
                  ]}
                >
                  <ThemedText
                    style={[styles.errorText, { color: theme.destructive }]}
                  >
                    {error}
                  </ThemedText>
                </View>
              ) : null}

              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  {
                    backgroundColor: theme.primary,
                    opacity: pressed || loading ? 0.8 : 1,
                  },
                ]}
                onPress={handleSignUp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={theme.primaryForeground} />
                ) : (
                  <ThemedText
                    style={[
                      styles.buttonText,
                      { color: theme.primaryForeground },
                    ]}
                  >
                    Create account
                  </ThemedText>
                )}
              </Pressable>
            </Animated.View>

            {/* Footer */}
            <Animated.View entering={FadeInUp.delay(220).duration(400)} style={styles.footer}>
              <ThemedText themeColor="textSecondary">
                Already have an account?{" "}
              </ThemedText>
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
  scroll: { flexGrow: 1, alignItems: "center" },
  inner: {
    flex: 1,
    width: "100%",
    maxWidth: 420,
    paddingHorizontal: Spacing.four,
    justifyContent: "center",
    gap: Spacing.five,
    paddingVertical: Spacing.six,
  },
  brand: { alignItems: "center", gap: Spacing.two },
  logo: { width: 56, height: 56, marginBottom: Spacing.two },
  center: { textAlign: "center" },
  form: { gap: Spacing.three },
  label: { marginBottom: Spacing.one, fontWeight: "500" },
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
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.one,
  },
  buttonText: { fontSize: 16, fontWeight: "600" },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
  },
});
