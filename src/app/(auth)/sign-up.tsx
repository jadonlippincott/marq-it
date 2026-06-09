import { Text, View } from "react-native";

import { Screen } from "@/components/screen";

/**
 * Create Account — PLACEHOLDER for MI-7.
 * Household + first member creation is MI-11; second-spouse onboarding is MI-12.
 */
export default function SignUpScreen() {
  return (
    <Screen>
      <View className="flex-1 justify-center gap-2">
        <Text className="text-center text-lg font-semibold text-gray-900">Create Account</Text>
        <Text className="text-center text-sm text-gray-500">
          Household + husband/wife setup — TODO (MI-11 / MI-12).
        </Text>
      </View>
    </Screen>
  );
}
