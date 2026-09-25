import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const allowedOrigin = Deno.env.get("APP_ORIGIN") || "*";
const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

  // Verify the caller with the caller's JWT. The service-role key is never sent
  // to the browser and is used only inside this Edge Function.
  const token = authHeader.replace("Bearer ", "");
  const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: { user }, error: userError } = await userClient.auth.getUser(token);
  if (userError || !user) return json({ error: "Unauthorized" }, 401);

  const { data: callerRole, error: roleError } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (roleError || callerRole?.role !== "admin") return json({ error: "Admin access required" }, 403);

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const action = payload?.action;
  if (!["list", "create", "set_role", "set_status"].includes(action)) {
    return json({ error: "Unsupported action" }, 400);
  }

  if (action === "list") {
    const { data, error } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) return json({ error: error.message }, 400);

    const userIds = data.users.map((u) => u.id);
    const { data: roles, error: rolesError } = await adminClient
      .from("user_roles")
      .select("user_id, role")
      .in("user_id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);
    if (rolesError) return json({ error: rolesError.message }, 400);

    const roleMap = new Map((roles ?? []).map((r) => [r.user_id, r.role]));
    return json({
      users: data.users.map((u) => ({
        id: u.id,
        email: u.email,
        role: roleMap.get(u.id) ?? "viewer",
        disabled: Boolean(u.banned_until && new Date(u.banned_until).getTime() > Date.now()),
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
      })),
    });
  }

  if (action === "create") {
    const email = String(payload?.email ?? "").trim().toLowerCase();
    const password = String(payload?.password ?? "");
    const role = payload?.role;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "Enter a valid email address." }, 400);
    if (password.length < 8) return json({ error: "Password must be at least 8 characters." }, 400);
    if (!["viewer", "editor"].includes(role)) return json({ error: "New users can only be viewer or editor." }, 400);

    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) return json({ error: error.message }, 400);

    const { error: roleInsertError } = await adminClient
      .from("user_roles")
      .insert({ user_id: data.user.id, role });

    if (roleInsertError) {
      await adminClient.auth.admin.deleteUser(data.user.id);
      return json({ error: "User creation failed while assigning the role." }, 500);
    }

    return json({ ok: true, user: { id: data.user.id, email: data.user.email, role } });
  }

  const targetUserId = String(payload?.userId ?? "");
  if (!targetUserId) return json({ error: "User ID is required." }, 400);

  if (targetUserId === user.id) {
    return json({ error: "You cannot change your own role or disable your own account." }, 400);
  }

  if (action === "set_role") {
    const role = payload?.role;
    if (!["admin", "editor", "viewer"].includes(role)) return json({ error: "Invalid role." }, 400);

    // Prevent the last admin from accidentally removing all administrative access.
    if (role !== "admin") {
      const { count } = await adminClient
        .from("user_roles")
        .select("user_id", { count: "exact", head: true })
        .eq("role", "admin");
      if ((count ?? 0) <= 1) {
        const { data: target } = await adminClient.from("user_roles").select("role").eq("user_id", targetUserId).maybeSingle();
        if (target?.role === "admin") return json({ error: "At least one administrator must remain." }, 400);
      }
    }

    const { error } = await adminClient
      .from("user_roles")
      .upsert({ user_id: targetUserId, role }, { onConflict: "user_id" });
    if (error) return json({ error: error.message }, 400);
    return json({ ok: true });
  }

  if (action === "set_status") {
    const disabled = Boolean(payload?.disabled);
    const { error } = await adminClient.auth.admin.updateUserById(targetUserId, {
      ban_duration: disabled ? "876000h" : "none",
    });
    if (error) return json({ error: error.message }, 400);
    return json({ ok: true });
  }

  return json({ error: "Unsupported action" }, 400);
});
