import { type Session, type User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { AppState, type AppStateStatus } from "react-native";

import { supabase } from "@/lib/supabase";

/**
 * Auth context (MI-13).
 *
 * Backs protected routing with the real Supabase session. Tokens persist via
 * the encrypted SecureStore adapter (MI-8), so a returning user stays logged in
 * across app restarts. `loading` is true only until the stored session is
 * restored, so the gate can avoid flashing the auth screens.
 */
type AuthState = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Refresh tokens only while the app is foregrounded (Supabase RN guidance).
  useEffect(() => {
    if (AppState.currentState === "active") {
      supabase.auth.startAutoRefresh();
    }
    function onAppStateChange(state: AppStateStatus) {
      if (state === "active") {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    }
    const sub = AppState.addEventListener("change", onAppStateChange);
    return () => {
      sub.remove();
      supabase.auth.stopAutoRefresh();
    };
  }, []);

  const value: AuthState = {
    session,
    user: session?.user ?? null,
    loading,
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within <AuthProvider>");
  }
  return ctx;
}
