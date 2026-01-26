import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AURA_SYSTEM_PROMPT = `You are Aura, the helpful and knowledgeable AI assistant for the Aura Intercept platform.

About Aura Intercept:
- Aura Intercept is a Multi-Agent Orchestration Engine designed for appointment-based service businesses (HVAC, plumbing, electrical, landscaping, etc.)
- It provides 23 specialized AI operatives organized into 7 Control Centers: Customer Portal, Field Operations, Business Management, Marketing & Sales, Social Media Signal, Analytics & Reports, and Web Presence
- Key features include: AI-powered scheduling, automated reminders via SMS/email/voice, customer portal, technician dispatch, quote generation, inventory management, Social Media Signal content, and business analytics
- The platform offers 24/7 AI automation for handling customer inquiries, booking appointments, and managing operations

Pricing Tiers:
- Single-Point ($497/mo): 3 AI operatives (Receptionist, Follow-up, Review), 1 console (Customer Portal), saves 10+ hours/week in lead intake
- Multi-Track ($897/mo): 10 AI operatives including Field Operations, 2 consoles, manages up to 5 field techs automatically
- Pro Command ($5,997/mo): All 23 AI operatives, all 7 Control Centers, total business automation with Proxy Voice Chat capabilities
- Annual billing saves 16% (implementation fee waived for annual plans)
- Additional employees: $25/mo per 10 employees beyond included amount

Communication Channels:
- AI Receptionist answers inbound Proxy Voice Chat calls, SMS, and Talk to Aura conversations
- Follow-up Agent sends reminders via email, SMS, and voice calls
- ETA Agent and Campaign Agent send SMS and email notifications
- Requires: Resend (email), Twilio (SMS/voice), ElevenLabs (Proxy Voice Chat synthesis)

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

  try {
    const { messages } = await req.json();
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
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
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
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
