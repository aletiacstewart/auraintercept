import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { AURA_INTERCEPT_TEXT_PROMPT } from "../_shared/aura-intercept-sales-prompt.ts";
import { callAIGatewayWithFallback } from "../_shared/ai-gateway.ts";
import { extractContact, insertAuraInterceptLead } from "../_shared/insert-landing-lead.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple in-memory rate limiter (per IP, resets on function cold start)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20; // max requests
const RATE_WINDOW_MS = 60_000; // per minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  if (entry.count >= RATE_LIMIT) return true;
  entry.count++;
  return false;
}

const AURA_SYSTEM_PROMPT = AURA_INTERCEPT_TEXT_PROMPT;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting by IP
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(clientIp)) {
    return new Response(JSON.stringify({ error: "Too many requests. Please slow down." }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!body || typeof body !== "object" || !("messages" in body)) {
      return new Response(JSON.stringify({ error: "Missing required field: messages" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages } = body as { messages: unknown };

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages must be a non-empty array" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (messages.length > 50) {
      return new Response(JSON.stringify({ error: "Too many messages in history" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    for (const msg of messages) {
      if (!msg || typeof msg !== "object" || !("role" in msg) || !("content" in msg)) {
        return new Response(JSON.stringify({ error: "Each message must have role and content" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { role, content } = msg as { role: unknown; content: unknown };
      if (!["user", "assistant"].includes(String(role))) {
        return new Response(JSON.stringify({ error: "Invalid message role" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (typeof content !== "string" || content.length > 4000) {
        return new Response(JSON.stringify({ error: "Message content must be a string under 4000 characters" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Safety-net lead capture: if the visitor has pasted an email or phone
    // number anywhere in the transcript, save a lead under Aura Intercept
    // even if the model forgets to emit the [[LEAD]] marker. Best-effort,
    // deduped in the helper so it never spams the leads console.
    try {
      const userText = (messages as Array<{ role: string; content: string }>)
        .filter((m) => m.role === "user")
        .map((m) => m.content)
        .join("\n");
      const { email, phone } = extractContact(userText);
      if (email || phone) {
        // Naive name pull: line like "I'm Jane Doe" / "This is Jane" / "my name is Jane"
        const nameMatch = userText.match(
          /(?:i['’ ]?m|i am|this is|my name is|name[:\s]+)\s+([A-Z][A-Za-z'’\-]+(?:\s+[A-Z][A-Za-z'’\-]+){0,3})/,
        );
        // Fire-and-forget — don't block the stream on the DB write.
        insertAuraInterceptLead({
          name: nameMatch?.[1]?.trim() ?? null,
          email: email ?? null,
          phone: phone ?? null,
          source: "message_aura_website",
          notes: userText.slice(-1500),
        }).catch((e) => console.error("[landing-chat] safety-net insert failed:", e));
      }
    } catch (e) {
      console.error("[landing-chat] safety-net scan error:", e);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { response: response, modelUsed: responseModel, fellBackFromPrimary: responseFellBack } = await callAIGatewayWithFallback({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: AURA_SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      });
    if (responseFellBack) console.warn(`[landing-chat] primary model unavailable, served by ${responseModel}`);

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("AI gateway error:", response.status);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Landing chat error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
