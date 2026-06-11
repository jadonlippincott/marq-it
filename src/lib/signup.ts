import type { Database } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";

export type MemberRole = Database["public"]["Enums"]["member_role"];

export type SignUpParams = {
  email: string;
  password: string;
  displayName: string;
  role: MemberRole;
};

/**
 * Sign-up + household bootstrap (MI-11).
 *
 * Registers the first member via Supabase Auth, then calls the
 * `create_household_with_member` SECURITY DEFINER RPC to atomically create the
 * household, its settings, and the creator's member row.
 *
 * Assumes email confirmation is disabled so `signUp` returns a session
 * immediately — the RPC needs an authenticated session (auth.uid()).
 *
 * Returns `{ error }` (a human-readable message) rather than throwing, so the
 * screen can render it inline.
 */
export async function signUpAndCreateHousehold({
  email,
  password,
  displayName,
  role,
}: SignUpParams): Promise<{ error: string | null }> {
  const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
  if (signUpError) return { error: signUpError.message };

  if (!data.session) {
    // No session means email confirmation is on; the household can't be created
    // until the user confirms and signs in. Surface a clear message.
    return {
      error: "Check your email to confirm your account, then sign in to finish setup.",
    };
  }

  const { error: rpcError } = await supabase.rpc("create_household_with_member", {
    p_display_name: displayName.trim(),
    p_role: role,
  });
  if (rpcError) return { error: rpcError.message };

  return { error: null };
}
