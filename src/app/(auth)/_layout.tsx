import { Stack } from "expo-router";

/** Unauthenticated area: sign-in / sign-up. Screens are placeholders (MI-7). */
export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen name="sign-in" options={{ title: "Sign In" }} />
      <Stack.Screen name="sign-up" options={{ title: "Create Account" }} />
    </Stack>
  );
}
