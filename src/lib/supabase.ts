import "react-native-url-polyfill/auto";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import { env } from "@/lib/env";
import { secureStoreAdapter } from "@/lib/secure-store";

/**
 * App-wide Supabase client (MI-8).
 *
 * Typed against the generated `Database` (a placeholder until MI-9). Auth tokens
 * persist via the encrypted SecureStore adapter. `detectSessionInUrl` is off —
 * that's a web OAuth-redirect concern with no meaning on React Native.
 *
 * The URL polyfill above is required: supabase-js relies on a WHATWG `URL`,
 * which React Native doesn't fully provide.
 *
 * Real auth flows (sign-in/up, session bootstrapping, AppState-driven token
 * refresh) arrive in MI-13; this module only makes the client available via
 * `@/lib/supabase`.
 */
export const supabase = createClient<Database>(env.supabaseUrl, env.supabasePublishableKey, {
  auth: {
    storage: secureStoreAdapter,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
