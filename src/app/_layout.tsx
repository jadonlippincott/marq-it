import "../global.css";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

/**
 * Root layout. Hosts the two route groups:
 *   (auth) — sign-in / sign-up   (unauthenticated)
 *   (app)  — Home / Settings / Charting (authenticated)
 *
 * The auth gate that chooses between them lives in (app)/_layout.tsx, backed by
 * the useAuth() stub (MI-7). Real redirection logic arrives with MI-13.
 */
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(app)" />
          <Stack.Screen name="(auth)" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
