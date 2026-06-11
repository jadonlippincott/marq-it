import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { useAuth } from "@/lib/auth";
import { Screen } from "@/components/screen";
import { createHouseholdInvite } from "@/lib/join";

/**
 * Settings — reset-time picker (MI-17), day-boundary logic (MI-18), and
 * protocol selection (MI-19) are still TODO (Settings epic, MI-4).
 *
 * Hosts the "Invite your spouse" action (MI-12) and Sign out (MI-13). Polished
 * layout comes with the Settings epic.
 */
export default function SettingsScreen() {
  const { signOut } = useAuth();
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onInvite() {
    setError(null);
    setLoading(true);
    try {
      const { code: newCode, error: inviteError } = await createHouseholdInvite();
      if (inviteError) {
        setError(inviteError);
        return;
      }
      setCode(newCode);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <View className="flex-1 gap-6 py-4">
        <View className="gap-2">
          <Text className="text-lg font-semibold text-gray-900">Settings</Text>
          <Text className="text-sm text-gray-500">
            Reset time & protocol selection — TODO (MI-17 / MI-18 / MI-19).
          </Text>
        </View>

        <View className="gap-2">
          <Text className="text-base font-semibold text-gray-900">Invite your spouse</Text>
          <Text className="text-sm text-gray-500">
            Generate a single-use code (valid 7 days). Your spouse enters it on the “Join
            household” screen to link their own login to this household.
          </Text>

          {code ? (
            <View className="items-center gap-1 rounded-2xl bg-gray-100 px-4 py-4">
              <Text className="text-xs uppercase tracking-wide text-gray-500">Invite code</Text>
              <Text
                accessibilityLabel="Invite code"
                className="text-2xl font-bold tracking-widest text-gray-900"
              >
                {code}
              </Text>
            </View>
          ) : null}

          {error ? (
            <Text accessibilityRole="alert" className="text-sm text-red-600">
              {error}
            </Text>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Generate invite code"
            disabled={loading}
            onPress={onInvite}
            className={`min-h-12 items-center justify-center rounded-2xl px-4 py-3 ${
              loading ? "bg-gray-300" : "bg-blue-600 active:bg-blue-700"
            }`}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-base font-semibold text-white">
                {code ? "Generate a new code" : "Generate invite code"}
              </Text>
            )}
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign out"
          onPress={() => signOut()}
          className="mt-auto min-h-12 items-center justify-center rounded-2xl border border-gray-300 px-4 py-3 active:bg-gray-100"
        >
          <Text className="text-base font-semibold text-red-600">Sign out</Text>
        </Pressable>
      </View>
    </Screen>
  );
}
