import { supabase } from "../supabaseClient";

export async function manageUsers(action, payload = {}) {
  if (!supabase) return { ok: false, error: "Supabase is not configured." };

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return { ok: false, error: "Please sign in as an administrator." };

  const { data, error } = await supabase.functions.invoke("user-management", {
    body: { action, ...payload },
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (error) {
    let message = error.message || "User management request failed.";
    try {
      const context = await error.context?.json?.();
      if (context?.error) message = context.error;
    } catch {}
    return { ok: false, error: message };
  }
  if (data?.error) return { ok: false, error: data.error };
  return { ok: true, data };
}
