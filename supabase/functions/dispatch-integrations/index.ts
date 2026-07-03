import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://esm.sh/zod@3.23.8";
import { authorizeInternalRequest } from "../_shared/internal-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BodySchema = z.object({
  company_id: z.string().uuid(),
  event: z.string().min(1),
  payload: z.record(z.unknown()).default({}),
});

/**
 * Fans out an event to every connected integration for a company.
 * v1 supports webhook-style providers (slack, ms_teams, frontdesk_webhook).
 * Calendar / OAuth providers are no-ops here in v1 — they are pulled by the
 * existing booking sync paths; this function only handles outbound webhooks.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const { company_id, event, payload } = parsed.data;

    // This endpoint fans messages out to a company's connected Slack/Teams webhooks.
    // Restrict it to trusted internal callers OR authenticated members of the target
    // company to prevent anonymous message injection.
    const authz = await authorizeInternalRequest(req, company_id);
    if (!authz.ok) {
      return new Response(
        JSON.stringify({ error: authz.error }),
        { status: authz.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: integrations, error } = await supabase
      .from("company_integrations")
      .select("id, provider_key, status, config")
      .eq("company_id", company_id)
      .eq("status", "connected");

    if (error) throw error;

    const results: Array<{ provider: string; ok: boolean; error?: string }> = [];

    for (const integ of integrations ?? []) {
      const cfg = (integ.config ?? {}) as Record<string, unknown>;
      const url = cfg.webhook_url as string | undefined;
      if (!url) {
        // Non-webhook providers (calendars/twilio) handled elsewhere
        results.push({ provider: integ.provider_key, ok: true });
        continue;
      }
      try {
        let body: string;
        if (integ.provider_key === "slack") {
          body = JSON.stringify({ text: `*${event}*\n${pretty(payload)}` });
        } else if (integ.provider_key === "ms_teams") {
          body = JSON.stringify({ text: `**${event}**\n${pretty(payload)}` });
        } else {
          body = JSON.stringify({ event, payload, company_id });
        }
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (cfg.shared_secret) headers["X-Aura-Signature"] = String(cfg.shared_secret);

        const res = await fetch(url, { method: "POST", headers, body });
        const ok = res.ok;
        results.push({ provider: integ.provider_key, ok, error: ok ? undefined : `HTTP ${res.status}` });

        await supabase
          .from("company_integrations")
          .update({
            last_synced_at: new Date().toISOString(),
            last_error: ok ? null : `HTTP ${res.status}`,
            status: ok ? "connected" : "action_needed",
          })
          .eq("id", integ.id);
      } catch (e) {
        const msg = String((e as Error)?.message ?? e);
        results.push({ provider: integ.provider_key, ok: false, error: msg });
        await supabase
          .from("company_integrations")
          .update({ last_error: msg, status: "action_needed" })
          .eq("id", integ.id);
      }
    }

    return new Response(
      JSON.stringify({ ok: true, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("dispatch-integrations error:", err);
    return new Response(
      JSON.stringify({ error: String((err as Error)?.message ?? err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

function pretty(p: Record<string, unknown>): string {
  try {
    return Object.entries(p)
      .map(([k, v]) => `• ${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`)
      .join("\n");
  } catch {
    return JSON.stringify(p);
  }
}