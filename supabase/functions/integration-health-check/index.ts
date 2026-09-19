import { createClient } from "npm:@supabase/supabase-js@2";
import { requireCronSecret } from "../_shared/cron-auth.ts";
import { probeTenantIntegrations, type TenantIntegrationRow } from "../_shared/integration-probes.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

// Daily sweep: verify each active tenant integration is still reachable.
// Records every result in integration_health_logs so the Connections page can
// show real history, and notifies staff about broken credentials.
// Only lightweight probes; no destructive calls.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const denied = await requireCronSecret(req, corsHeaders);
  if (denied) return denied;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: rows } = await supabase
    .from("tenant_integrations")
    .select(
      "company_id, resend_api_key, signalwire_project_id, signalwire_api_token, signalwire_space_url, signalwire_campaign_status, google_refresh_token, elevenlabs_api_key, stripe_secret_key"
    );

  const checkedAt = new Date().toISOString();
  const logRows: Record<string, unknown>[] = [];
  const issues: Array<{ company_id: string; provider: string; reason: string }> = [];

  for (const r of rows ?? []) {
    const results = await probeTenantIntegrations(r as TenantIntegrationRow);
    for (const res of results) {
      logRows.push({
        company_id: res.company_id,
        integration_name: res.integration_name,
        status: res.status,
        last_sync: res.status === "connected" ? checkedAt : null,
        error_message: res.error_message,
        checked_at: checkedAt,
      });
      if (res.status === "error") {
        issues.push({
          company_id: res.company_id,
          provider: res.integration_name,
          reason: res.error_message ?? "unknown",
        });
      }
    }
  }

  if (logRows.length) {
    await supabase.from("integration_health_logs").insert(logRows);
  }

  // Fan out one staff notification per company/provider issue.
  for (const issue of issues) {
    await supabase.from("staff_notifications").insert({
      company_id: issue.company_id,
      recipient_role: "company_admin",
      notification_type: "integration_health",
      title: `Integration issue: ${issue.provider}`,
      message: `Aura could not verify ${issue.provider}. Reconnect it in Settings → Integrations. (${issue.reason})`,
      metadata: issue,
    });
  }

  return new Response(
    JSON.stringify({ checked: rows?.length ?? 0, logged: logRows.length, issues: issues.length, details: issues }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
