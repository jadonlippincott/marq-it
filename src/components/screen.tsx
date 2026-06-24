import { type ReactNode } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Standard safe-area screen wrapper used by the placeholder screens.
 * Styling is intentionally minimal — refined in the UI tickets.
 */
export function Screen({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView className="flex-1 bg-gray-100" edges={["top", "bottom"]}>
      <View className="flex-1 px-6 py-4">{children}</View>
    </SafeAreaView>
  );
}
