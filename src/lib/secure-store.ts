import * as SecureStore from "expo-secure-store";

/**
 * A Supabase auth-storage adapter backed by expo-secure-store (MI-8).
 *
 * SecureStore encrypts values in the iOS Keychain / Android Keystore — the only
 * acceptable place for this health app's auth tokens (CLAUDE.md privacy rule),
 * never plain AsyncStorage. SecureStore caps each value near 2KB and Supabase
 * sessions can exceed that, so values are split across numbered chunk entries
 * (`<key>.0`, `<key>.1`, …) with the base key holding the chunk count.
 */

// Stay comfortably under SecureStore's ~2048-byte per-value limit. Tokens are
// ASCII (JWT/base64), so one character is one byte here.
const CHUNK_SIZE = 1800;

function chunkKey(key: string, index: number): string {
  return `${key}.${index}`;
}

async function clearChunks(key: string, count: number): Promise<void> {
  await Promise.all(
    Array.from({ length: count }, (_, i) => SecureStore.deleteItemAsync(chunkKey(key, i))),
  );
}

export const secureStoreAdapter = {
  async getItem(key: string): Promise<string | null> {
    const manifest = await SecureStore.getItemAsync(key);
    if (manifest === null) return null;

    const count = Number(manifest);
    if (!Number.isInteger(count) || count < 0) return null;

    const parts = await Promise.all(
      Array.from({ length: count }, (_, i) => SecureStore.getItemAsync(chunkKey(key, i))),
    );
    // A missing chunk means a torn write — treat the whole value as absent.
    if (parts.some((part) => part === null)) return null;
    return parts.join("");
  },

  async setItem(key: string, value: string): Promise<void> {
    // Drop any chunks from a previous (possibly longer) value first.
    const prev = await SecureStore.getItemAsync(key);
    if (prev !== null) await clearChunks(key, Number(prev) || 0);

    const chunks: string[] = [];
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
      chunks.push(value.slice(i, i + CHUNK_SIZE));
    }
    await Promise.all(
      chunks.map((chunk, i) => SecureStore.setItemAsync(chunkKey(key, i), chunk)),
    );
    await SecureStore.setItemAsync(key, String(chunks.length));
  },

  async removeItem(key: string): Promise<void> {
    const manifest = await SecureStore.getItemAsync(key);
    if (manifest !== null) await clearChunks(key, Number(manifest) || 0);
    await SecureStore.deleteItemAsync(key);
  },
};
