import "../global.css";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider } from "@/lib/auth";

/**
 * Root layout. Hosts the two route groups:
 *   (auth) — sign-in / sign-up / join   (unauthenticated)
 *   (app)  — Home / Settings / Charting (authenticated)
 *
 * AuthProvider supplies the real Supabase session (MI-13); each group's
 * _layout redirects based on it.
 */
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(app)" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="reset-password" options={{ headerShown: true, title: "Set New Password" }} />
          </Stack>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
