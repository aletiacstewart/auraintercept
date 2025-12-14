import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface BookingRequest {
  service_name: string;
  preferred_date: string;
  preferred_time: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  employee_id?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, company_id, action } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Fetch knowledge base for RAG
    const knowledgeContext = await fetchKnowledgeBase(supabase, company_id);

    const systemPrompt = buildSystemPrompt(knowledgeContext);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "check_availability",
              description: "Check available appointment slots for a service on a specific date",
              parameters: {
                type: "object",
                properties: {
                  service_name: { type: "string", description: "Name of the service" },
                  date: { type: "string", description: "Date in YYYY-MM-DD format" },
                  employee_id: { type: "string", description: "Optional specific employee ID" }
                },
                required: ["service_name", "date"]
              }
            }
          },
          {
            type: "function",
            function: {
              name: "book_appointment",
              description: "Book an appointment for a customer",
              parameters: {
                type: "object",
                properties: {
                  service_name: { type: "string" },
                  datetime: { type: "string", description: "ISO datetime string" },
                  customer_name: { type: "string" },
                  customer_email: { type: "string" },
                  customer_phone: { type: "string" },
                  employee_id: { type: "string" }
                },
                required: ["service_name", "datetime", "customer_name"]
              }
            }
          },
          {
            type: "function",
            function: {
              name: "get_business_hours",
              description: "Get the business hours for a specific day",
              parameters: {
                type: "object",
                properties: {
                  day_of_week: { type: "number", description: "0=Sunday, 1=Monday, etc." }
                },
                required: ["day_of_week"]
              }
            }
          }
        ],
        tool_choice: "auto",
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error("AI Agent error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function fetchKnowledgeBase(supabase: any, companyId: string) {
  const [servicesRes, faqsRes, hoursRes, docsRes, companyRes] = await Promise.all([
    supabase.from('services').select('*').eq('company_id', companyId).eq('is_active', true),
    supabase.from('faqs').select('*').eq('company_id', companyId).eq('is_active', true),
    supabase.from('business_hours').select('*').eq('company_id', companyId),
    supabase.from('knowledge_documents').select('name, content_text').eq('company_id', companyId),
    supabase.from('companies').select('name').eq('id', companyId).single()
  ]);

  return {
    companyName: companyRes.data?.name || 'Our Business',
    services: servicesRes.data || [],
    faqs: faqsRes.data || [],
    businessHours: hoursRes.data || [],
    documents: docsRes.data || []
  };
}

function buildSystemPrompt(knowledge: any) {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  const hoursText = knowledge.businessHours.map((h: any) => 
    h.is_closed ? `${dayNames[h.day_of_week]}: Closed` : 
    `${dayNames[h.day_of_week]}: ${h.open_time} - ${h.close_time}`
  ).join('\n');

  const servicesText = knowledge.services.map((s: any) => 
    `- ${s.name}: ${s.description || 'No description'} (${s.duration_minutes} min, $${s.price || 'N/A'})`
  ).join('\n');

  const faqsText = knowledge.faqs.map((f: any) => 
    `Q: ${f.question}\nA: ${f.answer}`
  ).join('\n\n');

  const docsText = knowledge.documents.map((d: any) => 
    d.content_text ? `Document "${d.name}":\n${d.content_text}` : ''
  ).filter(Boolean).join('\n\n');

  return `You are a helpful AI assistant for ${knowledge.companyName}. Your role is to help customers book appointments, answer questions about services, and provide information about the business.

## Business Hours
${hoursText || 'Not specified'}

## Services Offered
${servicesText || 'No services listed'}

## Frequently Asked Questions
${faqsText || 'No FAQs available'}

## Additional Information
${docsText || 'No additional documents'}

## Instructions
1. Be friendly, professional, and helpful
2. When customers want to book an appointment, use the check_availability function first to find open slots
3. Always confirm the service, date, time, and customer details before booking
4. If a specific employee is requested, check their availability specifically
5. If no slots are available, suggest alternative dates or times
6. Answer questions using the knowledge base above
7. If you don't know something, politely say so and offer to help with something else
8. Keep responses concise but informative`;
}
