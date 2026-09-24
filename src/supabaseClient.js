import { createClient } from "@supabase/supabase-js";

// Vite exposes env vars via import.meta.env (must be prefixed VITE_).
// If you're on Create React App instead, swap these for process.env.REACT_APP_SUPABASE_URL etc.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
    !SUPABASE_URL.includes("YOUR-PROJECT-ID") &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_ANON_KEY.includes("YOUR_SUPABASE_ANON_KEY")
);

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;
