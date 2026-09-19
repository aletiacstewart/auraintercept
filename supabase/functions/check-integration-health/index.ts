import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { probeTenantIntegrations, type TenantIntegrationRow } from "../_shared/integration-probes.ts";

// On-demand health check for the signed-in user's company.
// Probes each configured integration, records the result in
// integration_health_logs, and returns the unified snapshot.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceRole, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: profile } = await admin
      .from("profiles")
      .select("company_id")
      .eq("id", userData.user.id)
      .maybeSingle();

    const companyId = profile?.company_id as string | undefined;
    if (!companyId) {
      return new Response(JSON.stringify({ error: "No company for this user" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: row } = await admin
      .from("tenant_integrations")
      .select(
        "company_id, resend_api_key, signalwire_project_id, signalwire_api_token, signalwire_space_url, signalwire_campaign_status, google_refresh_token, elevenlabs_api_key, stripe_secret_key",
      )
      .eq("company_id", companyId)
      .maybeSingle();

    const results = row
      ? await probeTenantIntegrations(row as TenantIntegrationRow)
      : [];

    const checkedAt = new Date().toISOString();
    if (results.length) {
      await admin.from("integration_health_logs").insert(
        results.map((r) => ({
          company_id: r.company_id,
          integration_name: r.integration_name,
          status: r.status,
          last_sync: r.status === "connected" ? checkedAt : null,
          error_message: r.error_message,
          checked_at: checkedAt,
        })),
      );
    }

    return new Response(
      JSON.stringify({ company_id: companyId, checked_at: checkedAt, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[check-integration-health]", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unexpected error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
