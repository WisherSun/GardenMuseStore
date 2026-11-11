import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase.js";
import { AuthContext } from "./auth-context.js";

// Keeps track of the logged-in user for the whole app.
// Supabase saves the session in the browser, so users stay logged in after a refresh.
export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(supabase));

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    // Runs on login, logout, token refresh and password-reset links
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      signOut: () => supabase?.auth.signOut(),
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
