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
          id: company.id,
          name: company.name,
          logo_url: company.logo_url,
          primary_color: company.primary_color || '#6366f1',
          secondary_color: company.secondary_color || '#4f46e5',
          dispatch_phone: company.dispatch_phone || null,
          review_google_url: company.review_google_url || null,
          review_facebook_url: company.review_facebook_url || null,
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
          { id: 'feedback', label: 'Leave Feedback', icon: 'star', message: "I'd like to leave feedback about my service" },
        ]
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Chat action with multi-agent support
    if (action === 'chat' && req.method === 'POST') {
      const { messages, session_id, customer_user_id } = await req.json();

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

      // Generate detailed date context (reusing dayNames from above)
      const now = new Date();
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      
      const weekDates: string[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        const isToday = d.toDateString() === now.toDateString();
        const isTomorrow = d.toDateString() === tomorrow.toDateString();
        let label = '';
        if (isToday) label = ' (TODAY)';
        else if (isTomorrow) label = ' (TOMORROW)';
        weekDates.push(`${dayNames[i]}: ${monthNames[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}${label}`);
      }
      
      const nextWeekDates: string[] = [];
      for (let i = 7; i < 14; i++) {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        nextWeekDates.push(`${dayNames[i % 7]}: ${monthNames[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`);
      }

      const systemPrompt = `You are a friendly AI assistant for ${company.name}. 

CURRENT DATE/TIME CONTEXT:
- TODAY is: ${dayNames[now.getDay()]}, ${monthNames[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}
- TOMORROW is: ${dayNames[tomorrow.getDay()]}, ${monthNames[tomorrow.getMonth()]} ${tomorrow.getDate()}, ${tomorrow.getFullYear()}
- Current time: ${currentTime}
- Agent Role: ${agentContext.charAt(0).toUpperCase() + agentContext.slice(1)} Agent

THIS WEEK:
${weekDates.join('\n')}

NEXT WEEK:
${nextWeekDates.join('\n')}

IMPORTANT: When customers say "tomorrow", "next Monday", "this Friday", etc., use these dates. NEVER ask what tomorrow's date is!

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
                customer_address: { type: "string", description: "Customer's service address" },
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
        {
          type: "function",
          function: {
            name: "check_tech_availability",
            description: "Check available technicians for emergency dispatch",
            parameters: {
              type: "object",
              properties: {
                service_type: { type: "string", description: "Type of service needed" },
                location: { type: "string", description: "Customer location/address" },
              },
              required: ["service_type"],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "assign_technician",
            description: "Assign a technician to an emergency job",
            parameters: {
              type: "object",
              properties: {
                appointment_id: { type: "string", description: "The appointment ID to assign" },
                technician_id: { type: "string", description: "The technician to assign (optional, auto-assigns if not provided)" },
              },
              required: ["appointment_id"],
            },
          },
        },
      ];

      // First, make a non-streaming request to check for tool calls
      const initialResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "system", content: systemPrompt }, ...messages],
          tools,
          stream: false,
        }),
      });

      if (!initialResponse.ok) {
        const errorText = await initialResponse.text();
        console.error('AI Gateway error:', initialResponse.status, errorText);
        
        if (initialResponse.status === 429) {
          return new Response(JSON.stringify({ error: 'Service busy, please try again' }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        if (initialResponse.status === 402) {
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

      const aiResult = await initialResponse.json();
      const assistantMessage = aiResult.choices?.[0]?.message;
      
      // Check if AI wants to call tools
      if (assistantMessage?.tool_calls && assistantMessage.tool_calls.length > 0) {
        console.log('Processing tool calls:', assistantMessage.tool_calls);
        
        const toolResults: any[] = [];
        
        for (const toolCall of assistantMessage.tool_calls) {
          const funcName = toolCall.function.name;
          let args: any = {};
          try {
            args = JSON.parse(toolCall.function.arguments || '{}');
          } catch (e) {
            console.error('Failed to parse tool args:', e);
          }
          
          let result = '';
          
          if (funcName === 'book_appointment') {
            // Execute booking
            const { data: service } = await supabase
              .from('services')
              .select('*')
              .eq('company_id', company.id)
              .ilike('name', `%${args.service_type || ''}%`)
              .maybeSingle();

            const { data: appointment, error: bookError } = await supabase
              .from('appointments')
              .insert({
                company_id: company.id,
                customer_name: args.customer_name || 'Customer',
                customer_phone: args.customer_phone || '',
                customer_email: args.customer_email || null,
                customer_address: args.customer_address || null,
                service_type: args.service_type || 'General',
                datetime: args.preferred_datetime || new Date().toISOString(),
                duration_minutes: service?.duration_minutes || 60,
                notes: args.notes || null,
                status: args.is_emergency ? 'emergency' : 'pending',
                customer_user_id: customer_user_id || null,
              })
              .select()
              .single();

            if (bookError) {
              console.error('Booking error:', bookError);
              result = JSON.stringify({ success: false, error: 'Failed to book appointment' });
            } else {
              // Create job assignment for emergency
              if (args.is_emergency && appointment) {
                await supabase.from('job_assignments').insert({
                  company_id: company.id,
                  appointment_id: appointment.id,
                  customer_address: args.customer_address || null,
                  status: 'pending_acceptance',
                });
              }
              result = JSON.stringify({ success: true, appointment_id: appointment.id, message: 'Appointment booked successfully' });
            }
          } else if (funcName === 'check_availability') {
            // Return available slots based on business hours
            const { data: hours } = await supabase
              .from('business_hours')
              .select('*')
              .eq('company_id', company.id)
              .eq('is_closed', false);
            
            const slots = hours?.length ? ['9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM', '4:00 PM'] : [];
            result = JSON.stringify({ available_slots: slots, date: args.date });
          } else if (funcName === 'get_quote') {
            // Generate quote based on services
            const servicesList = args.services || [];
            const { data: dbServices } = await supabase
              .from('services')
              .select('name, price')
              .eq('company_id', company.id)
              .eq('is_active', true);
            
            let total = 0;
            const items = servicesList.map((s: string) => {
              const found = dbServices?.find(ds => ds.name.toLowerCase().includes(s.toLowerCase()));
              const price = found?.price || 100;
              total += price;
              return { service: s, price };
            });
            
            result = JSON.stringify({ items, total, note: 'Final price may vary based on inspection' });
          } else if (funcName === 'check_tech_availability') {
            // Find available technicians
            const { data: techs } = await supabase
              .from('profiles')
              .select('id, full_name, availability_json')
              .eq('company_id', company.id)
              .not('availability_json', 'is', null);
            
            const available = (techs || []).filter(t => t.availability_json).slice(0, 3);
            result = JSON.stringify({ 
              available_technicians: available.map(t => ({ id: t.id, name: t.full_name })),
              count: available.length 
            });
          } else if (funcName === 'assign_technician') {
            // Assign technician to job
            const { data: techs } = await supabase
              .from('profiles')
              .select('id, full_name')
              .eq('company_id', company.id)
              .limit(1);
            
            const techId = args.technician_id || techs?.[0]?.id;
            if (techId && args.appointment_id) {
              const { error: assignError } = await supabase
                .from('job_assignments')
                .update({ employee_id: techId, status: 'assigned', assigned_at: new Date().toISOString() })
                .eq('appointment_id', args.appointment_id);
              
              if (assignError) {
                result = JSON.stringify({ success: false, error: 'Failed to assign technician' });
              } else {
                result = JSON.stringify({ success: true, technician_name: techs?.[0]?.full_name, message: 'Technician assigned' });
              }
            } else {
              result = JSON.stringify({ success: false, error: 'No technician available' });
            }
          }
          
          toolResults.push({
            tool_call_id: toolCall.id,
            role: 'tool',
            content: result,
          });
        }
        
        // Make follow-up request with tool results
        const followUpResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
              assistantMessage,
              ...toolResults,
            ],
            stream: true,
          }),
        });

        if (!followUpResponse.ok) {
          console.error('Follow-up AI error:', followUpResponse.status);
          return new Response(JSON.stringify({ error: 'AI service error' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(followUpResponse.body, {
          headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
        });
      }
      
      // No tool calls - stream the response
      const streamResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "system", content: systemPrompt }, ...messages],
          stream: true,
        }),
      });

      return new Response(streamResponse.body, {
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
