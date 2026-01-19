import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Complete page routes mapping for the dashboard
const PAGE_ROUTES_CONTEXT = `
Dashboard Pages (use these exact routes):
- Dashboard/Home: /dashboard
- Quick Setup/Settings: /dashboard/quick-setup
- Smart Website: /dashboard/smart-website
- Business Ops Overview/Business Operations: /dashboard/business-operations
- Companies: /dashboard/companies
- Employees: /dashboard/employees
- Customers: /dashboard/customers
- Leads: /dashboard/leads
- Appointments: /dashboard/appointments
- Quotes: /dashboard/quotes
- Invoices: /dashboard/invoices
- Inventory: /dashboard/inventory
- Warranties: /dashboard/warranties
- Ask Aura/Analytics: /dashboard/ask-aura
- Subscription Analytics: /dashboard/subscription-analytics
- Business Mgt Ops Console: /dashboard/ai-consoles/business-mgt-ops
- Analytics & Reports Ops: /dashboard/ai-consoles/analytics
- Marketing & Sales Ops: /dashboard/ai-consoles/marketing-sales
- Business Mgt Ops Install: /dashboard/business-mgt-ops-install
- Technician-Field Ops/Technician Field Ops: /dashboard/ai-consoles/field-ops
- Dispatch-Field Ops/Dispatch Field Ops: /dashboard/dispatch-field-ops
- Technician Field Ops Install: /dashboard/field-ops-install
- Dispatch Field Ops Install: /dashboard/dispatch-field-ops-install
- Customer Portal: /dashboard/ai-consoles/customer-portal
- Customer Website App: /dashboard/customer-website-app
- Customer Portal App Install: /dashboard/customer-portal-app-install
- AI Agents Hub: /dashboard/ai-agents
- Knowledge Base: /dashboard/knowledge
- Calculators: /dashboard/calculators
- 3rd Party Overview: /dashboard/3rd-party-overview
- Voice Agent: /dashboard/integrations/voice
- SMS & Text: /dashboard/integrations/sms
- Email Integration: /dashboard/integrations/email
- CRM Integration: /dashboard/integrations/crm
- Calendar Integration: /dashboard/integrations/calendar
- Platform Issues: /dashboard/platform-issues
- Platform Guides: /dashboard/platform-guides
- Help: /dashboard/help
- Architecture: /dashboard/architecture
- Export Docs: /dashboard/export-docs
- Campaigns: /dashboard/campaigns

Technician Routes:
- My Schedule: /dashboard/appointments
- AI Console: /technician/ai-console
- My Jobs: /technician/jobs
- Calendar: /technician/calendar
- Job History: /technician/history
- Availability: /technician/availability
- Profile: /technician/profile
- Install App: /technician/install
`;

