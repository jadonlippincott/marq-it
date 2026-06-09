/**
 * Auth gate — STUB for MI-7.
 *
 * The real session logic (Supabase sign-in, persistence, household resolution)
 * lands in MI-13 (and MI-11/MI-12 for account creation). For now this always
 * reports an authenticated session so the app shell is navigable end-to-end.
 *
 * TODO(MI-13): replace with a real Supabase-backed auth context/provider.
 */
export type AuthState = {
  /** Whether a member session is active. Always true while stubbed. */
  authed: boolean;
};

export function useAuth(): AuthState {
  // TODO(MI-13): derive from Supabase session + secure token storage.
  return { authed: true };
}
