import { supabase } from "@/lib/supabase";

/**
 * Request a password reset email (MI-28). The email contains a link that
 * deep-links back into the app at `marqit://reset-password` with the recovery
 * tokens in the URL fragment.
 */
export async function requestPasswordReset(email: string): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: "marqit://reset-password",
  });
  if (error) return { error: error.message };
  return { error: null };
}

/**
 * Set a new password for the currently-authenticated recovery session (MI-28).
 * Call this after `supabase.auth.setSession()` has been called with the tokens
 * from the deep-link URL fragment.
 */
export async function updatePassword(password: string): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  return { error: null };
}
