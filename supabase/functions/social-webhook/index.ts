import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);

  // ── Meta Webhook Verification (GET) ──
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    const VERIFY_TOKEN = Deno.env.get("META_WEBHOOK_VERIFY_TOKEN");

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("Meta webhook verified successfully");
      return new Response(challenge, {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      });
    }

    console.error("Meta webhook verification failed", { mode, token });
    return new Response("Forbidden", { status: 403, headers: corsHeaders });
  }

  // ── Meta Webhook Events (POST) ──
  if (req.method === "POST") {
    try {
      const body = await req.text();
      let payload: any;
      try {
        payload = JSON.parse(body);
      } catch {
        console.error("Invalid JSON body:", body.slice(0, 200));
        return new Response("Bad Request", { status: 400, headers: corsHeaders });
      }

      console.log("Meta webhook event received:", JSON.stringify(payload).slice(0, 500));

      // Meta requires a 200 response quickly
      return new Response("EVENT_RECEIVED", {
        status: 200,
        headers: corsHeaders,
      });
    } catch (err) {
      console.error("Webhook processing error:", err);
      return new Response("Internal Server Error", {
        status: 500,
        headers: corsHeaders,
      });
    }
  }

  return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
});
