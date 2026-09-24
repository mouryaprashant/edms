import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "../supabaseClient";

// Real authentication via Supabase Auth, replacing the old client-side PIN
// check. Admin status now comes from a genuine signed-in session — and,
// paired with Row Level Security policies on the sections/stations tables
// (see README), the database itself rejects writes from anyone who isn't
// authenticated, not just the UI.
export function useAdmin() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    if (!supabase) return { ok: false, error: "Supabase is not configured." };
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: error.message };
    setSession(data.session);
    return { ok: true };
  };

  const logout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSession(null);
  };

  return {
    isAdmin: Boolean(session),
    userEmail: session?.user?.email || null,
    authLoading: loading,
    login,
    logout,
  };
}
