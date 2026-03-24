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
- It provides 24 specialized AI operatives organized into 7 Control Centers (Consoles): Customer Portal, Field Operations, Business Management, Outreach & Sales Ops, Social Media & Web Presence, Analytics & Reports, and AI Operatives Hub
- Key features include: AI-powered scheduling, automated reminders via SMS/email/voice, customer portal, technician dispatch, quote generation, inventory management, Social Media content, Content Engine for multi-channel generation, Web Presence Manager, and business analytics
- The platform offers 24/7 AI automation for handling customer inquiries, booking appointments, and managing operations

Pricing Tiers (7 Total):
- Aura Starter ($197/mo): AI Voice & Chat for restaurants, smart link sharing, 2 employees, 1 AI Operative (AI Receptionist). Requires ElevenLabs + SignalWire.
- Aura Connect ($397/mo): AI voice, chat, and scheduling with calendar sync. 3 AI Operatives (Receptionist, Scheduling, Follow-up). 1 Console (Customer Portal). 3 employees.
- Aura Growth ($597/mo): 11 AI Operatives, 3 Consoles. AI scheduling + marketing + social media suite. 5 employees. For salons and wellness businesses.
- Aura Presence ($797/mo): 12 AI Operatives, 4 Consoles. Full marketing + web presence + social media. 8 employees. All communication channels included.
- Aura Logistics ($1,497/mo): 18 AI Operatives, 6 Consoles. Field operations, dispatch, quoting, invoicing. 15 employees.
- Aura Performance ($497/mo): 22 AI Operatives, all 7 Consoles. Advanced analytics and full automation. 25 employees.
- Aura Command ($697/mo): All 24 AI Operatives, all 7 Consoles + AI Operatives Hub. Enterprise, 50 employees.
- Annual billing saves ~16%
- Additional employees: $25/mo per 10 employees beyond included amount

Communication Channels:
- Message Aura (Text): Keyboard-based chat available on ALL tiers. No external dependencies required.
- Talk to Aura (Voice): Speech-based AI via microphone/speakers. Available on ALL paid tiers (Starter through Command). Requires ElevenLabs + SignalWire.
- AI Receptionist answers inbound calls, SMS, and Talk to Aura conversations
- Follow-up Agent sends reminders via email, SMS, and voice calls
- ETA Agent and Campaign Agent send SMS and email notifications
- Required integrations: SignalWire (not Twilio), ElevenLabs, Resend, A2P 10DLC compliance for all tiers

New AI Features:
- Knowledge Base AI Generator: Batch-generate FAQs, services, and business hours from industry context
- Campaign Series Generator: Create coordinated multi-week email/SMS marketing sequences
- SMS Template AI: Generate professional SMS messages with 160-character awareness
- Quote/Invoice AI: Professional line item descriptions from service names

Your role:
- Answer questions about Aura Intercept's features, pricing, and capabilities
- Help potential customers understand how the platform can benefit their business
- Explain how the AI agents work and what problems they solve
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

    // Input validation
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

    // Limit message history depth to prevent abuse
    if (messages.length > 50) {
      return new Response(JSON.stringify({ error: "Too many messages in history" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate each message shape and content length
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
