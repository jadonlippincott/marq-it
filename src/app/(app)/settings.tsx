import { useState } from "react";
import { ActivityIndicator, Modal, Pressable, Text, View } from "react-native";

import { PROTOCOL_META } from "@/components/charting/protocol-view";
import { Screen } from "@/components/screen";
import { useHouseholdSettings } from "@/hooks/use-household-settings";
import { useAuth } from "@/lib/auth";
import type { Protocol } from "@/lib/chart-data";
import { createHouseholdInvite } from "@/lib/join";

function formatResetTime(resetTime: string): string {
  const [h, m] = resetTime.split(":").map(Number);
  const period = (h ?? 0) >= 12 ? "PM" : "AM";
  const hour12 = (h ?? 0) % 12 === 0 ? 12 : (h ?? 0) % 12;
  return `${hour12}:${String(m ?? 0).padStart(2, "0")} ${period}`;
}

function toResetTimeString(hour: number, minute: number): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
}

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const { loading, saving, error: settingsError, settings, updateResetTime, updateProtocol } =
    useHouseholdSettings();

  const [code, setCode] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);

  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerHour, setPickerHour] = useState(4);
  const [pickerMinute, setPickerMinute] = useState(0);

  function openPicker() {
    const [h, m] = (settings?.resetTime ?? "04:00:00").split(":").map(Number);
    setPickerHour(h ?? 4);
    // Round to nearest 5-minute mark so the ×5 stepper stays aligned.
    setPickerMinute(Math.round((m ?? 0) / 5) * 5 % 60);
    setPickerVisible(true);
  }

  async function onSaveResetTime() {
    await updateResetTime(toResetTimeString(pickerHour, pickerMinute));
    setPickerVisible(false);
  }

  async function onInvite() {
    setInviteError(null);
    setInviteLoading(true);
    try {
      const { code: newCode, error } = await createHouseholdInvite();
      if (error) {
        setInviteError(error);
        return;
      }
      setCode(newCode);
    } catch (e) {
      setInviteError(e instanceof Error ? e.message : String(e));
    } finally {
      setInviteLoading(false);
    }
  }

  return (
    <Screen>
      <View className="flex-1 gap-6 py-4">
        <Text className="text-lg font-semibold text-gray-900">Settings</Text>

        {/* Reset time */}
        <View className="gap-3">
          <Text className="text-base font-semibold text-gray-900">Daily reset time</Text>
          <Text className="text-sm text-gray-500">
            A new charting day begins at this time. Applies to both spouses.
          </Text>

          {loading ? (
            <ActivityIndicator />
          ) : (
            <View className="flex-row items-center justify-between rounded-2xl bg-gray-100 px-4 py-3">
              <Text className="text-2xl font-bold text-gray-900">
                {formatResetTime(settings?.resetTime ?? "04:00:00")}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Change reset time"
                onPress={openPicker}
                className="rounded-xl bg-blue-600 px-4 py-2 active:bg-blue-700"
              >
                <Text className="text-sm font-semibold text-white">Change</Text>
              </Pressable>
            </View>
          )}

          {settingsError ? (
            <Text accessibilityRole="alert" className="text-sm text-red-600">
              {settingsError}
            </Text>
          ) : null}
        </View>

        {/* Protocol selection */}
        <View className="gap-3">
          <Text className="text-base font-semibold text-gray-900">Charting protocol</Text>
          <Text className="text-sm text-gray-500">
            Choose how fertility is charted. Only Nursing Mother is available now.
          </Text>
          {loading ? (
            <ActivityIndicator />
          ) : (
            <View className="overflow-hidden rounded-2xl bg-gray-100">
              {(Object.keys(PROTOCOL_META) as Protocol[]).map((key, index) => {
                const meta = PROTOCOL_META[key];
                const isSelected = (settings?.protocol ?? "nursing_mother") === key;
                const isLast = index === Object.keys(PROTOCOL_META).length - 1;
                return (
                  <Pressable
                    key={key}
                    accessibilityRole="radio"
                    accessibilityLabel={meta.label}
                    accessibilityState={{ selected: isSelected, disabled: !meta.supported }}
                    disabled={!meta.supported || saving}
                    onPress={() => updateProtocol(key)}
                    className={`flex-row items-center justify-between px-4 py-3 ${
                      !isLast ? "border-b border-gray-200" : ""
                    } ${meta.supported ? "active:bg-gray-200" : "opacity-50"}`}
                  >
                    <View className="flex-row items-center gap-2">
                      <Text
                        className={`text-base ${isSelected ? "font-semibold text-blue-600" : "text-gray-900"}`}
                      >
                        {meta.label}
                      </Text>
                      {!meta.supported ? (
                        <View className="rounded-full bg-gray-300 px-2 py-0.5">
                          <Text className="text-xs font-medium text-gray-600">Coming soon</Text>
                        </View>
                      ) : null}
                    </View>
                    {isSelected ? (
                      <Text className="text-base font-bold text-blue-600">✓</Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          )}
          {settingsError ? (
            <Text accessibilityRole="alert" className="text-sm text-red-600">
              {settingsError}
            </Text>
          ) : null}
        </View>

        {/* Invite spouse */}
        <View className="gap-2">
          <Text className="text-base font-semibold text-gray-900">Invite your spouse</Text>
          <Text className="text-sm text-gray-500">
            Generate a single-use code (valid 7 days). Your spouse enters it on the "Join
            household" screen to link their own login to this household.
          </Text>

          {code ? (
            <View className="items-center gap-1 rounded-2xl bg-gray-100 px-4 py-4">
              <Text className="text-xs uppercase tracking-wide text-gray-500">Invite code</Text>
              <Text
                accessibilityLabel="Invite code"
                className="text-2xl font-bold tracking-widest text-gray-900"
              >
                {code}
              </Text>
            </View>
          ) : null}

          {inviteError ? (
            <Text accessibilityRole="alert" className="text-sm text-red-600">
              {inviteError}
            </Text>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Generate invite code"
            disabled={inviteLoading}
            onPress={onInvite}
            className={`min-h-12 items-center justify-center rounded-2xl px-4 py-3 ${
              inviteLoading ? "bg-gray-300" : "bg-blue-600 active:bg-blue-700"
            }`}
          >
            {inviteLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-base font-semibold text-white">
                {code ? "Generate a new code" : "Generate invite code"}
              </Text>
            )}
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign out"
          onPress={() => signOut()}
          className="mt-auto min-h-12 items-center justify-center rounded-2xl border border-gray-300 px-4 py-3 active:bg-gray-100"
        >
          <Text className="text-base font-semibold text-red-600">Sign out</Text>
        </Pressable>
      </View>

      {/* Reset-time picker modal */}
      <Modal visible={pickerVisible} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/40">
          <View className="w-80 gap-6 rounded-3xl bg-white px-6 py-8">
            <Text className="text-center text-lg font-semibold text-gray-900">
              Set daily reset time
            </Text>

            <View className="flex-row items-center justify-center gap-4">
              {/* Hour */}
              <View className="items-center gap-2">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Increase hour"
                  onPress={() => setPickerHour((h) => (h + 1) % 24)}
                  className="h-10 w-10 items-center justify-center rounded-full bg-gray-100 active:bg-gray-200"
                >
                  <Text className="text-xl font-bold text-gray-700">+</Text>
                </Pressable>
                <Text className="w-12 text-center text-3xl font-bold text-gray-900">
                  {String(pickerHour).padStart(2, "0")}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Decrease hour"
                  onPress={() => setPickerHour((h) => (h - 1 + 24) % 24)}
                  className="h-10 w-10 items-center justify-center rounded-full bg-gray-100 active:bg-gray-200"
                >
                  <Text className="text-xl font-bold text-gray-700">−</Text>
                </Pressable>
                <Text className="text-xs text-gray-400">hour</Text>
              </View>

              <Text className="text-3xl font-bold text-gray-300">:</Text>

              {/* Minute (steps of 5) */}
              <View className="items-center gap-2">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Increase minute"
                  onPress={() => setPickerMinute((m) => (m + 5) % 60)}
                  className="h-10 w-10 items-center justify-center rounded-full bg-gray-100 active:bg-gray-200"
                >
                  <Text className="text-xl font-bold text-gray-700">+</Text>
                </Pressable>
                <Text className="w-12 text-center text-3xl font-bold text-gray-900">
                  {String(pickerMinute).padStart(2, "0")}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Decrease minute"
                  onPress={() => setPickerMinute((m) => (m - 5 + 60) % 60)}
                  className="h-10 w-10 items-center justify-center rounded-full bg-gray-100 active:bg-gray-200"
                >
                  <Text className="text-xl font-bold text-gray-700">−</Text>
                </Pressable>
                <Text className="text-xs text-gray-400">min (×5)</Text>
              </View>
            </View>

            <View className="flex-row gap-3">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cancel"
                onPress={() => setPickerVisible(false)}
                className="min-h-12 flex-1 items-center justify-center rounded-2xl border border-gray-300 px-4 py-3 active:bg-gray-100"
              >
                <Text className="text-base font-semibold text-gray-700">Cancel</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Save reset time"
                disabled={saving}
                onPress={onSaveResetTime}
                className={`min-h-12 flex-1 items-center justify-center rounded-2xl px-4 py-3 ${
                  saving ? "bg-gray-300" : "bg-blue-600 active:bg-blue-700"
                }`}
              >
                {saving ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="text-base font-semibold text-white">Save</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