const SYSTEM_PROMPT = `You are a Voice Navigator Agent for a business management dashboard called "Aura Intercept".
Your job is to interpret natural language voice commands and return structured JSON actions.

Available Actions:
1. navigate - Go to a page (returns route from the page list below)
2. click_button - Click a button by its visible text (e.g., "New Quote", "Add Customer", "Save", "Submit")
3. click_card - Click a dashboard card by its label (e.g., "Pending Quotes", "New Leads", "Unpaid Invoices")
4. search - Search for something on the current page
5. fill_field - Fill a specific form field with a value (requires BOTH field name AND value)
6. focus_field - Navigate to/focus a specific form field by its label WITHOUT filling it (e.g., "name field", "go to email", "phone field")
7. open_form - Open a new item form (e.g., "new quote", "new customer", "new appointment")
8. scroll - Scroll up or down on the page
9. unknown - Command was not understood

${PAGE_ROUTES_CONTEXT}

Dashboard Cards on Business Ops Overview:
- New Leads (last 30 days) → /dashboard/leads
- Pending Quotes → /dashboard/quotes
- Unpaid Invoices → /dashboard/invoices
- Low Stock Alerts → /dashboard/inventory
- Upcoming Appointments (next 7 days) → /dashboard/appointments
- Active Warranties → /dashboard/warranties
- Active Campaigns → /dashboard/campaigns
- Payment Gateway → /dashboard/quick-setup

Common Button Text on Pages:
- "New Quote", "+ New Quote", "Create Quote"
- "New Invoice", "+ New Invoice", "Create Invoice"
- "New Customer", "+ Add Customer", "Create Customer"
- "New Lead", "+ New Lead", "Create Lead"
- "New Appointment", "+ New Appointment", "Create Appointment"
- "Save", "Submit", "Create", "Update", "Cancel", "Close"
- "Edit", "Delete", "View Details"

IMPORTANT RULES:
1. Match user intent even if wording is slightly different (e.g., "show me quotes" = navigate to quotes)
2. For navigation, ALWAYS use the exact route from the list above
3. Be lenient with synonyms: "go to", "open", "show", "take me to", "navigate to" all mean navigate
4. "Click on X card" or "open X card" means click_card action
5. "Click X button" or "press X" means click_button action
6. "Search for X" or "find X" or "look up X" means search action
7. "Create new X" or "add new X" means open_form action
8. If the user says something like "new quote", interpret as open_form unless context suggests otherwise

FIELD NAVIGATION RULES (focus_field vs fill_field):
9. "Go to X field", "X field", "focus X", "move to X" = focus_field action (just focus, no value)
10. When user says just a field name like "name", "email", "phone", "address" WITHOUT providing a value, use focus_field
11. "Set X to Y", "enter Y in X", "put Y in X field", "X is Y" = fill_field action (field AND value)
12. Examples:
    - "name field" → focus_field with target "name"
    - "go to email" → focus_field with target "email"  
    - "phone" → focus_field with target "phone"
    - "set name to John" → fill_field with target "name" and value "John"
    - "enter test@email.com in email" → fill_field with target "email" and value "test@email.com"

Respond with ONLY valid JSON in this format:
{
  "action": "navigate|click_button|click_card|search|fill_field|focus_field|open_form|scroll|unknown",
  "target": "button text, card label, field name, or page name",
  "value": "value for search or fill_field",
  "route": "/path/to/page (for navigate action only)",
  "confidence": 0.0-1.0,
  "message": "Human readable description of what will happen"
}`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { command, currentPage, visibleButtons, visibleCards, visibleFields } = await req.json();
    
    if (!command) {
      return new Response(
        JSON.stringify({ error: 'No command provided' }),
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

    // Build context message
    let contextMessage = `User voice command: "${command}"`;
    if (currentPage) {
      contextMessage += `\nCurrent page: ${currentPage}`;
    }
    if (visibleButtons && visibleButtons.length > 0) {
      contextMessage += `\nVisible buttons: ${visibleButtons.join(', ')}`;
    }
    if (visibleCards && visibleCards.length > 0) {
      contextMessage += `\nVisible cards: ${visibleCards.join(', ')}`;
    }
    if (visibleFields && visibleFields.length > 0) {
      contextMessage += `\nVisible form fields: ${visibleFields.join(', ')}`;
    }
    contextMessage += `\n\nInterpret this command and return the appropriate action JSON.`;

    console.log("Processing voice command:", command);
    console.log("Context:", { currentPage, visibleButtons, visibleCards, visibleFields });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: contextMessage },
        ],
        temperature: 0.1, // Low temperature for consistent parsing
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded, please try again later' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required, please add credits' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'AI processing failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      console.error("No AI response content");
      return new Response(
        JSON.stringify({ 
          action: 'unknown', 
          message: 'Could not interpret command',
          confidence: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("AI raw response:", aiResponse);

    // Parse the JSON from AI response
    let parsedAction;
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedAction = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      return new Response(
        JSON.stringify({ 
          action: 'unknown', 
          message: 'Could not parse command',
          confidence: 0,
          rawResponse: aiResponse 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Parsed action:", parsedAction);

    return new Response(
      JSON.stringify(parsedAction),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Voice navigator error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        action: 'unknown',
        message: 'An error occurred processing your command'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
