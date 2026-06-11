import { Stack } from "expo-router";

/** Unauthenticated area: sign-in / sign-up / join. */
export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen name="sign-in" options={{ title: "Sign In" }} />
      <Stack.Screen name="sign-up" options={{ title: "Create Account" }} />
      <Stack.Screen name="join" options={{ title: "Join Household" }} />
    </Stack>
  );
}
