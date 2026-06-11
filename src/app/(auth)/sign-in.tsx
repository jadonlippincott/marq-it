import { Link } from "expo-router";
import { Text, View } from "react-native";

import { Screen } from "@/components/screen";

/**
 * Sign In — PLACEHOLDER for MI-7.
 * Real authentication (session, secure storage, protected routing) is MI-13.
 */
export default function SignInScreen() {
  return (
    <Screen>
      <View className="flex-1 justify-center gap-2">
        <Text className="text-center text-lg font-semibold text-gray-900">Sign In</Text>
        <Text className="text-center text-sm text-gray-500">TODO (MI-13).</Text>
        <Link href="/(auth)/sign-up" className="text-center text-base text-blue-600">
          Create an account →
        </Link>
        <Link href="/(auth)/join" className="text-center text-base text-blue-600">
          Join your spouse&apos;s household →
        </Link>
      </View>
    </Screen>
  );
}
