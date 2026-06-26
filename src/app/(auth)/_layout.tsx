import { Redirect, Stack } from "expo-router";

import { useAuth } from "@/lib/auth";

/**
 * Unauthenticated area: sign-in / sign-up / join. A user with an active session
 * is redirected into the app so they can't sit on the auth screens (MI-13).
 */
export default function AuthLayout() {
  const { session, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (session) {
    return <Redirect href="/" />;
  }

  return (
    <Stack>
      <Stack.Screen name="sign-in" options={{ title: "Sign In" }} />
      <Stack.Screen name="sign-up" options={{ title: "Create Account" }} />
      <Stack.Screen name="join" options={{ title: "Join Household" }} />
      <Stack.Screen name="forgot-password" options={{ title: "Forgot Password" }} />
    </Stack>
  );
}
