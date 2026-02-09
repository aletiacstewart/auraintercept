import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { command, currentPage, visibleButtons, visibleCards, visibleFields } = await req.json();

    if (!command) {
      return new Response(JSON.stringify({ error: "command is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are Aura, an AI voice navigation assistant for a business management app. 
The user gives voice commands and you interpret them into actions.

Current page: ${currentPage || "unknown"}
Visible buttons: ${JSON.stringify(visibleButtons || [])}
Visible cards: ${JSON.stringify(visibleCards || [])}
Visible fields: ${JSON.stringify(visibleFields || [])}

Map the user's command to one of these actions using the interpret_action tool.

Page route mappings:
- "dashboard" or "home" → /dashboard
- "appointments" or "calendar" or "schedule" → /appointments
- "customers" or "clients" → /customers
- "settings" → /settings
- "analytics" or "reports" → /analytics
- "inventory" → /inventory
- "invoices" or "billing" → /invoices
- "leads" → /leads
- "campaigns" or "marketing" → /campaigns
- "employees" or "staff" or "team" → /employees

If you can't determine the action, use "unknown" with a helpful message.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: command },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "interpret_action",
              description: "Interpret the voice command into a UI action",
              parameters: {
                type: "object",
                properties: {
                  action: {
                    type: "string",
                    enum: ["navigate", "click_button", "click_card", "search", "fill_field", "focus_field", "open_form", "scroll", "unknown"],
                  },
                  target: { type: "string", description: "Label of the UI element to interact with" },
                  route: { type: "string", description: "Route path for navigation actions" },
                  value: { type: "string", description: "Value to fill or search for" },
                  confidence: { type: "number", description: "Confidence score 0-1" },
                  message: { type: "string", description: "Human-readable description of the action" },
                },
                required: ["action", "confidence", "message"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "interpret_action" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({
        action: "unknown",
        confidence: 0,
        message: "Could not interpret the command.",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let actionResult;
    try {
      actionResult = JSON.parse(toolCall.function.arguments);
    } catch {
      actionResult = { action: "unknown", confidence: 0, message: "Failed to parse AI response." };
    }

    return new Response(JSON.stringify(actionResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("voice-navigator error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
