import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { loadCompanyWorkspace, buildIndustryPromptSnippet } from "../_shared/workspace.ts";
import { callAIGatewayWithFallback } from "../_shared/ai-gateway.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Intent classification prompt
const INTENT_CLASSIFICATION_PROMPT = `You are an intent classifier for a unified voice/text assistant called Aura. 
Classify the user's input into one of these categories:

1. "data_query" - Questions asking for INFORMATION, counts, metrics, analytics, reports, data
   ALWAYS classify as data_query when:
   - Question starts with "how many", "how much", "what is", "what are"
   - Asking about counts, totals, numbers, or status of business entities
   - Mentions: customers, leads, appointments, quotes, invoices, inventory, warranties, campaigns
   - User wants a NUMBER or LIST of data, not to navigate somewhere
   
   Examples:
   - "How many customers do I have?" → data_query (wants a NUMBER)
   - "What's my revenue this month?" → data_query
   - "How many active warranties?" → data_query
   - "What are my pending invoices?" → data_query
   - "Do I have any overdue invoices?" → data_query

2. "action_command" - Navigation, clicking buttons, form filling, UI interactions
   ONLY use action_command when user explicitly wants to:
   - GO somewhere: "Go to customers", "Open the customers page", "Navigate to invoices"
   - PERFORM a UI action: "Create a new quote", "Click add button", "Open settings"
   
   Navigation keywords: "go to", "open", "navigate to", "take me to", "show me the page"
   
   Examples:
   - "Go to customers" → action_command (wants navigation)
   - "Open the invoices page" → action_command
   - "Navigate to analytics" → action_command
   - "Create a new quote" → action_command

3. "hybrid" - Contains BOTH a data request AND an action to take
   Examples: "Show me top leads and open the first one", "What's revenue then go to reports"

CRITICAL DISTINCTION:
- "How many customers do I have?" → data_query (user wants a NUMBER answer)
- "Go to customers" → action_command (user wants to navigate)
- "Show me the customers page" → action_command (navigation)
- "What customers do I have?" → data_query (wants information)

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
    const { input, currentPage, visibleButtons, visibleCards, visibleFields, companyId } = await req.json();
    
    if (!input || typeof input !== 'string' || !input.trim()) {
      return new Response(
        JSON.stringify({ error: 'Input is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // === AUTH ===
    // Internal callers send x-internal-secret matching ORCHESTRATOR_SECRET.
    // All others must present a valid user JWT; if companyId is provided it must
    // match the user's company (platform_admin bypasses).
    const internalSecret = Deno.env.get('ORCHESTRATOR_SECRET');
    const providedInternal = req.headers.get('x-internal-secret');
    const isInternal = !!internalSecret && providedInternal === internalSecret;

    if (!isInternal) {
      const authHeader = req.headers.get('Authorization') || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
      if (!token) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
      const { data: userData, error: userErr } = await userClient.auth.getUser();
      if (userErr || !userData?.user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (companyId) {
        const adminClient = createClient(supabaseUrl, serviceKey);
        const [{ data: isAdmin }, { data: profile }] = await Promise.all([
          adminClient.rpc('has_role', { _user_id: userData.user.id, _role: 'platform_admin' }),
          adminClient.from('profiles').select('company_id').eq('id', userData.user.id).maybeSingle(),
        ]);
        if (!isAdmin && profile?.company_id !== companyId) {
          return new Response(
            JSON.stringify({ error: 'Forbidden: company mismatch' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Inject industry-adaptation snippet so the classifier respects industry
    // restrictions (e.g. restaurants must NOT be routed into booking flows).
    const workspace = companyId ? await loadCompanyWorkspace(companyId) : null;
    const industrySnippet = buildIndustryPromptSnippet(workspace);
    const systemPrompt = INTENT_CLASSIFICATION_PROMPT + industrySnippet;

    // Step 1: Classify intent
    const { response: classificationResponse, modelUsed: classificationResponseModel, fellBackFromPrimary: classificationResponseFellBack } = await callAIGatewayWithFallback({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: input }
        ],
        temperature: 0.1,
      });
    if (classificationResponseFellBack) console.warn(`[aura-unified] primary model unavailable, served by ${classificationResponseModel}`);

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
