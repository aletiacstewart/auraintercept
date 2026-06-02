import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

const AURA_SYSTEM_PROMPT = `You are Aura, the helpful and knowledgeable AI assistant for the Aura Intercept platform.

About Aura Intercept:
- Aura Intercept is a Multi-Agent Orchestration Engine designed for appointment-based service businesses (HVAC, plumbing, electrical, landscaping, restaurants, salons, etc.)
- It provides 24 Smart AI Agents organized into 7 Control Centers (Consoles): Customer Portal, Outreach & Sales Ops, Social Media Ops, Creative & Web Presence, Field Operations, Business Operations, and Analytics & Reports — plus the AI Operatives Hub management interface
- Key features include: AI-powered scheduling, automated reminders via SMS/email/voice, customer portal, technician dispatch, quote generation, inventory management, social media content, Content Engine for multi-channel generation, Web Presence Manager, and business analytics
- The platform offers 24/7 AI automation for handling customer inquiries, booking appointments, and managing operations

Pricing Tiers (4 Tiers — Growth Ladder):
- Aura Core ($697/mo · $349 onboarding): 8 Smart AI Agents (AI Receptionist, Booking, Follow-Up, Review, Creative Content, Web Presence, Lead, Marketing). 3 Consoles (Customer Portal, Outreach & Sales, Creative & Web). 10 employees. Best for solo operators, salons, restaurants.
- Aura Boost ($1,097/mo · $549 onboarding): 12 Smart AI Agents (adds Dispatch, Route, ETA, Check-In). 5 Consoles (adds Field Operations, Social Media). 25 employees. Best for HVAC, plumbing, field service companies.
- Aura Pro ($1,997/mo · $999 onboarding): 16 Smart AI Agents (adds Campaign, Outreach, Social Scheduler Agent, Social Analytics). 5 Consoles. 50 employees. White-label branding. Best for growing companies.
- Aura Elite ($3,497/mo · $1,749 onboarding): All 24 Smart AI Agents (adds Invoice, Inventory, Insights, Performance, Revenue, Forecast). All 7 Consoles + AI Operatives Hub. Unlimited employees. Best for large service teams and enterprise operations.
- Annual billing: Core $4,970/yr, Boost $6,970/yr, Pro $11,970/yr, Elite $21,970/yr
- Additional employees: $25/mo per 10 employees beyond included amount

Communication Channels:
- Message Aura (Text): Keyboard-based chat available on ALL tiers
- Talk to Aura (Voice): Speech-based AI via microphone/speakers. Available on ALL paid tiers. Requires ElevenLabs + SignalWire.
- AI Receptionist answers inbound calls, SMS, and Talk to Aura conversations
- Required integrations: SignalWire, ElevenLabs, Resend, A2P 10DLC compliance for all tiers

Your role:
- Answer questions about Aura Intercept's features, pricing, and capabilities
- Help potential customers understand how the platform can benefit their business
- Explain how the AI operatives work and what problems they solve
- Be friendly, professional, and concise
- If asked about booking a demo or signing up, direct them to the Sign In button or contact options on the page
- This chat itself is a demonstration of the AI capabilities - mention that when relevant

Keep responses helpful but concise (2-4 sentences typically). Be enthusiastic about the platform's capabilities.`;

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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: AURA_SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

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
