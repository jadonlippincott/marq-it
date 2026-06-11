import { Link, useRouter } from "expo-router";
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
import { joinHouseholdWithInvite } from "@/lib/join";

/**
 * Join a household (MI-12).
 *
 * The second spouse creates their own login and enters the invite code from
 * member #1 to join the existing household as member #2. On success we navigate
 * into the app (reactive auth gate is MI-13).
 */
export default function JoinScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const headerHeight = insets.top + 44;
  const [displayName, setDisplayName] = useState("");
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit =
    displayName.trim().length > 0 &&
    code.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 8 &&
    !submitting;

  async function onSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      const { error: submitError } = await joinHouseholdWithInvite({
        email: email.trim(),
        password,
        displayName,
        code,
      });
      if (submitError) {
        setError(submitError);
        return;
      }
      router.replace("/");
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
          <Text className="text-center text-2xl font-bold text-gray-900">
            Join your household
          </Text>
          <Text className="text-center text-sm text-gray-500">
            Enter the invite code your spouse shared with you.
          </Text>

          <View className="gap-1">
            <Text className="text-sm font-medium text-gray-700">Invite code</Text>
            <TextInput
              accessibilityLabel="Invite code"
              value={code}
              onChangeText={setCode}
              placeholder="e.g. A1B2C3D4"
              autoCapitalize="characters"
              autoCorrect={false}
              className="rounded-xl border border-gray-300 px-4 py-3 text-base tracking-widest text-gray-900"
            />
          </View>

          <View className="gap-1">
            <Text className="text-sm font-medium text-gray-700">Your name</Text>
            <TextInput
              accessibilityLabel="Your name"
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="e.g. Sam"
              className="rounded-xl border border-gray-300 px-4 py-3 text-base text-gray-900"
            />
          </View>

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
              placeholder="At least 8 characters"
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
            accessibilityLabel="Join household"
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
              <Text className="text-base font-semibold text-white">Join household</Text>
            )}
          </Pressable>

          <Link href="/(auth)/sign-up" className="text-center text-base text-blue-600">
            Starting a new household instead? Create one →
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
