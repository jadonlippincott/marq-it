import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { useAuth } from "@/lib/auth";

/**
 * Authenticated area. While the stored session restores we show a spinner;
 * with no session we bounce to the auth group (MI-13).
 *
 * Home is the hub; Settings and Charting are pushed on top of it. A bottom tab
 * bar was intentionally avoided so the four Home actions stay the focus.
 */
export default function AppLayout() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "MarqIt" }} />
      <Stack.Screen name="settings" options={{ title: "Settings" }} />
      <Stack.Screen name="charting" options={{ title: "Charting" }} />
    </Stack>
  );
}
