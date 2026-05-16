import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// One-time platform admin password reset. Restricted to allow-listed emails.
const ALLOWED = new Set([
  "ai@auraintercept.ai",
  "superadmin@auraintercept.ai",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { email, password, secret } = await req.json();
    if (secret !== Deno.env.get("ADMIN_RESET_SECRET")) {
      return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!ALLOWED.has(email)) {
      return new Response(JSON.stringify({ error: "email not allowed" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    // Find user by email
    const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (listErr) throw listErr;
    const user = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (!user) return new Response(JSON.stringify({ error: "user not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { error: updErr } = await admin.auth.admin.updateUserById(user.id, { password, email_confirm: true });
    if (updErr) throw updErr;
    return new Response(JSON.stringify({ ok: true, user_id: user.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});