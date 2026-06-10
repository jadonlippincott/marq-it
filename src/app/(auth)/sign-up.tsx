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
import { type MemberRole, signUpAndCreateHousehold } from "@/lib/signup";

/**
 * Create Account (MI-11).
 *
 * Captures the creator's name + role and their email/password, registers them
 * via Supabase Auth, and bootstraps the household through the
 * create_household_with_member RPC. The second spouse joins later (MI-12).
 *
 * On success we navigate into the app; the reactive auth gate is MI-13, so for
 * now the stubbed gate keeps the app reachable.
 */
const ROLES: { value: MemberRole; label: string }[] = [
  { value: "wife", label: "Wife" },
  { value: "husband", label: "Husband" },
];

export default function SignUpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // Offset for KeyboardAvoidingView = the stack header height above this view
  // (status bar inset + the standard iOS nav bar), so focusing a field lifts it
  // fully above the keyboard.
  const headerHeight = insets.top + 44;
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<MemberRole>("wife");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit =
    displayName.trim().length > 0 && email.trim().length > 0 && password.length >= 8 && !submitting;

  async function onSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      const { error: submitError } = await signUpAndCreateHousehold({
        email: email.trim(),
        password,
        displayName,
        role,
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
            Create your household
          </Text>

          <View className="gap-1">
            <Text className="text-sm font-medium text-gray-700">Your name</Text>
            <TextInput
              accessibilityLabel="Your name"
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="e.g. Jane"
              className="rounded-xl border border-gray-300 px-4 py-3 text-base text-gray-900"
            />
          </View>

          <View className="gap-1">
            <Text className="text-sm font-medium text-gray-700">You are the…</Text>
            <View className="flex-row gap-3">
              {ROLES.map((r) => {
                const selected = role === r.value;
                return (
                  <Pressable
                    key={r.value}
                    accessibilityRole="button"
                    accessibilityLabel={r.label}
                    accessibilityState={{ selected }}
                    onPress={() => setRole(r.value)}
                    className={`flex-1 items-center rounded-xl border px-4 py-3 ${
                      selected ? "border-blue-600 bg-blue-50" : "border-gray-300"
                    }`}
                  >
                    <Text className={selected ? "font-semibold text-blue-700" : "text-gray-700"}>
                      {r.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
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
            accessibilityLabel="Create account"
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
              <Text className="text-base font-semibold text-white">Create account</Text>
            )}
          </Pressable>

          <Link href="/(auth)/sign-in" className="text-center text-base text-blue-600">
            Already have an account? Sign in →
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
