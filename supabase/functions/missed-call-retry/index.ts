import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const MAX_ATTEMPTS = 3;
const RETRY_SPACING_MINUTES = 15;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  // Optional cron secret check — if the shared secret is present, require it.
  const { data: secretRow } = await supabase
    .from("_cron_shared_secret")
    .select("secret")
    .eq("id", 1)
    .maybeSingle();

  if (secretRow?.secret) {
    const provided = req.headers.get("x-cron-secret");
    if (provided !== secretRow.secret) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  try {
    const { data: pending, error } = await supabase
      .from("missed_call_callbacks")
      .select("id, company_id, customer_phone, customer_name, attempt_number, scheduled_at, sms_fallback_sent")
      .eq("status", "pending")
      .lte("scheduled_at", new Date().toISOString())
      .lt("attempt_number", MAX_ATTEMPTS + 1)
      .limit(50);

    if (error) throw error;

    console.log(`[missed-call-retry] Found ${pending?.length ?? 0} pending callbacks`);

    const results: Array<Record<string, unknown>> = [];
    for (const cb of pending ?? []) {
      // Mark as initiated first to avoid double-fire on concurrent runs.
      const { error: lockErr } = await supabase
        .from("missed_call_callbacks")
        .update({
          status: "initiated",
          initiated_at: new Date().toISOString(),
        })
        .eq("id", cb.id)
        .eq("status", "pending");

      if (lockErr) {
        console.error(`[missed-call-retry] lock failed for ${cb.id}:`, lockErr);
        continue;
      }

      // Fire outbound-call
      const callResp = await fetch(`${supabaseUrl}/functions/v1/outbound-call`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceKey}`,
          apikey: serviceKey,
        },
        body: JSON.stringify({
          companyId: cb.company_id,
          customerPhone: cb.customer_phone,
          customerName: cb.customer_name || "Customer",
          purpose: "missed_call_callback",
        }),
      });

      const ok = callResp.ok;
      const nextAttempt = (cb.attempt_number ?? 1) + 1;

      if (ok) {
        // Leave status as 'initiated'; downstream call webhook will finalize.
        results.push({ id: cb.id, status: "initiated" });
      } else if (nextAttempt > MAX_ATTEMPTS) {
        // Give up — mark failed.
        await supabase
          .from("missed_call_callbacks")
          .update({
            status: "failed",
            completed_at: new Date().toISOString(),
            error_message: `outbound-call ${callResp.status}`,
          })
          .eq("id", cb.id);
        results.push({ id: cb.id, status: "failed" });
      } else {
        // Reschedule
        await supabase
          .from("missed_call_callbacks")
          .update({
            status: "pending",
            attempt_number: nextAttempt,
            scheduled_at: new Date(Date.now() + RETRY_SPACING_MINUTES * 60_000).toISOString(),
            error_message: `outbound-call ${callResp.status}`,
          })
          .eq("id", cb.id);
        results.push({ id: cb.id, status: "rescheduled", nextAttempt });
      }
    }

    return new Response(
      JSON.stringify({ processed: results.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    console.error("[missed-call-retry] error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});