// agent-action-executor
// Single mutating-action entrypoint for AI agents.
// Reads company_agent_autonomy, decides auto vs queue, writes to agent_proposed_actions.
// Every call must present a valid Supabase user JWT (or the service-role key as bearer
// for real server-to-server callers). Authorization is enforced via the shared
// `authorizeInternalRequest` helper which also confirms the caller belongs to the
// target company (platform_admin bypasses).

import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { authorizeInternalRequest } from "../_shared/internal-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type Mode = "off" | "suggest" | "auto_safe" | "auto_all";
type Risk = "low" | "medium" | "high";

interface ProposeBody {
  company_id: string;
  agent_id: string;
  action_type: string;
  payload: Record<string, unknown>;
  reverse_payload?: Record<string, unknown> | null;
  risk_tier?: Risk;
  confidence?: number;
  estimated_value_usd?: number;
  requested_by_event?: string;
  expires_in_hours?: number;
}

function nowHour(d = new Date()) {
  return d.getUTCHours();
}

function inQuietHours(start: number | null, end: number | null) {
  if (start == null || end == null) return false;
  const h = nowHour();
  if (start === end) return false;
  return start < end ? h >= start && h < end : h >= start || h < end;
}

function shouldAutoExecute(opts: {
  mode: Mode;
  risk: Risk;
  confidence: number;
  threshold: number;
  valueUsd: number;
  maxValueUsd: number;
  dailyCount: number;
  dailyCap: number;
  quietStart: number | null;
  quietEnd: number | null;
}): { auto: boolean; reason: string } {
  if (opts.mode === "off") return { auto: false, reason: "agent off" };
  if (opts.mode === "suggest") return { auto: false, reason: "approval required" };
  if (opts.dailyCount >= opts.dailyCap) return { auto: false, reason: "daily cap" };
  if (inQuietHours(opts.quietStart, opts.quietEnd))
    return { auto: false, reason: "quiet hours" };
  if (opts.confidence < opts.threshold)
    return { auto: false, reason: "confidence below threshold" };
  if (opts.valueUsd > opts.maxValueUsd) return { auto: false, reason: "value cap" };
  if (opts.mode === "auto_safe" && opts.risk !== "low")
    return { auto: false, reason: "auto_safe accepts low risk only" };
  return { auto: true, reason: "ok" };
}

/**
 * Server-side safety net: resolve canonical platform URL tokens (and a few
 * defaults) that may have slipped through client-side hydration. This keeps
 * the stored payload — and therefore the preview rendered in the Automation
 * console — free of unresolved `{{...}}` placeholders.
 */
const APP_ORIGIN = "https://auraintercept.ai";
const URL_DEFAULTS: Record<string, string> = {
  activation_url: `${APP_ORIGIN}/dashboard/billing?activate=1`,
  billing_url: `${APP_ORIGIN}/dashboard/billing`,
  login_url: `${APP_ORIGIN}/signin`,
  dashboard_url: `${APP_ORIGIN}/dashboard`,
  automation_url: `${APP_ORIGIN}/dashboard/automation`,
  onboarding_url: `${APP_ORIGIN}/onboarding`,
  company_portal_url: `${APP_ORIGIN}/portal`,
  booking_url: `${APP_ORIGIN}/book`,
  quote_url: `${APP_ORIGIN}/dashboard/quotes`,
  invoice_url: `${APP_ORIGIN}/dashboard/invoices`,
  from_email: "no-reply@auraintercept.ai",
};
function hydrateTokens(value: unknown, companyName: string): unknown {
  const ctx: Record<string, string> = { ...URL_DEFAULTS, company_name: companyName, from_name: companyName };
  const sub = (s: string) =>
    s.replace(/\{\{(\w+)\}\}/g, (_m, k) => (ctx[k] !== undefined ? ctx[k] : `{{${k}}}`));
  if (typeof value === "string") return sub(value);
  if (Array.isArray(value)) return value.map((v) => hydrateTokens(v, companyName));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = hydrateTokens(v, companyName);
    return out;
  }
  return value;
}

/**
 * Performs the real side-effect for an approved/auto-executed action.
 * Returns a short human summary. Errors are surfaced to the caller so the
 * action can be marked 'failed'.
 */
