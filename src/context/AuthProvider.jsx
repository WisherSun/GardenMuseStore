import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase.js";
import { checkIsAdmin } from "../api/admin.js";
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

  // Ask the database whether this user is an admin (the database decides, see admin-setup.sql).
  const userId = user?.id ?? null;
  const [adminCheck, setAdminCheck] = useState({ userId: null, isAdmin: false });

  useEffect(() => {
    if (!userId) return;
    let ignore = false;
    checkIsAdmin()
      .catch((error) => {
        console.error("Could not check admin access:", error);
        return false;
      })
      .then((isAdmin) => {
        if (!ignore) setAdminCheck({ userId, isAdmin });
      });
    return () => {
      ignore = true;
    };
  }, [userId]);

  const isAdmin = Boolean(userId) && adminCheck.userId === userId && adminCheck.isAdmin;
  const adminLoading = Boolean(userId) && adminCheck.userId !== userId;

  const value = useMemo(
    () => ({
      user,
      loading,
      isAdmin,
      adminLoading,
      signOut: () => supabase?.auth.signOut(),
    }),
    [user, loading, isAdmin, adminLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
