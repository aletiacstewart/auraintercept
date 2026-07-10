import { createClient } from "npm:@supabase/supabase-js@2";
import { requireCronSecret } from "../_shared/cron-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

// Scan all active companies for customers who haven't been serviced in >90 days
// and fire the send-campaign function with a winback offer if one is configured.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const denied = await requireCronSecret(req, corsHeaders);
  if (denied) return denied;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: offers } = await supabase
    .from("winback_offers")
    .select("id, company_id, name, discount_percent, discount_amount, expires_at, is_active")
    .eq("is_active", true);

  if (!offers?.length) {
    return new Response(JSON.stringify({ processed: 0, reason: "no_active_offers" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const results: Array<{ company_id: string; offer_id: string; sent: number; error?: string }> = [];

  for (const offer of offers) {
    try {
      // Find customers whose most recent appointment predates the cutoff.
      const { data: stale } = await supabase
        .from("customer_profiles")
        .select("id, email, phone, name, last_service_at")
        .eq("company_id", offer.company_id)
        .lt("last_service_at", cutoff)
        .eq("email_opt_out", false)
        .not("email", "is", null)
        .limit(200);

      if (!stale?.length) {
        results.push({ company_id: offer.company_id, offer_id: offer.id, sent: 0 });
        continue;
      }

      // Per-company cooldown: bail if we already ran winback for this offer within 7d.
      const { count } = await supabase
        .from("campaign_sends")
        .select("id", { count: "exact", head: true })
        .eq("company_id", offer.company_id)
        .eq("campaign_type", "winback")
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if ((count ?? 0) > 0) {
        results.push({ company_id: offer.company_id, offer_id: offer.id, sent: 0, error: "cooldown" });
        continue;
      }

      const invokeUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-campaign`;
      const resp = await fetch(invokeUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          apikey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        },
        body: JSON.stringify({
          company_id: offer.company_id,
          campaign_type: "winback",
          offer_id: offer.id,
          recipients: stale.map((s) => ({ email: s.email, name: s.name, phone: s.phone })),
        }),
      });

      results.push({
        company_id: offer.company_id,
        offer_id: offer.id,
        sent: resp.ok ? stale.length : 0,
        error: resp.ok ? undefined : `send-campaign ${resp.status}`,
      });
    } catch (e) {
      results.push({
        company_id: offer.company_id,
        offer_id: offer.id,
        sent: 0,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return new Response(JSON.stringify({ processed: results.length, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});