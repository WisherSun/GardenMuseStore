import { createClient } from "@supabase/supabase-js";

// Values come from .env.local (see .env.example).
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.error("Supabase is not configured: add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env.local");
}

// null when not configured, so the page still renders and shows an error message instead of crashing.
export const supabase = url && key ? createClient(url, key) : null;
