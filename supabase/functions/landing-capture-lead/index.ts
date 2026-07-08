import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { insertAuraInterceptLead } from "../_shared/insert-landing-lead.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const result = await insertAuraInterceptLead({
      name,
      email: email || null,
      phone: phone || null,
      industry: industry || null,
      notes: notes || null,
      source,
    });

    if (!result.ok) {
      console.error("[landing-capture-lead] insert error:", result.error);
      return new Response(JSON.stringify({ error: "Could not save lead" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, id: result.id, deduped: result.deduped }), {
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