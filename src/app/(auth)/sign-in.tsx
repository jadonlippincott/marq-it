import { Link } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Screen } from "@/components/screen";
import { signIn } from "@/lib/signin";

/**
 * Sign In (MI-13). Email + password → Supabase. On success the auth gate
 * redirects into the app automatically (session change), so no manual nav.
 */
export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = insets.top + 44;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !submitting;

  async function onSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      const { error: submitError } = await signIn({ email, password });
      if (submitError) {
        setError(submitError);
      }
      // On success the gate navigates; leave submitting until unmount.
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={headerHeight}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, gap: 16, paddingTop: 24, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text className="text-center text-2xl font-bold text-gray-900">Welcome back</Text>

          <View className="gap-1">
            <Text className="text-sm font-medium text-gray-700">Email</Text>
            <TextInput
              accessibilityLabel="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              inputMode="email"
              className="rounded-xl border border-gray-300 px-4 py-3 text-base text-gray-900"
            />
          </View>

          <View className="gap-1">
            <Text className="text-sm font-medium text-gray-700">Password</Text>
            <TextInput
              accessibilityLabel="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Your password"
              secureTextEntry
              autoCapitalize="none"
              className="rounded-xl border border-gray-300 px-4 py-3 text-base text-gray-900"
            />
          </View>

          {error ? (
            <Text accessibilityRole="alert" className="text-center text-sm text-red-600">
              {error}
            </Text>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sign in"
            accessibilityState={{ disabled: !canSubmit }}
            disabled={!canSubmit}
            onPress={onSubmit}
            className={`min-h-12 items-center justify-center rounded-2xl px-4 py-3 ${
              canSubmit ? "bg-blue-600 active:bg-blue-700" : "bg-gray-300"
            }`}
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-base font-semibold text-white">Sign in</Text>
            )}
          </Pressable>

          <Link href="/(auth)/sign-up" className="text-center text-base text-blue-600">
            Create an account →
          </Link>
          <Link href="/(auth)/join" className="text-center text-base text-blue-600">
            Join your spouse&apos;s household →
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
