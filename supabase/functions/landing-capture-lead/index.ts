import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Aura Intercept's own company — leads from the marketing site land here so the
// internal sales team sees them in the standard leads console.
const AURA_INTERCEPT_COMPANY_ID = "04c57cbe-358e-4036-a3ad-b777a55f5be0";

// Per-IP rate limit (resets on cold start).
const limiter = new Map<string, { count: number; resetAt: number }>();
const RATE = 5;
const WINDOW_MS = 60_000;

function rateLimited(ip: string) {
  const now = Date.now();
  const e = limiter.get(ip);
  if (!e || now > e.resetAt) {
    limiter.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  if (e.count >= RATE) return true;
  e.count++;
  return false;
}

function clamp(v: unknown, max: number): string {
  if (typeof v !== "string") return "";
  return v.trim().slice(0, max);
}

function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (rateLimited(ip)) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return new Response(JSON.stringify({ error: "Invalid body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const name = clamp((body as any).name, 120);
    const email = clamp((body as any).email, 200).toLowerCase();
    const phone = clamp((body as any).phone, 40);
    const industry = clamp((body as any).industry, 60);
    const notes = clamp((body as any).notes, 1000);
    const source = clamp((body as any).source, 40) || "talk_to_aura_website";

    if (!name || (!email && !phone)) {
      return new Response(JSON.stringify({ error: "name plus email or phone is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (email && !isEmail(email)) {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const { data, error } = await admin
      .from("leads")
      .insert({
        company_id: AURA_INTERCEPT_COMPANY_ID,
        name,
        email: email || null,
        phone: phone || null,
        source,
        intent: "demo_request",
        service_interest: industry || null,
        notes: notes || null,
        priority: "high",
        status: "new",
        score: 75,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[landing-capture-lead] insert error:", error);
      return new Response(JSON.stringify({ error: "Could not save lead" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, id: data?.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[landing-capture-lead] error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});