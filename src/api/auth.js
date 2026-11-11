import { supabase } from "../lib/supabase.js";

function client() {
  if (!supabase) throw new Error("Supabase is not configured");
  return supabase.auth;
}

// Throws the Supabase error so pages can show a message
async function run(promise) {
  const { data, error } = await promise;
  if (error) throw error;
  return data;
}

export const signIn = (email, password) =>
  run(client().signInWithPassword({ email, password }));

export const signUp = (name, email, password) =>
  run(
    client().signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        // Where the "confirm your email" link brings the user back to
        emailRedirectTo: `${window.location.origin}/account`,
      },
    }),
  );

export const sendPasswordReset = (email) =>
  run(
    client().resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    }),
  );

export const updatePassword = (password) => run(client().updateUser({ password }));

// Turns Supabase's technical errors into friendly text
export function authErrorMessage(error) {
  const code = error?.code ?? "";
  const message = (error?.message ?? "").toLowerCase();

  if (code === "invalid_credentials" || message.includes("invalid login credentials"))
    return "Email or password is incorrect.";
  if (code === "email_not_confirmed" || message.includes("email not confirmed"))
    return "Please confirm your email first. Check your inbox for our link.";
  if (code === "user_already_exists" || message.includes("already registered"))
    return "An account with this email already exists. Try signing in instead.";
  if (code === "weak_password" || message.includes("password should"))
    return "This password is too weak. Use at least 8 characters with letters and numbers.";
  if (code === "same_password") return "Your new password must be different from the old one.";
  if (code.includes("rate_limit") || message.includes("rate limit") || error?.status === 429)
    return "Too many attempts. Please wait a few minutes and try again.";
  if (message.includes("failed to fetch") || message.includes("network"))
    return "Can’t reach the server. Check your internet connection.";
  return "Something went wrong. Please try again.";
}
