import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ALLOWED_TYPES = new Set([
  "chat_opened",
  "message_sent",
  "voice_started",
  "voice_ended",
]);

const ALLOWED_ROLES = new Set(["user", "assistant"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const website_id = typeof body.website_id === "string" ? body.website_id : "";
    const interaction_type = typeof body.interaction_type === "string" ? body.interaction_type : "";
    const visitor_fingerprint = typeof body.visitor_fingerprint === "string"
      ? body.visitor_fingerprint.slice(0, 128)
      : null;
    const message_role = typeof body.message_role === "string" && ALLOWED_ROLES.has(body.message_role)
      ? body.message_role
      : null;
    const message_preview = typeof body.message_preview === "string"
      ? body.message_preview.slice(0, 200)
      : null;
    const duration_seconds = Number.isFinite(body.duration_seconds)
      ? Math.max(0, Math.min(7200, Math.floor(body.duration_seconds)))
      : null;

    // Strict UUID + allow-listed interaction type
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRe.test(website_id) || !ALLOWED_TYPES.has(interaction_type)) {
      return new Response(JSON.stringify({ error: "invalid input" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    // Confirm website exists (mirrors prior RLS check)
    const { data: site } = await supabase
      .from("smart_websites")
      .select("id")
      .eq("id", website_id)
      .maybeSingle();
    if (!site) {
      return new Response(JSON.stringify({ error: "unknown website" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error } = await supabase.from("site_chat_logs").insert({
      website_id,
      interaction_type,
      visitor_fingerprint,
      message_role,
      message_preview,
      duration_seconds,
    });
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