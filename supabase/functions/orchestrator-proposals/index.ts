import { createClient } from "npm:@supabase/supabase-js@2";
import { requireCronSecret } from "../_shared/cron-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

// Detects idle patterns across every active company and queues rows in
// agent_proposed_actions for the existing approve/reject UI to consume.
// Per-company cooldown = 24h per action_type to avoid queue spam.

type Proposal = {
  company_id: string;
  agent_type: string;
  action_type: string;
  title: string;
  description: string;
  payload: Record<string, unknown>;
};

async function alreadyProposed(
  supabase: ReturnType<typeof createClient>,
  company_id: string,
  action_type: string,
  target_ref: string
): Promise<boolean> {
  const { count } = await supabase
    .from("agent_proposed_actions")
    .select("id", { count: "exact", head: true })
    .eq("company_id", company_id)
    .eq("action_type", action_type)
    .contains("payload", { target_ref })
    .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
  return (count ?? 0) > 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const denied = await requireCronSecret(req, corsHeaders);
  if (denied) return denied;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const proposals: Proposal[] = [];
  const now = Date.now();
  const h48 = new Date(now - 48 * 60 * 60 * 1000).toISOString();
  const h2 = new Date(now - 2 * 60 * 60 * 1000).toISOString();
  const d14 = new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString();

  // 1) Uncontacted leads > 48h
  const { data: staleLeads } = await supabase
    .from("leads")
    .select("id, company_id, name, phone, email, last_activity_at, created_at")
    .lt("last_activity_at", h48)
    .in("status", ["new", "contacted"])
    .limit(200);

  for (const l of staleLeads ?? []) {
    if (await alreadyProposed(supabase, l.company_id, "contact_stale_lead", l.id)) continue;
    proposals.push({
      company_id: l.company_id,
      agent_type: "outreach",
      action_type: "contact_stale_lead",
      title: `Reach out to ${l.name || "lead"}`,
      description: `No activity in 48h. Send a follow-up SMS/email.`,
      payload: { target_ref: l.id, lead_id: l.id, phone: l.phone, email: l.email },
    });
  }

  // 2) Appointments still unassigned > 2h from now
  const { data: unassigned } = await supabase
    .from("appointments")
    .select("id, company_id, customer_name, datetime, status")
    .in("status", ["scheduled", "pending"])
    .gt("datetime", new Date().toISOString())
    .lt("datetime", new Date(now + 6 * 60 * 60 * 1000).toISOString())
    .limit(200);

  for (const a of unassigned ?? []) {
    // Only propose if no job assignment has an employee yet
    const { data: ja } = await supabase
      .from("job_assignments")
      .select("employee_id")
      .eq("appointment_id", a.id)
      .not("employee_id", "is", null)
      .maybeSingle();
    if (ja?.employee_id) continue;
    if (await alreadyProposed(supabase, a.company_id, "assign_technician", a.id)) continue;
    proposals.push({
      company_id: a.company_id,
      agent_type: "dispatch",
      action_type: "assign_technician",
      title: `Assign tech for ${a.customer_name || "job"}`,
      description: `Appointment at ${a.datetime} has no technician assigned yet.`,
      payload: { target_ref: a.id, appointment_id: a.id },
    });
  }

  // 3) Invoices unpaid > 14d
  const { data: unpaid } = await supabase
    .from("invoices")
    .select("id, company_id, customer_name, amount_total, status, created_at")
    .in("status", ["sent", "overdue", "pending"])
    .lt("created_at", d14)
    .limit(200);

  for (const inv of unpaid ?? []) {
    if (await alreadyProposed(supabase, inv.company_id, "chase_unpaid_invoice", inv.id)) continue;
    proposals.push({
      company_id: inv.company_id,
      agent_type: "business_finance",
      action_type: "chase_unpaid_invoice",
      title: `Chase unpaid invoice for ${inv.customer_name || "customer"}`,
      description: `Invoice unpaid for 14+ days. Send reminder or make a call.`,
      payload: { target_ref: inv.id, invoice_id: inv.id, amount: inv.amount_total },
    });
  }

  if (proposals.length) {
    await supabase.from("agent_proposed_actions").insert(
      proposals.map((p) => ({
        company_id: p.company_id,
        agent_type: p.agent_type,
        action_type: p.action_type,
        title: p.title,
        description: p.description,
        payload: p.payload,
        status: "pending",
        confidence: 0.75,
        source: "orchestrator_proposals",
      }))
    );
  }

  return new Response(JSON.stringify({ queued: proposals.length }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});