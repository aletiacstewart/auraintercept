import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const companyId = body?.company_id;
    if (!companyId || typeof companyId !== "string") {
      return new Response(JSON.stringify({ error: "company_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = Deno.env.get("SUPABASE_URL")!;
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(url, key);

    const { data: company, error: cErr } = await supabase
      .from("companies")
      .select("id, name, subscription_tier, industry_vertical, trial_ends_at, phone, address")
      .eq("id", companyId)
      .maybeSingle();

    if (cErr || !company) {
      return new Response(JSON.stringify({ error: "company not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Recipients: every platform_admin's email
    const { data: roleRows } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "platform_admin");
    const ids = (roleRows ?? []).map((r) => r.user_id);
    if (ids.length === 0) {
      return new Response(JSON.stringify({ skipped: "no_admins" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: profiles } = await supabase
      .from("profiles")
      .select("email")
      .in("id", ids);
    const recipients = (profiles ?? [])
      .map((p) => p.email)
      .filter((e): e is string => typeof e === "string" && e.includes("@"));
    if (recipients.length === 0) {
      return new Response(JSON.stringify({ skipped: "no_recipient_emails" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!LOVABLE_API_KEY || !RESEND_API_KEY) {
      console.log("notify-platform-on-signup: missing email keys, skipping email send", {
        company: company.id,
        recipients: recipients.length,
      });
      return new Response(JSON.stringify({ ok: true, emailed: false, reason: "keys_missing" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const subject = `New Aura signup: ${company.name} (${company.subscription_tier ?? "?"} / ${company.industry_vertical ?? "?"})`;
    const html = `
      <h2>New Aura Intercept signup</h2>
      <p><strong>${company.name}</strong></p>
      <ul>
        <li>Tier: ${company.subscription_tier ?? "—"}</li>
        <li>Industry: ${company.industry_vertical ?? "—"}</li>
        <li>Phone: ${company.phone ?? "—"}</li>
        <li>Address: ${company.address ?? "—"}</li>
        <li>Trial ends: ${company.trial_ends_at ?? "—"}</li>
      </ul>
      <p><a href="https://auraintercept.ai/dashboard/companies">Open Platform Dashboard →</a></p>
    `;

    const resp = await fetch(`${GATEWAY_URL}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: "Aura Intercept <notify@auraintercept.ai>",
        to: recipients,
        subject,
        html,
      }),
    });
    const result = await resp.json().catch(() => ({}));
    return new Response(JSON.stringify({ ok: resp.ok, status: resp.status, result }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("notify-platform-on-signup error", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});