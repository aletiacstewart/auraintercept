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
        .select('id, name, duration_minutes, price, description, category')
        .eq('company_id', company.id)
        .eq('is_active', true)
        .order('sort_order');

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

    // Quick actions endpoint
    if (action === 'quick-actions') {
      return new Response(JSON.stringify({
        actions: [
          { id: 'schedule', label: 'Book Appointment', icon: 'calendar', message: "I'd like to schedule an appointment" },
          { id: 'emergency', label: 'Emergency', icon: 'alert-triangle', highlight: true, message: "I have an urgent emergency situation" },
          { id: 'quote', label: 'Get Quote', icon: 'dollar-sign', message: "I need a quote for your services" },
          { id: 'hours', label: 'Business Hours', icon: 'clock', message: "What are your business hours?" },
          { id: 'services', label: 'View Services', icon: 'sparkles', message: "What services do you offer?" },
          { id: 'track', label: 'Track Appointment', icon: 'map-pin', message: "I want to track my appointment status" },
        ]
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Chat action with multi-agent support
    if (action === 'chat' && req.method === 'POST') {
      const { messages, session_id } = await req.json();

      // Build comprehensive knowledge base context
      const [servicesRes, faqsRes, hoursRes, docsRes, employeesRes] = await Promise.all([
        supabase.from('services').select('*').eq('company_id', company.id).eq('is_active', true),
        supabase.from('faqs').select('*').eq('company_id', company.id).eq('is_active', true),
        supabase.from('business_hours').select('*').eq('company_id', company.id),
        supabase.from('knowledge_documents').select('name, content_text').eq('company_id', company.id),
        supabase.from('profiles').select('id, full_name, availability_json').eq('company_id', company.id),
      ]);

      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const today = new Date();
      const currentDay = dayNames[today.getDay()];
      const currentTime = today.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

      const hoursText = (hoursRes.data || []).map(h => 
        h.is_closed ? `${dayNames[h.day_of_week]}: Closed` : `${dayNames[h.day_of_week]}: ${h.open_time} - ${h.close_time}`
      ).join('\n');

      const servicesText = (servicesRes.data || []).map(s => 
        `- ${s.name}: ${s.duration_minutes} mins, $${s.price || 'varies'}${s.description ? ` - ${s.description}` : ''}`
      ).join('\n');

      const faqsText = (faqsRes.data || []).map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');
      const docsText = (docsRes.data || []).filter(d => d.content_text).map(d => d.content_text).join('\n\n');

      // Analyze user intent for routing
      const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop()?.content?.toLowerCase() || '';
      
      let agentContext = 'triage';
      let agentInstructions = '';

      if (lastUserMessage.includes('emergency') || lastUserMessage.includes('urgent') || lastUserMessage.includes('broken') || lastUserMessage.includes('leak')) {
        agentContext = 'dispatch';
        agentInstructions = `
You are the Emergency Dispatch Agent. The customer has an urgent situation.
- Acknowledge the emergency immediately
- Ask for their location/address if not provided
- Ask what equipment/system is affected
- Provide estimated response time
- Reassure them help is on the way
- Collect contact number for technician callback`;
      } else if (lastUserMessage.includes('book') || lastUserMessage.includes('schedule') || lastUserMessage.includes('appointment') || lastUserMessage.includes('available')) {
        agentContext = 'booking';
        agentInstructions = `
You are the Booking Agent. Help the customer schedule an appointment.
- Ask what service they need
- Ask for their preferred date and time
- Check against business hours
- Collect customer name, phone, and email
- Confirm all details before booking
- Use the book_appointment tool when you have all required info`;
      } else if (lastUserMessage.includes('quote') || lastUserMessage.includes('price') || lastUserMessage.includes('cost') || lastUserMessage.includes('estimate')) {
        agentContext = 'quote';
        agentInstructions = `
You are the Quote Agent. Help the customer get a price estimate.
- Ask what service or work they need
- Ask about scope/size of the job
- Provide ballpark pricing based on services
- Explain that final quotes may vary based on inspection
- Offer to schedule a free estimate visit`;
      } else if (lastUserMessage.includes('feedback') || lastUserMessage.includes('review') || lastUserMessage.includes('complaint') || lastUserMessage.includes('thank')) {
        agentContext = 'review';
        agentInstructions = `
You are the Review Agent. Handle customer feedback.
- Thank them for taking time to share feedback
- If positive, ask if they'd like to leave a Google/Yelp review
- If negative, apologize and ask for details
- Offer to escalate to management if needed
- Document all feedback`;
      } else if (lastUserMessage.includes('track') || lastUserMessage.includes('status') || lastUserMessage.includes('eta') || lastUserMessage.includes('where')) {
        agentContext = 'eta';
        agentInstructions = `
You are the ETA Agent. Help track technician arrival.
- Ask for their appointment reference or name
- Provide current status of their service call
- Give estimated arrival time
- Offer to send text updates`;
      }

      const systemPrompt = `You are a friendly AI assistant for ${company.name}. 

CURRENT CONTEXT:
- Today is ${currentDay}
- Current time: ${currentTime}
- Agent Role: ${agentContext.charAt(0).toUpperCase() + agentContext.slice(1)} Agent

${agentInstructions}

BUSINESS HOURS:
${hoursText || 'Not specified'}

SERVICES OFFERED:
${servicesText || 'Contact us for services'}

FREQUENTLY ASKED QUESTIONS:
${faqsText || 'No FAQs available'}

ADDITIONAL KNOWLEDGE:
${docsText || ''}

CAPABILITIES:
- Answer questions about services, pricing, hours, and policies
- Help book appointments (collect: name, phone, email, service, preferred date/time)
- Handle emergencies by collecting location and dispatching help
- Provide quotes and estimates
- Collect feedback and reviews
- Track appointment status

GUIDELINES:
- Be concise but thorough
- Use a friendly, professional tone
- If unsure, offer to connect to a human
- For bookings, always confirm all details before using the tool
- For emergencies, prioritize speed and reassurance`;

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
            description: "Book an appointment after collecting all required customer information",
            parameters: {
              type: "object",
              properties: {
                customer_name: { type: "string", description: "Customer's full name" },
                customer_phone: { type: "string", description: "Customer's phone number" },
                customer_email: { type: "string", description: "Customer's email (optional)" },
                service_type: { type: "string", description: "The service they want" },
                preferred_datetime: { type: "string", description: "Preferred date and time in ISO format" },
                notes: { type: "string", description: "Any additional notes or special requests" },
                is_emergency: { type: "boolean", description: "Whether this is an emergency dispatch" },
              },
              required: ["customer_name", "customer_phone", "service_type", "preferred_datetime"],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "check_availability",
            description: "Check available appointment slots for a given date and service",
            parameters: {
              type: "object",
              properties: {
                date: { type: "string", description: "Date to check in YYYY-MM-DD format" },
                service_type: { type: "string", description: "The service to check availability for" },
              },
              required: ["date"],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "get_quote",
            description: "Generate a price quote for requested services",
            parameters: {
              type: "object",
              properties: {
                services: { type: "array", items: { type: "string" }, description: "List of services requested" },
                details: { type: "string", description: "Additional details about the job" },
              },
              required: ["services"],
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
        
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: 'Service temporarily unavailable' }), {
            status: 402,
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

      // Find matching service
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
          status: booking.is_emergency ? 'emergency' : 'pending',
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
