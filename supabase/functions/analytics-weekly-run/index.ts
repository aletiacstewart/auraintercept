import { createClient } from "npm:@supabase/supabase-js@2";
import { requireCronSecret } from "../_shared/cron-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

// Runs the analytics_intelligence operative weekly for every active company and
// writes the resulting recommendations into agent_proposed_actions so admins
// see them in the same approve/reject queue as other proposals.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const denied = await requireCronSecret(req, corsHeaders);
  if (denied) return denied;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: companies } = await supabase
    .from("companies")
    .select("id")
    .not("subscription_tier", "is", null)
    .eq("is_demo", false);

  const invokeUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/ai-agent`;
  const results: Array<{ company_id: string; ok: boolean; proposals?: number; error?: string }> = [];

  for (const c of companies ?? []) {
    try {
      const resp = await fetch(invokeUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          apikey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        },
        body: JSON.stringify({
          agent_type: "analytics_intelligence",
          company_id: c.id,
          action: "weekly_review",
          prompt: "Produce this week's top 3 revenue/retention actions as a JSON array of {title, description, action_type}.",
        }),
      });
      if (!resp.ok) {
        results.push({ company_id: c.id, ok: false, error: `${resp.status}` });
        continue;
      }
      const body = await resp.json().catch(() => ({}));
      const recs: Array<{ title?: string; description?: string; action_type?: string }> = Array.isArray(body?.recommendations)
        ? body.recommendations
        : Array.isArray(body?.actions)
        ? body.actions
        : [];

      if (recs.length) {
        await supabase.from("agent_proposed_actions").insert(
          recs.slice(0, 5).map((r) => ({
            company_id: c.id,
            agent_type: "analytics_intelligence",
            action_type: r.action_type || "analytics_recommendation",
            title: r.title || "Weekly recommendation",
            description: r.description || "",
            payload: { source: "analytics_weekly_run" },
            status: "pending",
            confidence: 0.7,
            source: "analytics_weekly_run",
          }))
        );
      }
      results.push({ company_id: c.id, ok: true, proposals: recs.length });
    } catch (e) {
      results.push({ company_id: c.id, ok: false, error: e instanceof Error ? e.message : String(e) });
    }
  }

  return new Response(JSON.stringify({ processed: results.length, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});