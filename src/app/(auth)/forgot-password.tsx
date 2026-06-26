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
import { requestPasswordReset } from "@/lib/reset-password";

/**
 * Forgot Password screen (MI-28). Accepts an email address and triggers the
 * Supabase password-reset email. On success, shows a "check your inbox" state
 * rather than navigating away, so the user sees confirmation.
 */
export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = insets.top + 44;
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const canSubmit = email.trim().length > 0 && !submitting;

  async function onSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      const { error: submitError } = await requestPasswordReset(email);
      if (submitError) {
        setError(submitError);
      } else {
        setSent(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center gap-4">
          <Text className="text-center text-2xl font-bold text-gray-900">Check your inbox</Text>
          <Text className="text-center text-base text-gray-600">
            We sent a password reset link to {email.trim()}. Tap the link in the email to set a new
            password.
          </Text>
          <Link href="/(auth)/sign-in" className="text-center text-base text-blue-600">
            Back to sign in
          </Link>
        </View>
      </Screen>
    );
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
          <Text className="text-center text-2xl font-bold text-gray-900">Forgot password?</Text>
          <Text className="text-center text-base text-gray-600">
            Enter your email and we&apos;ll send a reset link.
          </Text>

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

          {error ? (
            <Text accessibilityRole="alert" className="text-center text-sm text-red-600">
              {error}
            </Text>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send reset email"
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
              <Text className="text-base font-semibold text-white">Send reset email</Text>
            )}
          </Pressable>

          <Link href="/(auth)/sign-in" className="text-center text-base text-blue-600">
            Back to sign in
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
