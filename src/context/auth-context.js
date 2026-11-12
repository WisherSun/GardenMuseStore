import { createContext } from "react";

// Shared login state: { user, loading, isAdmin, adminLoading, signOut }. Filled in by AuthProvider.
export const AuthContext = createContext(null);
