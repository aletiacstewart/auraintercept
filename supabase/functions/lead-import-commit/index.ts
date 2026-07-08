import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { authorizeInternalRequest } from "../_shared/internal-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { job_id, approve_all, row_ids } = await req.json() as { job_id: string; approve_all?: boolean; row_ids?: string[] };
    if (!job_id) return new Response(JSON.stringify({ ok: false, error: "job_id required" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: job } = await supabase.from("lead_import_jobs").select("*").eq("id", job_id).single();
    if (!job) throw new Error("job not found");

    const authz = await authorizeInternalRequest(req, job.company_id);
    if (!authz.ok) {
      return new Response(JSON.stringify({ ok: false, error: authz.error }), {
        status: authz.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.from("lead_import_jobs").update({ status: "importing" }).eq("id", job_id);

    let q = supabase.from("lead_import_rows").select("*").eq("job_id", job_id).neq("decision", "imported").neq("decision", "rejected").neq("decision", "duplicate");
    if (!approve_all && row_ids?.length) q = q.in("id", row_ids);
    const { data: rows } = await q;

    let imported = 0, errors = 0;
    for (const r of rows || []) {
      try {
        const n = r.normalized as any;
        const { data: ins, error } = await supabase.from("leads").insert({
          company_id: job.company_id,
          name: n.name || n.email || n.phone || "Imported Lead",
          email: n.email || null,
          phone: n.phone || null,
          address: n.address || null,
          source: n.source || "bulk_import",
          notes: n.notes || null,
          status: "new",
        }).select("id").single();
        if (error) throw error;
        await supabase.from("lead_import_rows").update({ decision: "imported", imported_lead_id: ins.id }).eq("id", r.id);
        imported++;
      } catch (e) {
        await supabase.from("lead_import_rows").update({ decision: "error", error: String((e as Error).message || e) }).eq("id", r.id);
        errors++;
      }
    }

    // Recount totals
    const { count: pending } = await supabase.from("lead_import_rows").select("*", { count: "exact", head: true }).eq("job_id", job_id).eq("decision", "pending");
    const finalStatus = (pending || 0) > 0 ? "ready_for_review" : "completed";

    await supabase.from("lead_import_jobs").update({
      status: finalStatus,
      imported_count: (job.imported_count || 0) + imported,
      error_count: (job.error_count || 0) + errors,
    }).eq("id", job_id);

    // Trigger CRM push (best-effort)
    try {
      await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/crm-sync-leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` },
        body: JSON.stringify({ company_id: job.company_id, mode: "push" }),
      });
    } catch {}

    return new Response(JSON.stringify({ ok: true, imported, errors }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String((e as Error).message || e) }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});