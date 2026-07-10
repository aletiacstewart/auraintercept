import { createClient } from "npm:@supabase/supabase-js@2";
import { requireCronSecret } from "../_shared/cron-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

// Sends any campaign_sends rows whose scheduled_at is due and status is 'pending'.
// Removes the need for a per-send manual "Send now" click after a series is generated.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const denied = await requireCronSecret(req, corsHeaders);
  if (denied) return denied;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: due } = await supabase
    .from("campaign_sends")
    .select("id, company_id, campaign_id, channel, scheduled_at")
    .eq("status", "pending")
    .lte("scheduled_at", new Date().toISOString())
    .limit(100);

  if (!due?.length) {
    return new Response(JSON.stringify({ processed: 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const invokeUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-campaign`;
  const results: Array<{ id: string; ok: boolean; error?: string }> = [];

  for (const row of due) {
    // Mark queued first to prevent double-fire on overlapping cron ticks.
    await supabase.from("campaign_sends").update({ status: "queued" }).eq("id", row.id).eq("status", "pending");

    try {
      const resp = await fetch(invokeUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          apikey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        },
        body: JSON.stringify({ campaign_send_id: row.id, campaign_id: row.campaign_id, company_id: row.company_id }),
      });
      const status = resp.ok ? "sent" : "failed";
      await supabase.from("campaign_sends").update({ status, sent_at: resp.ok ? new Date().toISOString() : null }).eq("id", row.id);
      results.push({ id: row.id, ok: resp.ok, error: resp.ok ? undefined : `${resp.status}` });
    } catch (e) {
      await supabase.from("campaign_sends").update({ status: "failed" }).eq("id", row.id);
      results.push({ id: row.id, ok: false, error: e instanceof Error ? e.message : String(e) });
    }
  }

  return new Response(JSON.stringify({ processed: results.length, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});