import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Intent classification prompt
const INTENT_CLASSIFICATION_PROMPT = `You are an intent classifier for a unified voice/text assistant called Aura. 
Classify the user's input into one of these categories:

1. "data_query" - Questions about metrics, analytics, reports, trends, business data
   Examples: "What's my revenue this month?", "Show me top customers", "How many appointments today?"

2. "action_command" - Navigation, clicking buttons, form filling, UI interactions
   Examples: "Go to customers", "Open new quote", "Navigate to invoices", "Click add button"

3. "hybrid" - Contains BOTH a data request AND an action to take
   Examples: "Show me top leads and open the first one", "What's revenue then go to reports"

Respond with ONLY valid JSON in this exact format:
{
  "intent": "data_query" | "action_command" | "hybrid",
  "data_part": "the data query portion if any, otherwise null",
  "action_part": "the action command portion if any, otherwise null",
  "confidence": 0.0 to 1.0
}`;

interface IntentClassification {
  intent: 'data_query' | 'action_command' | 'hybrid';
  data_part: string | null;
  action_part: string | null;
  confidence: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { input, currentPage, visibleButtons, visibleCards, visibleFields } = await req.json();
    
    if (!input || typeof input !== 'string' || !input.trim()) {
      return new Response(
        JSON.stringify({ error: 'Input is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 1: Classify intent
    const classificationResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: INTENT_CLASSIFICATION_PROMPT },
          { role: "user", content: input }
        ],
        temperature: 0.1,
      }),
    });

    if (!classificationResponse.ok) {
      if (classificationResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (classificationResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`Classification failed: ${classificationResponse.status}`);
    }

    const classificationData = await classificationResponse.json();
    const classificationContent = classificationData.choices?.[0]?.message?.content || '';
    
    // Parse the classification JSON
    let classification: IntentClassification;
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = classificationContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in classification response');
      }
      classification = JSON.parse(jsonMatch[0]);
    } catch (_parseError) {
      console.error('Failed to parse classification:', classificationContent);
      // Default to data_query for analytics-heavy phrases, action for navigation
      const lowerInput = input.toLowerCase();
      const isDataQuery = /what|how many|show me|compare|trend|revenue|sales|customers|appointments|analytics|report|metrics/.test(lowerInput);
      classification = {
        intent: isDataQuery ? 'data_query' : 'action_command',
        data_part: isDataQuery ? input : null,
        action_part: isDataQuery ? null : input,
        confidence: 0.5
      };
    }

    // Return the classification with context for the client to route appropriately
    return new Response(
      JSON.stringify({
        classification,
        input,
        context: {
          currentPage,
          visibleButtons,
          visibleCards,
          visibleFields,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Aura unified error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
