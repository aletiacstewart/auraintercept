import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const REPS = [
  "michael@auraintercept.ai",
  "charles@auraintercept.ai",
  "ryelee@auraintercept.ai",
];
const PASSWORD = "aidemo*!";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (listErr) throw listErr;

    const created: string[] = [];
    const updated: string[] = [];

    for (const email of REPS) {
      const existing = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
      let userId: string;
      if (existing) {
        const { error } = await admin.auth.admin.updateUserById(existing.id, {
          password: PASSWORD,
          email_confirm: true,
        });
        if (error) throw error;
        userId = existing.id;
        updated.push(email);
      } else {
        const { data, error } = await admin.auth.admin.createUser({
          email,
          password: PASSWORD,
          email_confirm: true,
        });
        if (error) throw error;
        userId = data.user!.id;
        created.push(email);
      }

      // Upsert demo_rep role
      const { error: roleErr } = await admin
        .from("user_roles")
        .upsert({ user_id: userId, role: "demo_rep" }, { onConflict: "user_id,role" });
      if (roleErr) throw roleErr;
    }

    return new Response(JSON.stringify({ ok: true, created, updated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error)?.message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});