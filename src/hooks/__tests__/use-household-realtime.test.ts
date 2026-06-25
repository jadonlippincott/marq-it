import { renderHook } from "@testing-library/react-native";

import { useHouseholdRealtime } from "@/hooks/use-household-realtime";
import { supabase } from "@/lib/supabase";

jest.mock("@/lib/supabase", () => ({
  supabase: {
    // Fresh channel per call so each render's .on calls stay isolated.
    channel: jest.fn(() => {
      const channel = { on: jest.fn(), subscribe: jest.fn() };
      channel.on.mockReturnValue(channel);
      channel.subscribe.mockReturnValue(channel);
      return channel;
    }),
    removeChannel: jest.fn(),
  },
}));

const mockChannel = supabase.channel as jest.Mock;
const mockRemoveChannel = supabase.removeChannel as jest.Mock;

beforeEach(() => {
  mockChannel.mockClear();
  mockRemoveChannel.mockClear();
});

describe("useHouseholdRealtime", () => {
  it("does not subscribe without a household", () => {
    renderHook(() => useHouseholdRealtime(null, jest.fn()));
    expect(mockChannel).not.toHaveBeenCalled();
  });

  it("subscribes to both shared tables scoped to the household", () => {
    renderHook(() => useHouseholdRealtime("hh-1", jest.fn()));

    // Topic is prefixed with the household and suffixed with a per-instance id
    // (useId) so Home and Charting don't collide on one already-subscribed channel.
    expect(mockChannel).toHaveBeenCalledWith(expect.stringMatching(/^household:hh-1:/));
    const channel = mockChannel.mock.results[0].value;
    const tables = channel.on.mock.calls.map((c: unknown[]) => (c[1] as { table: string }).table);
    expect(tables).toEqual(["day_entries", "intercourse_events"]);
    for (const call of channel.on.mock.calls) {
      expect(call[1].filter).toBe("household_id=eq.hh-1");
    }
    expect(channel.subscribe).toHaveBeenCalled();
  });

  it("invokes onChange when a change event fires", () => {
    const onChange = jest.fn();
    renderHook(() => useHouseholdRealtime("hh-1", onChange));

    const channel = mockChannel.mock.results[0].value;
    // Fire the handler registered for the first table.
    channel.on.mock.calls[0][2]();
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("removes the channel on unmount", () => {
    const { unmount } = renderHook(() => useHouseholdRealtime("hh-1", jest.fn()));
    const channel = mockChannel.mock.results[0].value;
    unmount();
    expect(mockRemoveChannel).toHaveBeenCalledWith(channel);
  });

  it("gives concurrent subscribers distinct channel topics (no shared-channel collision)", () => {
    // Two mounts (e.g. Home + Charting) for the same household must not reuse one
    // channel topic, or the second would add callbacks after subscribe() and crash.
    renderHook(() => useHouseholdRealtime("hh-1", jest.fn()));
    renderHook(() => useHouseholdRealtime("hh-1", jest.fn()));
    const [first, second] = mockChannel.mock.calls.map((c) => c[0]);
    expect(first).not.toBe(second);
  });
});