async function applyAction(
  supabase: ReturnType<typeof createClient>,
  companyId: string,
  actionType: string,
  payload: Record<string, unknown>,
): Promise<string> {
  switch (actionType) {
    case "draft_sms": {
      const to = String(payload.to ?? payload.lead_phone ?? "");
      const from = String(payload.from ?? "AURA");
      const message = String(payload.message ?? payload.body ?? "");
      const { error } = await supabase.from("sms_logs").insert({
        company_id: companyId,
        from_number: from,
        to_number: to || "+10000000000",
        message,
        direction: "outbound",
        status: "draft",
        source: "aura_workflow",
        metadata: { workflow_id: payload.workflow_id, run_id: payload.run_id, label: payload.label },
      });
      if (error) throw error;
      return `Drafted SMS to ${to || "lead"}`;
    }
    case "draft_email": {
      // No persistent email-drafts table; the draft remains in
      // agent_proposed_actions and is surfaced in the Email console panel.
      return `Drafted email: ${String(payload.subject ?? payload.label ?? "(no subject)")}`;
    }
    case "create_appointment": {
      const datetime = payload.datetime
        ? new Date(String(payload.datetime)).toISOString()
        : new Date(Date.now() + 24 * 3600_000).toISOString();
      const { error } = await supabase.from("appointments").insert({
        company_id: companyId,
        customer_name: String(payload.customer_name ?? "Unnamed customer"),
        customer_email: payload.customer_email ?? null,
        customer_phone: payload.customer_phone ?? null,
        service_type: String(payload.service_type ?? "Consultation"),
        datetime,
        duration_minutes: Number(payload.duration_minutes ?? 60),
        status: "proposed",
        notes: String(payload.notes ?? "Drafted by Aura workflow"),
      });
      if (error) throw error;
      return `Drafted appointment for ${payload.customer_name ?? "customer"}`;
    }
    case "draft_invoice": {
      const total = Number(payload.total ?? 0);
      const { error } = await supabase.from("invoices").insert({
        company_id: companyId,
        customer_name: String(payload.customer_name ?? "Unnamed customer"),
        customer_email: payload.customer_email ?? null,
        customer_phone: payload.customer_phone ?? null,
        status: "draft",
        subtotal: total,
        total,
        notes: String(payload.notes ?? "Drafted by Aura workflow"),
      });
      if (error) throw error;
      return `Drafted invoice for ${payload.customer_name ?? "customer"} ($${total.toFixed(2)})`;
    }
    case "task":
    default:
      return `Logged task: ${String(payload.label ?? actionType)}`;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const url = new URL(req.url);
    const op = url.searchParams.get("op") ?? "propose";

    // --- approve / reject: JWT required, caller must belong to the action's company ---
    if (op === "approve" || op === "reject") {
      const { id } = (await req.json()) as { id: string };
      if (!id) {
        return new Response(JSON.stringify({ error: "id required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Load the target row first so we can authorize against its company_id.
      const { data: existing, error: loadErr } = await supabase
        .from("agent_proposed_actions")
        .select("*")
        .eq("id", id)
        .single();
      if (loadErr) throw loadErr;

      const authz = await authorizeInternalRequest(req, existing.company_id as string);
      if (!authz.ok) {
        return new Response(JSON.stringify({ error: authz.error }), {
          status: authz.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const reviewerId = authz.ctx.userId; // null for service-role callers

      // approve/reject additionally require an admin role (service-role bypasses).
      if (!authz.ctx.isService) {
        const roles = authz.ctx.roles ?? [];
        const isAdmin = roles.includes("platform_admin") || roles.includes("company_admin");
        if (!isAdmin) {
          return new Response(
            JSON.stringify({ error: "Forbidden: requires company_admin" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
      }

      if (op === "reject") {
        const { data, error } = await supabase
          .from("agent_proposed_actions")
          .update({
            status: "rejected",
            reviewed_by: reviewerId,
            reviewed_at: new Date().toISOString(),
          })
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return new Response(JSON.stringify({ ok: true, action: data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // approve: perform side-effect, mark approved or failed
      try {
        const summary = await applyAction(
          supabase,
          existing.company_id,
          existing.action_type,
          (existing.payload ?? {}) as Record<string, unknown>,
        );
        const { data, error } = await supabase
          .from("agent_proposed_actions")
          .update({
            status: "approved",
            reviewed_by: reviewerId,
            reviewed_at: new Date().toISOString(),
            executed_at: new Date().toISOString(),
            result_summary: summary,
          })
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return new Response(JSON.stringify({ ok: true, action: data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (sideErr) {
        const msg = sideErr instanceof Error ? sideErr.message : String(sideErr);
        await supabase
          .from("agent_proposed_actions")
          .update({
            status: "failed",
            reviewed_by: reviewerId,
            reviewed_at: new Date().toISOString(),
            result_summary: `failed: ${msg}`,
          })
          .eq("id", id);
        throw sideErr;
      }
    }

    // --- propose: called by agents (service-role) or authenticated dashboard users ---
    const body = (await req.json()) as ProposeBody;
    if (!body.company_id || !body.agent_id || !body.action_type) {
      return new Response(
        JSON.stringify({ error: "company_id, agent_id, action_type required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Auth: caller must be service-role OR a user in body.company_id (platform_admin bypass).
    const proposeAuthz = await authorizeInternalRequest(req, body.company_id);
    if (!proposeAuthz.ok) {
      return new Response(JSON.stringify({ error: proposeAuthz.error }), {
        status: proposeAuthz.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve any leftover canonical URL placeholders server-side.
    let companyName = "your business";
    try {
      const { data: co } = await supabase
        .from("companies")
        .select("name")
        .eq("id", body.company_id)
        .maybeSingle();
      if (co?.name) companyName = co.name;
    } catch (_e) { /* ignore */ }
    body.payload = hydrateTokens(body.payload ?? {}, companyName) as Record<string, unknown>;

    const confidence = Math.max(0, Math.min(1, body.confidence ?? 0.5));
    const risk: Risk = body.risk_tier ?? "medium";
    const valueUsd = body.estimated_value_usd ?? 0;

    // load autonomy settings (default if missing)
    const { data: settings } = await supabase
      .from("company_agent_autonomy")
      .select("*")
      .eq("company_id", body.company_id)
      .eq("agent_id", body.agent_id)
      .maybeSingle();

    const mode: Mode = (settings?.mode as Mode) ?? "suggest";
    const threshold = Number(settings?.confidence_threshold ?? 0.8);
    const maxValueUsd = Number(settings?.max_value_usd ?? 100);
    const dailyCap = Number(settings?.daily_action_cap ?? 50);
    const quietStart = settings?.quiet_hours_start ?? null;
    const quietEnd = settings?.quiet_hours_end ?? null;

    // daily count
    const since = new Date();
    since.setUTCHours(0, 0, 0, 0);
    const { count } = await supabase
      .from("agent_proposed_actions")
      .select("id", { count: "exact", head: true })
      .eq("company_id", body.company_id)
      .eq("agent_id", body.agent_id)
      .eq("status", "auto_executed")
      .gte("created_at", since.toISOString());

    const decision = shouldAutoExecute({
      mode,
      risk,
      confidence,
      threshold,
      valueUsd,
      maxValueUsd,
      dailyCount: count ?? 0,
      dailyCap,
      quietStart,
      quietEnd,
    });

    const expires = body.expires_in_hours
      ? new Date(Date.now() + body.expires_in_hours * 3600_000).toISOString()
      : new Date(Date.now() + 72 * 3600_000).toISOString();

    // If auto-executing, run the side-effect first; if it throws, fall back to pending.
    let status = decision.auto ? "auto_executed" : "pending";
    let resultSummary = decision.auto ? "auto-executed" : decision.reason;
    if (decision.auto) {
      try {
        resultSummary = await applyAction(
          supabase,
          body.company_id,
          body.action_type,
          body.payload ?? {},
        );
      } catch (sideErr) {
        status = "pending";
        const msg = sideErr instanceof Error ? sideErr.message : String(sideErr);
        resultSummary = `auto failed, queued: ${msg}`;
      }
    }
    const { data: inserted, error: insErr } = await supabase
      .from("agent_proposed_actions")
      .insert({
        company_id: body.company_id,
        agent_id: body.agent_id,
        action_type: body.action_type,
        payload: body.payload ?? {},
        reverse_payload: body.reverse_payload ?? null,
        risk_tier: risk,
        confidence,
        estimated_value_usd: valueUsd,
        requested_by_event: body.requested_by_event ?? null,
        status,
        executed_at: status === "auto_executed" ? new Date().toISOString() : null,
        result_summary: resultSummary,
        expires_at: expires,
      })
      .select()
      .single();
    if (insErr) throw insErr;

    return new Response(
      JSON.stringify({
        ok: true,
        decision: status === "auto_executed" ? "auto_executed" : "queued",
        reason: decision.reason,
        action: inserted,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});