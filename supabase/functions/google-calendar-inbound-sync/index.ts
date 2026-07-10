import { createClient } from "npm:@supabase/supabase-js@2";
import { requireCronSecret } from "../_shared/cron-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

// Pull inbound Google Calendar changes for every company with an active sync,
// so external edits made in Google appear in Aura without a manual "Sync" click.
// Delegates the per-company sync work to the existing google-calendar-sync fn.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const denied = await requireCronSecret(req, corsHeaders);
  if (denied) return denied;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: connections } = await supabase
    .from("google_calendar_connections")
    .select("company_id")
    .eq("sync_enabled", true);

  const invokeUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/google-calendar-sync`;
  const results: Array<{ company_id: string; ok: boolean; error?: string }> = [];

  for (const conn of connections ?? []) {
    try {
      const resp = await fetch(invokeUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          apikey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        },
        body: JSON.stringify({ action: "pull_remote", companyId: conn.company_id }),
      });
      results.push({ company_id: conn.company_id, ok: resp.ok, error: resp.ok ? undefined : `${resp.status}` });
    } catch (e) {
      results.push({ company_id: conn.company_id, ok: false, error: e instanceof Error ? e.message : String(e) });
    }
  }

  return new Response(JSON.stringify({ processed: results.length, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});