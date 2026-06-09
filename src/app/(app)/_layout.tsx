import { Redirect, Stack } from "expo-router";

import { useAuth } from "@/lib/auth";

/**
 * Authenticated area. If there's no session, bounce to the auth group.
 * (Gate is stubbed in MI-7 — useAuth() always returns authed; MI-13 makes it real.)
 *
 * Home is the hub; Settings and Charting are pushed on top of it. A bottom tab
 * bar was intentionally avoided so the four Home actions stay the focus.
 */
export default function AppLayout() {
  const { authed } = useAuth();

  if (!authed) {
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
