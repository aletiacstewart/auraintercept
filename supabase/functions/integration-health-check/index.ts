import { createClient } from "npm:@supabase/supabase-js@2";
import { requireCronSecret } from "../_shared/cron-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

// Daily sweep: verify each active tenant integration is still reachable.
// If credentials look broken, mark status='error' and drop a staff notification.
// Only inspects credential presence + lightweight probes; no destructive calls.
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
      "company_id, resend_api_key, signalwire_project_id, signalwire_api_token, signalwire_space_url, signalwire_campaign_status, google_refresh_token, elevenlabs_api_key, stripe_secret_key, tavily_api_key"
    );

  const issues: Array<{ company_id: string; provider: string; reason: string }> = [];

  for (const r of rows ?? []) {
    // Google OAuth: probe refresh
    if (r.google_refresh_token) {
      const clientId = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID");
      const clientSecret = Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET");
      if (clientId && clientSecret) {
        try {
          const resp = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              client_id: clientId,
              client_secret: clientSecret,
              refresh_token: r.google_refresh_token,
              grant_type: "refresh_token",
            }),
          });
          if (!resp.ok) issues.push({ company_id: r.company_id, provider: "google_calendar", reason: `oauth ${resp.status}` });
        } catch (e) {
          issues.push({ company_id: r.company_id, provider: "google_calendar", reason: e instanceof Error ? e.message : String(e) });
        }
      }
    }

    // SignalWire: hit the account endpoint (HEAD-ish GET with basic auth)
    if (r.signalwire_project_id && r.signalwire_api_token && r.signalwire_space_url) {
      try {
        const resp = await fetch(
          `https://${r.signalwire_space_url}/api/laml/2010-04-01/Accounts/${r.signalwire_project_id}.json`,
          {
            headers: {
              Authorization: `Basic ${btoa(`${r.signalwire_project_id}:${r.signalwire_api_token}`)}`,
            },
          }
        );
        if (!resp.ok) issues.push({ company_id: r.company_id, provider: "signalwire", reason: `${resp.status}` });
      } catch (e) {
        issues.push({ company_id: r.company_id, provider: "signalwire", reason: e instanceof Error ? e.message : String(e) });
      }
    }

    // Resend: list domains — verifies key auth without side effects
    if (r.resend_api_key) {
      try {
        const resp = await fetch("https://api.resend.com/domains", {
          headers: { Authorization: `Bearer ${r.resend_api_key}` },
        });
        if (!resp.ok) issues.push({ company_id: r.company_id, provider: "resend", reason: `${resp.status}` });
      } catch (e) {
        issues.push({ company_id: r.company_id, provider: "resend", reason: e instanceof Error ? e.message : String(e) });
      }
    }

    // ElevenLabs: /v1/user auth check
    if (r.elevenlabs_api_key) {
      try {
        const resp = await fetch("https://api.elevenlabs.io/v1/user", {
          headers: { "xi-api-key": r.elevenlabs_api_key },
        });
        if (!resp.ok) issues.push({ company_id: r.company_id, provider: "elevenlabs", reason: `${resp.status}` });
      } catch (e) {
        issues.push({ company_id: r.company_id, provider: "elevenlabs", reason: e instanceof Error ? e.message : String(e) });
      }
    }

    // Stripe: /v1/account
    if (r.stripe_secret_key) {
      try {
        const resp = await fetch("https://api.stripe.com/v1/account", {
          headers: { Authorization: `Bearer ${r.stripe_secret_key}` },
        });
        if (!resp.ok) issues.push({ company_id: r.company_id, provider: "stripe", reason: `${resp.status}` });
      } catch (e) {
        issues.push({ company_id: r.company_id, provider: "stripe", reason: e instanceof Error ? e.message : String(e) });
      }
    }

    // Tavily: tiny search probe
    if (r.tavily_api_key) {
      try {
        const resp = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ api_key: r.tavily_api_key, query: "ping", max_results: 1 }),
        });
        if (!resp.ok) issues.push({ company_id: r.company_id, provider: "tavily", reason: `${resp.status}` });
      } catch (e) {
        issues.push({ company_id: r.company_id, provider: "tavily", reason: e instanceof Error ? e.message : String(e) });
      }
    }

    // A2P 10DLC (SignalWire campaign registration): flag any tenant whose campaign
    // status is in a terminal-bad state so SMS outreach isn't silently blocked.
    // Only reports state — never re-registers.
    const badA2P = new Set(["REJECTED", "FAILED", "EXPIRED", "SUSPENDED"]);
    if (r.signalwire_campaign_status && badA2P.has(String(r.signalwire_campaign_status).toUpperCase())) {
      issues.push({
        company_id: r.company_id,
        provider: "a2p_10dlc",
        reason: `campaign status ${r.signalwire_campaign_status}`,
      });
    }
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

  return new Response(JSON.stringify({ checked: rows?.length ?? 0, issues: issues.length, details: issues }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});