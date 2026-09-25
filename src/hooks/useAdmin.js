import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "../supabaseClient";

/**
 * Authentication answers "who are you?".  Authorization comes from the
 * user_roles table and is ALSO enforced by Supabase RLS.  Never treat a
 * client-side boolean as the security boundary.
 */
export function useAdmin() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadRole = async (userId) => {
    if (!supabase || !userId) {
      setRole(null);
      return;
    }

    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    // Fail closed: a missing/failed role lookup never grants admin access.
    setRole(error ? null : data?.role || null);
  };

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return undefined;
    }

    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      await loadRole(data.session?.user?.id);
      if (mounted) setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);

      // Supabase recommends not performing awaited network calls directly in
      // the auth callback. Defer the role query to the next task.
      setTimeout(() => {
        if (event === "SIGNED_OUT" || !newSession?.user?.id) {
          setRole(null);
        } else {
          loadRole(newSession.user.id);
        }
      }, 0);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    if (!supabase) return { ok: false, error: "Supabase is not configured." };

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: "Invalid email or password." };

    await loadRole(data.session?.user?.id);
    setSession(data.session);
    return { ok: true };
  };

  const logout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSession(null);
    setRole(null);
  };

  return {
    // The UI only exposes management features to real DB-assigned admins.
    // RLS is the authoritative enforcement layer.
    isAuthenticated: Boolean(session),
    isAdmin: role === "admin",
    canEdit: role === "admin" || role === "editor",
    canDelete: role === "admin",
    role,
    userEmail: session?.user?.email || null,
    authLoading: loading,
    login,
    logout,
  };
}
