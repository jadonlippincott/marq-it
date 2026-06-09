/**
 * Supabase environment configuration (MI-8).
 *
 * Values come from `EXPO_PUBLIC_*` vars, which Expo inlines into the bundle at
 * build time. They live in `.env` (gitignored) for local dev — see
 * `.env.example`. Reading them here, once, fails fast with a clear message if
 * the project hasn't been configured yet.
 *
 * The key here is the *publishable* key (sb_publishable_...) — the client-safe
 * replacement for the anon key. Because EXPO_PUBLIC_* vars ship in the bundle,
 * the secret key (sb_secret_...) must never go here: it bypasses Row-Level
 * Security. The URL is the base project URL; supabase-js appends /rest/v1 etc.
 *
 * Note: the member access `process.env.EXPO_PUBLIC_*` must stay literal for
 * Expo's inlining to work — don't refactor it behind a dynamic lookup.
 */

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing required env var ${name}. Copy .env.example to .env and fill in your Supabase project values.`,
    );
  }
  return value;
}

export const env = {
  supabaseUrl: required("EXPO_PUBLIC_SUPABASE_URL", process.env.EXPO_PUBLIC_SUPABASE_URL),
  supabasePublishableKey: required(
    "EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  ),
};
