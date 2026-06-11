import { supabase } from "@/lib/supabase";

/**
 * Sign in with email + password (MI-13). On success, the `onAuthStateChange`
 * listener in AuthProvider updates the session and the route gate moves the
 * user into the app — no manual navigation needed. Returns `{ error }` so the
 * screen can render it inline.
 */
export async function signIn({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) return { error: error.message };
  return { error: null };
}
