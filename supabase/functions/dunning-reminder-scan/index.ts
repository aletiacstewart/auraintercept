import { createClient } from "npm:@supabase/supabase-js@2";
import { requireCronSecret } from "../_shared/cron-auth.ts";

// Daily dunning-reminder scan. Cron-only (see requireCronSecret + config.toml
// verify_jwt = false). For each company where payment_status='past_due', we
// send exactly one email per day-mark [0, 3, 6] since payment_failed_at, using
// dunning_reminders_sent[] as idempotency. Once grace_period_ends_at has
// passed and payment is still not recovered, flip status to 'suspended' and
// emit subscription_suspended (feature gating is intentionally out of scope in
// this pass — status flag only).

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const FROM = "Aura Intercept <ai@auraintercept.ai>";
const SITE_URL = "https://auraintercept.ai";
const DAY_MARKS = [0, 3, 6] as const;

type DunningDay = (typeof DAY_MARKS)[number];

function subjectFor(day: DunningDay): string {
  if (day === 0) return "Your Aura Intercept payment didn't go through";
  if (day === 3) return "Reminder: update your card to keep Aura Intercept running";
  return "Final notice: update your card today or access pauses tomorrow";
}

function bodyFor(day: DunningDay, companyName: string, portalUrl: string): string {
  const heading =
    day === 0
      ? "We couldn't charge your card"
      : day === 3
        ? `${7 - day} days left before access pauses`
        : "Last chance — access pauses tomorrow";

  const intro =
    day === 0
      ? "Your most recent Aura Intercept invoice didn't go through. This usually means an expired card, a hold from your bank, or a billing address mismatch."
      : day === 3
        ? "Your card is still declined. You have a few days left in your grace period before your Aura Intercept account is suspended."
        : "Your grace period ends tomorrow. If we can't collect payment by then, your account will be suspended and your AI agents will stop working.";

  return `<!doctype html>
<html><body style="font-family:-apple-system,Segoe UI,sans-serif;background:#f7f8fb;padding:24px;color:#0f172a">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;border:1px solid #e2e8f0">
    <div style="color:#0e94a3;font-weight:600;letter-spacing:0.08em;font-size:12px">AURA INTERCEPT</div>
    <h1 style="font-size:22px;margin:12px 0 4px">${heading}</h1>
    <p style="color:#475569;margin:16px 0">Hi ${companyName || "there"},</p>
    <p style="color:#334155;line-height:1.55">${intro}</p>
    <p style="margin:28px 0">
      <a href="${portalUrl}" style="background:#0e94a3;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;display:inline-block">Update payment method</a>
    </p>
    <p style="color:#64748b;font-size:13px;line-height:1.5">
      One click opens your secure billing portal — no login needed. Questions? Reply to this email and we'll help right away.
    </p>
    <p style="color:#94a3b8;font-size:12px;margin-top:32px">— Aura Intercept · <a href="${SITE_URL}" style="color:#94a3b8">${SITE_URL}</a></p>
  </div>
</body></html>`;
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) {
    console.error("[dunning-reminder-scan] RESEND_API_KEY missing");
    return false;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  });
  if (!res.ok) {
    console.error("[dunning-reminder-scan] resend failed", res.status, await res.text());
    return false;
  }
  return true;
}

async function emitOrchestratorEvent(
  companyId: string,
  eventType: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  try {
    await fetch(`${supabaseUrl}/functions/v1/ai-orchestrator`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        action: "emit_event",
        companyId,
        agentType: "dunning_scan",
        eventType,
        payload,
      }),
    });
  } catch (err) {
    console.error(`[dunning-reminder-scan] failed to emit ${eventType}:`, err);
  }
}

async function generatePortalUrl(customerId: string, stripeKey: string): Promise<string | null> {
  try {
    const res = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        customer: customerId,
        return_url: `${SITE_URL}/dashboard/subscription`,
      }),
    });
    if (!res.ok) {
      console.error("[dunning-reminder-scan] portal session failed", res.status, await res.text());
      return null;
    }
    const json = (await res.json()) as { url?: string };
    return json.url ?? null;
  } catch (err) {
    console.error("[dunning-reminder-scan] portal session error:", err);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const denied = await requireCronSecret(req, corsHeaders);
  if (denied) return denied;

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeKey) {
    return new Response(JSON.stringify({ error: "STRIPE_SECRET_KEY not set" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: pastDue, error } = await supabase
    .from("companies")
    .select(
      "id, name, email, stripe_customer_id, payment_failed_at, grace_period_ends_at, dunning_reminders_sent, payment_status",
    )
    .eq("payment_status", "past_due");

  if (error) {
    console.error("[dunning-reminder-scan] query failed:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const now = Date.now();
  const results: Array<{
    company_id: string;
    action: "email_sent" | "suspended" | "skipped" | "email_failed";
    day?: number;
  }> = [];

  for (const c of pastDue ?? []) {
    // Suspension check first — flip status if grace period expired.
    if (c.grace_period_ends_at && new Date(c.grace_period_ends_at).getTime() < now) {
      const { error: updErr } = await supabase
        .from("companies")
        .update({ payment_status: "suspended" })
        .eq("id", c.id);
      if (updErr) {
        console.error("[dunning-reminder-scan] suspend update failed:", updErr);
      } else {
        await emitOrchestratorEvent(c.id, "subscription_suspended", {});
        results.push({ company_id: c.id, action: "suspended" });
      }
      continue;
    }

    if (!c.payment_failed_at || !c.email || !c.stripe_customer_id) {
      results.push({ company_id: c.id, action: "skipped" });
      continue;
    }

    const daysSince = Math.floor((now - new Date(c.payment_failed_at).getTime()) / (24 * 60 * 60 * 1000));
    const alreadySent = new Set(c.dunning_reminders_sent ?? []);
    // Only send one email per invocation — highest eligible day-mark.
    const eligible = DAY_MARKS.filter((d) => daysSince >= d && !alreadySent.has(d));
    if (eligible.length === 0) {
      results.push({ company_id: c.id, action: "skipped" });
      continue;
    }
    const day = eligible[eligible.length - 1];

    const portalUrl = (await generatePortalUrl(c.stripe_customer_id, stripeKey))
      ?? `${SITE_URL}/dashboard/subscription`;

    const ok = await sendEmail(c.email, subjectFor(day), bodyFor(day, c.name ?? "", portalUrl));
    if (!ok) {
      results.push({ company_id: c.id, action: "email_failed", day });
      continue;
    }

    const nextSent = Array.from(new Set([...(c.dunning_reminders_sent ?? []), day])).sort();
    const { error: markErr } = await supabase
      .from("companies")
      .update({ dunning_reminders_sent: nextSent })
      .eq("id", c.id);
    if (markErr) console.error("[dunning-reminder-scan] mark-sent update failed:", markErr);

    results.push({ company_id: c.id, action: "email_sent", day });
  }

  return new Response(
    JSON.stringify({ processed: results.length, results }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
  );
});