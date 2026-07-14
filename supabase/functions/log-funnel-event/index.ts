import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ALLOWED_TYPES = new Set([
  "page_view",
  "chat_opened",
  "chat_message_sent",
  "pricing_viewed",
  "pricing_expanded",
  "demo_cta_clicked",
  "auth_started",
  "signup_completed",
  "checkout_completed",
]);

function cap(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const trimmed = v.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const session_id = cap(body.session_id, 64);
    const event_type = typeof body.event_type === "string" ? body.event_type : "";

    if (!session_id || !ALLOWED_TYPES.has(event_type)) {
      return new Response(JSON.stringify({ error: "invalid input" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const row = {
      session_id,
      event_type,
      page_path: cap(body.page_path, 300),
      industry: cap(body.industry, 64),
      tier: cap(body.tier, 64),
      utm_source: cap(body.utm_source, 128),
      utm_medium: cap(body.utm_medium, 128),
      utm_campaign: cap(body.utm_campaign, 128),
      referrer: cap(body.referrer, 300),
      company_id: cap(body.company_id, 64),
    };

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const { error } = await supabase.from("marketing_funnel_events").insert(row);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error)?.message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});