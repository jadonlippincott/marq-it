import * as ExpoLinking from "expo-linking";
import { router } from "expo-router";
import { useEffect, useState } from "react";
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
import { updatePassword } from "@/lib/reset-password";
import { supabase } from "@/lib/supabase";

/**
 * Password recovery screen (MI-28). Reached via the `marqit://reset-password`
 * deep link in the Supabase reset email. The link contains the recovery tokens
 * in the URL fragment (`#access_token=...&refresh_token=...&type=recovery`).
 *
 * Flow:
 *   1. Parse the fragment from the incoming URL via expo-linking.
 *   2. Call setSession() with the tokens — establishes an authenticated session.
 *   3. User enters and confirms a new password.
 *   4. updateUser() sets the password; success redirects to the app root.
 *
 * Placed at the root level (outside (auth) and (app) groups) so neither group's
 * session-redirect guard interferes with the recovery flow.
 */
export default function ResetPasswordScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = insets.top + 44;

  const [sessionReady, setSessionReady] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const url = ExpoLinking.useURL();

  useEffect(() => {
    if (!url) return;

    const hashIndex = url.indexOf("#");
    if (hashIndex === -1) {
      setLinkError("Invalid reset link — no tokens found. Request a new reset email.");
      return;
    }

    const params = new URLSearchParams(url.slice(hashIndex + 1));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const type = params.get("type");

    if (!accessToken || !refreshToken || type !== "recovery") {
      setLinkError("Invalid or expired reset link. Request a new reset email.");
      return;
    }

    supabase.auth
      .setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error: sessionError }) => {
        if (sessionError) {
          setLinkError(sessionError.message);
        } else {
          setSessionReady(true);
        }
      });
  }, [url]);

  const canSubmit =
    sessionReady && password.length >= 6 && password === confirm && !submitting;

  async function onSubmit() {
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const { error: updateError } = await updatePassword(password);
      if (updateError) {
        setError(updateError);
      } else {
        router.replace("/");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  }

  if (linkError) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center gap-4">
          <Text className="text-center text-2xl font-bold text-gray-900">Link expired</Text>
          <Text accessibilityRole="alert" className="text-center text-base text-red-600">
            {linkError}
          </Text>
        </View>
      </Screen>
    );
  }

  if (!sessionReady) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
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
          <Text className="text-center text-2xl font-bold text-gray-900">Set new password</Text>
          <Text className="text-center text-base text-gray-600">
            Choose a new password for your account.
          </Text>

          <View className="gap-1">
            <Text className="text-sm font-medium text-gray-700">New password</Text>
            <TextInput
              accessibilityLabel="New password"
              value={password}
              onChangeText={setPassword}
              placeholder="At least 6 characters"
              secureTextEntry
              autoCapitalize="none"
              className="rounded-xl border border-gray-300 px-4 py-3 text-base text-gray-900"
            />
          </View>

          <View className="gap-1">
            <Text className="text-sm font-medium text-gray-700">Confirm new password</Text>
            <TextInput
              accessibilityLabel="Confirm new password"
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Repeat your new password"
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
            accessibilityLabel="Update password"
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
              <Text className="text-base font-semibold text-white">Update password</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
