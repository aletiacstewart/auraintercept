import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BodySchema = z.object({
  company_id: z.string().uuid(),
  customer_id: z.string().uuid().optional(),
  carrier: z.string().min(1).max(120),
  member_id: z.string().min(1).max(80),
  group_number: z.string().max(80).optional(),
  policyholder_name: z.string().min(1).max(160),
  policyholder_dob: z.string().optional(),
  photo_url: z.string().url().optional(),
  notes: z.string().max(1000).optional(),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const json = await req.json();
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const data = parsed.data;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1) Insert verification request
    const { data: ivr, error: ivrErr } = await supabase
      .from("insurance_verification_requests")
      .insert({
        company_id: data.company_id,
        customer_id: data.customer_id ?? null,
        carrier: data.carrier,
        member_id: data.member_id,
        group_number: data.group_number ?? null,
        policyholder_name: data.policyholder_name,
        policyholder_dob: data.policyholder_dob ?? null,
        photo_url: data.photo_url ?? null,
        notes: data.notes ?? null,
        status: "pending",
      })
      .select()
      .single();

    if (ivrErr) throw ivrErr;

    // 2) Notify front desk via existing staff notification flow
    const message =
      `New insurance verification request\n` +
      `Carrier: ${data.carrier}\n` +
      `Member ID: ${data.member_id}\n` +
      (data.group_number ? `Group: ${data.group_number}\n` : "") +
      `Policyholder: ${data.policyholder_name}` +
      (data.policyholder_dob ? ` (DOB ${data.policyholder_dob})` : "") +
      (data.notes ? `\nNotes: ${data.notes}` : "");

    await supabase.functions.invoke("send-staff-notification", {
      body: {
        companyId: data.company_id,
        notificationType: "new_email",
        title: "Insurance Verification Requested",
        message,
        metadata: { ivr_id: ivr.id, customer_id: data.customer_id ?? null },
        recipientRole: "company_admin",
      },
    });

    // 3) Fan out to connected integrations (best-effort)
    try {
      await supabase.functions.invoke("dispatch-integrations", {
        body: {
          company_id: data.company_id,
          event: "insurance.verification_requested",
          payload: { ivr_id: ivr.id, summary: message },
        },
      });
    } catch (e) {
      console.warn("dispatch-integrations failed:", e);
    }

    return new Response(
      JSON.stringify({ ok: true, id: ivr.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("verify-insurance error:", err);
    return new Response(
      JSON.stringify({ error: String(err?.message ?? err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});