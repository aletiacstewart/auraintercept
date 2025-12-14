import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const companySlug = url.searchParams.get('company');

    if (!companySlug) {
      return new Response(JSON.stringify({ error: 'Company slug required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get company by slug
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('slug', companySlug)
      .single();

    if (companyError || !company) {
      return new Response(JSON.stringify({ error: 'Company not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get company config action
    if (action === 'config') {
      const { data: hours } = await supabase
        .from('business_hours')
        .select('*')
        .eq('company_id', company.id)
        .order('day_of_week');

      const { data: services } = await supabase
        .from('services')
        .select('id, name, duration_minutes, price, description')
        .eq('company_id', company.id)
        .eq('is_active', true);

      return new Response(JSON.stringify({
        company: {
          name: company.name,
          logo_url: company.logo_url,
          primary_color: company.primary_color || '#6366f1',
          secondary_color: company.secondary_color || '#4f46e5',
        },
        business_hours: hours || [],
        services: services || [],
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Chat action
    if (action === 'chat' && req.method === 'POST') {
      const { messages, session_id } = await req.json();

      // Build knowledge base context
      const [servicesRes, faqsRes, hoursRes, docsRes] = await Promise.all([
        supabase.from('services').select('*').eq('company_id', company.id).eq('is_active', true),
        supabase.from('faqs').select('*').eq('company_id', company.id).eq('is_active', true),
        supabase.from('business_hours').select('*').eq('company_id', company.id),
        supabase.from('knowledge_documents').select('name, content_text').eq('company_id', company.id),
      ]);

      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const hoursText = (hoursRes.data || []).map(h => 
        h.is_closed ? `${dayNames[h.day_of_week]}: Closed` : `${dayNames[h.day_of_week]}: ${h.open_time} - ${h.close_time}`
      ).join('\n');

      const servicesText = (servicesRes.data || []).map(s => 
        `- ${s.name}: ${s.duration_minutes} mins, $${s.price || 'varies'} - ${s.description || ''}`
      ).join('\n');

      const faqsText = (faqsRes.data || []).map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');
      const docsText = (docsRes.data || []).filter(d => d.content_text).map(d => d.content_text).join('\n\n');

      const systemPrompt = `You are a friendly AI assistant for ${company.name}. Help customers with inquiries and appointment booking.

BUSINESS HOURS:
${hoursText || 'Not specified'}

SERVICES OFFERED:
${servicesText || 'Contact us for services'}

FREQUENTLY ASKED QUESTIONS:
${faqsText || 'No FAQs available'}

ADDITIONAL INFORMATION:
${docsText || ''}

CAPABILITIES:
- Answer questions about services, hours, and policies
- Help book appointments by collecting: customer name, phone/email, service type, preferred date/time
- When customer wants to book, gather all details then confirm

Keep responses concise and helpful. Use a friendly, professional tone.`;

      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      if (!LOVABLE_API_KEY) {
        return new Response(JSON.stringify({ error: 'AI not configured' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const tools = [
        {
          type: "function",
          function: {
            name: "book_appointment",
            description: "Book an appointment for the customer after collecting all required information",
            parameters: {
              type: "object",
              properties: {
                customer_name: { type: "string", description: "Customer's full name" },
                customer_phone: { type: "string", description: "Customer's phone number" },
                customer_email: { type: "string", description: "Customer's email (optional)" },
                service_type: { type: "string", description: "The service they want" },
                preferred_datetime: { type: "string", description: "Preferred date and time in ISO format" },
                notes: { type: "string", description: "Any additional notes" },
              },
              required: ["customer_name", "customer_phone", "service_type", "preferred_datetime"],
            },
          },
        },
      ];

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "system", content: systemPrompt }, ...messages],
          tools,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI Gateway error:', response.status, errorText);
        
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: 'Service busy, please try again' }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        return new Response(JSON.stringify({ error: 'AI service unavailable' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(response.body, {
        headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
      });
    }

    // Book appointment action
    if (action === 'book' && req.method === 'POST') {
      const booking = await req.json();

      // Find service
      const { data: service } = await supabase
        .from('services')
        .select('*')
        .eq('company_id', company.id)
        .ilike('name', `%${booking.service_type}%`)
        .single();

      const { data: appointment, error: bookError } = await supabase
        .from('appointments')
        .insert({
          company_id: company.id,
          customer_name: booking.customer_name,
          customer_phone: booking.customer_phone,
          customer_email: booking.customer_email,
          service_type: booking.service_type,
          datetime: booking.preferred_datetime,
          duration_minutes: service?.duration_minutes || 60,
          notes: booking.notes,
          status: 'pending',
        })
        .select()
        .single();

      if (bookError) {
        console.error('Booking error:', bookError);
        return new Response(JSON.stringify({ error: 'Failed to book appointment' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true, appointment }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Widget API error:', error);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
