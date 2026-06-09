import * as SecureStore from "expo-secure-store";

import { secureStoreAdapter } from "@/lib/secure-store";

// In-memory stand-in for the native Keychain/Keystore.
jest.mock("expo-secure-store", () => {
  const store = new Map<string, string>();
  return {
    __store: store,
    getItemAsync: jest.fn(async (k: string) => (store.has(k) ? store.get(k)! : null)),
    setItemAsync: jest.fn(async (k: string, v: string) => {
      store.set(k, v);
    }),
    deleteItemAsync: jest.fn(async (k: string) => {
      store.delete(k);
    }),
  };
});

const store = (SecureStore as unknown as { __store: Map<string, string> }).__store;

beforeEach(() => store.clear());

describe("secureStoreAdapter", () => {
  it("round-trips a value that spans multiple chunks", async () => {
    const big = "x".repeat(5000); // > 2 chunks at 1800 chars
    await secureStoreAdapter.setItem("sb-auth-token", big);

    // Manifest records the chunk count; payload lives in numbered entries.
    expect(store.get("sb-auth-token")).toBe("3");
    expect(store.has("sb-auth-token.2")).toBe(true);
    expect(await secureStoreAdapter.getItem("sb-auth-token")).toBe(big);
  });

  it("returns null for an absent key", async () => {
    expect(await secureStoreAdapter.getItem("missing")).toBeNull();
  });

  it("clears leftover chunks when overwriting with a shorter value", async () => {
    await secureStoreAdapter.setItem("k", "y".repeat(5000)); // 3 chunks
    await secureStoreAdapter.setItem("k", "short"); // 1 chunk

    expect(store.get("k")).toBe("1");
    expect(store.has("k.1")).toBe(false);
    expect(store.has("k.2")).toBe(false);
    expect(await secureStoreAdapter.getItem("k")).toBe("short");
  });

  it("removes the manifest and every chunk", async () => {
    await secureStoreAdapter.setItem("k", "z".repeat(5000));
    await secureStoreAdapter.removeItem("k");

    expect(store.size).toBe(0);
    expect(await secureStoreAdapter.getItem("k")).toBeNull();
  });

  it("treats a torn write (missing chunk) as absent", async () => {
    await secureStoreAdapter.setItem("k", "w".repeat(5000));
    store.delete("k.1"); // simulate a partial/corrupt write

    expect(await secureStoreAdapter.getItem("k")).toBeNull();
  });
});
