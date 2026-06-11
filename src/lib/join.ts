import { supabase } from "@/lib/supabase";

export type JoinParams = {
  email: string;
  password: string;
  displayName: string;
  code: string;
};

/**
 * Second-spouse join (MI-12).
 *
 * Registers the joining spouse via Supabase Auth, then redeems the invite code
 * through the `redeem_household_invite` SECURITY DEFINER RPC, linking them to
 * the existing household as member #2.
 *
 * Assumes email confirmation is disabled so `signUp` returns a session
 * immediately (the RPC needs an authenticated session). Returns `{ error }`
 * rather than throwing so the screen can render it inline.
 */
export async function joinHouseholdWithInvite({
  email,
  password,
  displayName,
  code,
}: JoinParams): Promise<{ error: string | null }> {
  const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
  if (signUpError) return { error: signUpError.message };
  if (!data.session) {
    return {
      error: "Check your email to confirm your account, then sign in to finish joining.",
    };
  }

  const { error: rpcError } = await supabase.rpc("redeem_household_invite", {
    p_code: code.trim(),
    p_display_name: displayName.trim(),
  });
  if (rpcError) return { error: rpcError.message };

  return { error: null };
}

/**
 * Generate a single-use invite code for the caller's household (member #1).
 * Calls the `create_household_invite` SECURITY DEFINER RPC. Requires an active
 * authenticated session.
 */
export async function createHouseholdInvite(): Promise<{ code: string | null; error: string | null }> {
  const { data, error } = await supabase.rpc("create_household_invite");
  if (error) return { code: null, error: error.message };
  return { code: data, error: null };
}
