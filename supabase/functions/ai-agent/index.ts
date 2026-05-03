import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { loadIndustryPackForCompany, applyIndustryPackToPrompt } from "../_shared/industry-pack.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Message {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  tool_call_id?: string;
}

// Rate limiting configuration
const RATE_LIMITS = {
  chat: { requests: 30, windowSeconds: 60 },  // 30 requests per minute per IP
  company: { requests: 100, windowSeconds: 60 }, // 100 requests per minute per company
};

// In-memory rate limit store (per-instance, resets on cold start)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(identifier: string, action: string): { allowed: boolean; retryAfter?: number } {
  const config = RATE_LIMITS[action as keyof typeof RATE_LIMITS] || RATE_LIMITS.chat;
  const key = `${identifier}:${action}`;
  const now = Date.now();
  
  const record = rateLimitStore.get(key);
  
  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + config.windowSeconds * 1000 });
    return { allowed: true };
  }
  
  if (record.count >= config.requests) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }
  
  record.count++;
  return { allowed: true };
}

function getClientIP(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIP = req.headers.get('x-real-ip');
  if (realIP) return realIP;
  const cfIP = req.headers.get('cf-connecting-ip');
  if (cfIP) return cfIP;
  return 'unknown';
}

// Sanitize string input to prevent XSS
function sanitizeString(input: string | null | undefined, maxLength: number): string {
  if (!input) return '';
  return input
    .slice(0, maxLength)
    .trim()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const clientIP = getClientIP(req);
  const requestId = crypto.randomUUID();

  try {
    // Rate limit by IP
    const ipRateCheck = checkRateLimit(clientIP, 'chat');
    if (!ipRateCheck.allowed) {
      console.warn(`Rate limit exceeded for IP ${clientIP}, request_id=${requestId}`);
      return new Response(JSON.stringify({ 
        error: 'Too many requests. Please try again later.',
        retryAfter: ipRateCheck.retryAfter 
      }), {
        status: 429,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Retry-After': String(ipRateCheck.retryAfter || 60)
        },
      });
    }

    const { messages, company_id, stream = true, agent_type } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Security: Validate company_id is a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!company_id || !uuidRegex.test(company_id)) {
      console.warn(`Invalid company_id format attempted: ${company_id}, ip=${clientIP}, request_id=${requestId}`);
      return new Response(JSON.stringify({ error: 'Invalid request' }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limit by company
    const companyRateCheck = checkRateLimit(company_id, 'company');
    if (!companyRateCheck.allowed) {
      console.warn(`Company rate limit exceeded for ${company_id}, ip=${clientIP}, request_id=${requestId}`);
      return new Response(JSON.stringify({ 
        error: 'Too many requests for this company. Please try again later.',
        retryAfter: companyRateCheck.retryAfter 
      }), {
        status: 429,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Retry-After': String(companyRateCheck.retryAfter || 60)
        },
      });
    }

    // Security: Verify the company exists before proceeding
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name')
      .eq('id', company_id)
      .single();

    if (companyError || !company) {
      // Use generic error to prevent company enumeration
      console.warn(`Invalid company_id attempted: ${company_id}, ip=${clientIP}, request_id=${requestId}`);
      return new Response(JSON.stringify({ error: 'Invalid request' }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate messages array
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Messages array is required' }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Limit message count to prevent abuse
    if (messages.length > 100) {
      console.warn(`Message limit exceeded: ${messages.length} messages, company=${company.name}, ip=${clientIP}, request_id=${requestId}`);
      return new Response(JSON.stringify({ error: 'Too many messages in conversation' }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log AI agent usage for audit trail with request ID
    console.log(`AI Agent request: request_id=${requestId}, company=${company.name}, ip=${clientIP}, messages=${messages.length}, timestamp=${new Date().toISOString()}`);

    // Fetch knowledge base for RAG
    const knowledgeContext = await fetchKnowledgeBase(supabase, company_id);
    const systemPrompt = buildSystemPrompt(knowledgeContext, agent_type);

    const tools = [
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
      },
      {
        type: "function",
        function: {
          name: "get_quote",
          description: "Generate a price quote for services",
          parameters: {
            type: "object",
            properties: {
              service_names: { type: "array", items: { type: "string" }, description: "List of service names" },
              customer_name: { type: "string" }
            },
            required: ["service_names"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "track_appointment",
          description: "Look up a customer's appointment and job status (including technician status/ETA if available).",
          parameters: {
            type: "object",
            properties: {
              customer_phone: { type: "string", description: "Customer phone number (recommended)" },
              customer_email: { type: "string", description: "Customer email (optional)" },
              customer_name: { type: "string", description: "Customer full name (optional)" }
            },
            required: []
          }
        }
      },
      {
        type: "function",
        function: {
          name: "list_services",
          description: "Get the list of available services with pricing and descriptions. Use this when a customer wants to see what services are offered or needs to pick services for a quote.",
          parameters: {
            type: "object",
            properties: {
              category: { type: "string", description: "Optional category to filter services" }
            },
            required: []
          }
        }
      },
      {
        type: "function",
        function: {
          name: "collect_feedback",
          description: "Collect customer feedback and provide review platform links. Use this when a customer wants to leave feedback, write a review, or share their experience.",
          parameters: {
            type: "object",
            properties: {
              customer_name: { type: "string", description: "Customer's name" },
              feedback_type: { type: "string", enum: ["positive", "neutral", "negative"], description: "Overall sentiment of the feedback" },
              feedback_text: { type: "string", description: "The customer's feedback or comments" },
              service_received: { type: "string", description: "The service the customer received (if mentioned)" }
            },
            required: ["feedback_type"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "escalate_to_human",
          description: "Transfer the conversation to a human support agent. Use when customer requests human support, has complex issues, or when the AI cannot resolve the query.",
          parameters: {
            type: "object",
            properties: {
              reason: { type: "string", description: "Reason for escalation" },
              priority: { type: "string", enum: ["low", "medium", "high"], description: "Priority level of the escalation" },
              customer_info: { type: "string", description: "Summary of customer issue and conversation context" }
            },
            required: ["reason"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "lookup_lead",
          description: "Search for leads by phone, email, or name. Use when you need to find existing lead information or qualify a potential customer.",
          parameters: {
            type: "object",
            properties: {
              phone: { type: "string", description: "Phone number to search" },
              email: { type: "string", description: "Email address to search" },
              name: { type: "string", description: "Customer name to search" }
            },
            required: []
          }
        }
      }
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
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        tools,
        tool_choice: "auto",
        stream: false,
      }),
    });

    if (!initialResponse.ok) {
      const errorText = await initialResponse.text();
      console.error("AI gateway error:", initialResponse.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: initialResponse.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const initialData = await initialResponse.json();
    const assistantMessage = initialData.choices?.[0]?.message;

    // Check if there are tool calls to process
    if (assistantMessage?.tool_calls && assistantMessage.tool_calls.length > 0) {
      console.log("Processing tool calls:", assistantMessage.tool_calls);
      
      const toolResults: Message[] = [];
      
      for (const toolCall of assistantMessage.tool_calls) {
        const toolName = toolCall.function.name;
        let toolArgs = {};
        try {
          toolArgs = JSON.parse(toolCall.function.arguments || "{}");
        } catch {
          toolArgs = {};
        }
        
        console.log(`Executing tool: ${toolName}`, toolArgs);
        const result = await executeToolCall(supabase, company_id, toolName, toolArgs, knowledgeContext);
        
        toolResults.push({
          role: "tool",
          content: JSON.stringify(result),
          tool_call_id: toolCall.id
        });
      }

      // Make follow-up request with tool results
      // Note: Clear the assistant content when there are tool calls to avoid raw tool descriptions
      const followUpMessages = [
        { role: "system", content: systemPrompt },
        ...messages,
        {
          role: "assistant",
          content: null, // Clear content to prevent raw tool code from appearing
          tool_calls: assistantMessage.tool_calls
        },
        ...toolResults
      ];

      const followUpResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: followUpMessages,
          stream,
        }),
      });

      if (!followUpResponse.ok) {
        const errorText = await followUpResponse.text();
        console.error("Follow-up AI error:", followUpResponse.status, errorText);
        return new Response(JSON.stringify({ error: "AI processing error" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Non-streaming mode for web voice clients
      if (!stream) {
        const followUpData = await followUpResponse.json();
        const content = followUpData?.choices?.[0]?.message?.content || "";
        return new Response(JSON.stringify({ content }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(followUpResponse.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // No tool calls - make streaming or non-streaming request for regular response
    const streamResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
        tools,
        tool_choice: "auto",
        stream,
      }),
    });

    if (!streamResponse.ok) {
      const errorText = await streamResponse.text();
      console.error("Stream AI error:", streamResponse.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Non-streaming mode for web voice clients
    if (!stream) {
      const data = await streamResponse.json();
      const content = data?.choices?.[0]?.message?.content || "";
      return new Response(JSON.stringify({ content }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(streamResponse.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    // Log full error server-side for debugging but return generic message to client
    console.error("AI Agent error:", error, `request_id=${requestId}`);
    return new Response(JSON.stringify({ error: 'An error occurred processing your request' }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function executeToolCall(supabase: any, companyId: string, toolName: string, args: any, knowledge: any) {
  switch (toolName) {
    case "check_availability":
      return await checkAvailability(supabase, companyId, args, knowledge);
    case "book_appointment":
      return await bookAppointment(supabase, companyId, args, knowledge);
    case "get_business_hours":
      return getBusinessHours(knowledge, args.day_of_week);
    case "get_quote":
      return getQuote(knowledge, args);
    case "track_appointment":
      return await trackAppointment(supabase, companyId, args);
    case "list_services":
      return listServices(knowledge, args);
    case "collect_feedback":
      return await collectFeedback(supabase, companyId, knowledge, args);
    case "escalate_to_human":
      return await escalateToHuman(supabase, companyId, args);
    case "lookup_lead":
      return await lookupLead(supabase, companyId, args);
    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

async function checkAvailability(supabase: any, companyId: string, args: any, knowledge: any) {
  const { service_name, date, employee_id } = args;
  
  const service = knowledge.services.find((s: any) => 
    s.name.toLowerCase().includes(service_name.toLowerCase())
  );
  
  if (!service) {
    return { available: false, message: `Service "${service_name}" not found` };
  }

  const dateObj = new Date(date);
  const dayOfWeek = dateObj.getDay();
  const hours = knowledge.businessHours.find((h: any) => h.day_of_week === dayOfWeek);
  
  if (!hours || hours.is_closed) {
    return { available: false, message: `Business is closed on ${date}` };
  }

  // Get existing appointments for that date
  const { data: existingAppts } = await supabase
    .from('appointments')
    .select('datetime, duration_minutes, employee_id')
    .eq('company_id', companyId)
    .gte('datetime', `${date}T00:00:00`)
    .lt('datetime', `${date}T23:59:59`)
    .neq('status', 'cancelled');

  // Generate available slots
  const slots = generateTimeSlots(hours.open_time, hours.close_time, service.duration_minutes, existingAppts || []);
  
  return {
    available: slots.length > 0,
    service: service.name,
    date,
    available_slots: slots.slice(0, 6),
    message: slots.length > 0 
      ? `Found ${slots.length} available slots for ${service.name} on ${date}`
      : `No available slots for ${service.name} on ${date}`
  };
}

function generateTimeSlots(openTime: string, closeTime: string, duration: number, existingAppts: any[]) {
  const slots: string[] = [];
  const [openHour, openMin] = openTime.split(':').map(Number);
  const [closeHour, closeMin] = closeTime.split(':').map(Number);
  
  let currentMinutes = openHour * 60 + openMin;
  const closeMinutes = closeHour * 60 + closeMin;
  
  while (currentMinutes + duration <= closeMinutes) {
    const hour = Math.floor(currentMinutes / 60);
    const min = currentMinutes % 60;
    const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
    
    // Check if slot conflicts with existing appointments
    const hasConflict = existingAppts.some(appt => {
      const apptTime = new Date(appt.datetime);
      const apptMinutes = apptTime.getHours() * 60 + apptTime.getMinutes();
      const apptEnd = apptMinutes + (appt.duration_minutes || 60);
      const slotEnd = currentMinutes + duration;
      return !(slotEnd <= apptMinutes || currentMinutes >= apptEnd);
    });
    
    if (!hasConflict) {
      slots.push(timeStr);
    }
    
    currentMinutes += 30; // 30-minute increments
  }
  
  return slots;
}

async function bookAppointment(supabase: any, companyId: string, args: any, knowledge: any) {
  const { service_name, datetime, customer_name, customer_email, customer_phone, employee_id } = args;
  
  const service = knowledge.services.find((s: any) => 
    s.name.toLowerCase().includes(service_name.toLowerCase())
  );
  
  if (!service) {
    return { success: false, message: `Service "${service_name}" not found` };
  }

  try {
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        company_id: companyId,
        service_type: service.name,
        datetime,
        customer_name,
        customer_email: customer_email || null,
        customer_phone: customer_phone || null,
        employee_id: employee_id || null,
        duration_minutes: service.duration_minutes || 60,
        status: 'confirmed'
      })
      .select()
      .single();

    if (error) {
      console.error("Booking error:", error);
      return { success: false, message: `Failed to book appointment: ${error.message}` };
    }

    return {
      success: true,
      appointment_id: data.id,
      message: `Appointment booked successfully for ${customer_name} on ${new Date(datetime).toLocaleString()}`,
      details: {
        service: service.name,
        datetime,
        customer_name,
        duration: service.duration_minutes
      }
    };
  } catch (err) {
    console.error("Booking exception:", err);
    return { success: false, message: "An error occurred while booking" };
  }
}

async function trackAppointment(supabase: any, companyId: string, args: any) {
  const customer_phone = (args?.customer_phone || '').trim();
  const customer_email = (args?.customer_email || '').trim();
  const customer_name = (args?.customer_name || '').trim();

  if (!customer_phone && !customer_email && !customer_name) {
    return {
      success: false,
      needs_verification: true,
      message: "To look up your appointment, please share the phone number or email you used when booking."
    };
  }

  let query = supabase
    .from('appointments')
    .select('id, datetime, duration_minutes, service_type, status, customer_name, customer_email, customer_phone, customer_address')
    .eq('company_id', companyId)
    .neq('status', 'cancelled')
    .order('datetime', { ascending: false })
    .limit(5);

  if (customer_phone) query = query.eq('customer_phone', customer_phone);
  if (customer_email) query = query.eq('customer_email', customer_email);
  if (!customer_phone && !customer_email && customer_name) query = query.ilike('customer_name', `%${customer_name}%`);

  const { data: appts, error: apptError } = await query;
  if (apptError) {
    console.error('track_appointment appointments error:', apptError);
    return { success: false, message: 'I had trouble looking up your appointment. Please try again.' };
  }

  const appointment = appts?.[0];
  if (!appointment) {
    return {
      success: false,
      not_found: true,
      message: "I couldn't find an appointment with that info. Could you double-check the phone/email used when booking?"
    };
  }

  const { data: job } = await supabase
    .from('job_assignments')
    .select('id, status, assigned_at, accepted_at, en_route_at, arrived_at, started_at, completed_at, estimated_arrival_minutes, actual_arrival_minutes, employee_id')
    .eq('company_id', companyId)
    .eq('appointment_id', appointment.id)
    .maybeSingle();

  let technicianName: string | null = null;
  if (job?.employee_id) {
    const { data: tech } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', job.employee_id)
      .maybeSingle();
    technicianName = tech?.full_name || null;
  }

  // Determine the effective status - job status takes precedence if available
  const effectiveStatus = job?.status || appointment.status;
  const appointmentDate = new Date(appointment.datetime);
  const now = new Date();
  const isPast = appointmentDate < now;
  
  // Build a human-readable status message
  let statusMessage = '';
  if (effectiveStatus === 'completed') {
    statusMessage = `This appointment was completed${job?.completed_at ? ` on ${new Date(job.completed_at).toLocaleDateString()}` : ''}`;
  } else if (effectiveStatus === 'in_progress') {
    statusMessage = `Your technician${technicianName ? ` (${technicianName})` : ''} is currently working on your service`;
  } else if (effectiveStatus === 'arrived') {
    statusMessage = `Your technician${technicianName ? ` (${technicianName})` : ''} has arrived at your location`;
  } else if (effectiveStatus === 'en_route') {
    statusMessage = `Your technician${technicianName ? ` (${technicianName})` : ''} is on the way${job?.estimated_arrival_minutes ? ` - ETA: ${job.estimated_arrival_minutes} minutes` : ''}`;
  } else if (effectiveStatus === 'accepted') {
    statusMessage = `Your appointment has been accepted by ${technicianName || 'a technician'} and is awaiting service`;
  } else if (effectiveStatus === 'pending_acceptance') {
    statusMessage = 'Your appointment is awaiting technician assignment';
  } else if (effectiveStatus === 'cancelled') {
    statusMessage = 'This appointment has been cancelled';
  } else if (effectiveStatus === 'scheduled') {
    if (isPast) {
      statusMessage = 'This appointment was scheduled but no job status was recorded';
    } else {
      statusMessage = `Your appointment is scheduled for ${appointmentDate.toLocaleDateString()} at ${appointmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
  } else {
    statusMessage = `Current status: ${effectiveStatus}`;
  }

  return {
    success: true,
    status_summary: statusMessage,
    effective_status: effectiveStatus,
    appointment: {
      id: appointment.id,
      service_type: appointment.service_type,
      datetime: appointment.datetime,
      status: appointment.status,
      customer_name: appointment.customer_name,
      customer_phone: appointment.customer_phone,
      customer_email: appointment.customer_email,
      customer_address: appointment.customer_address,
    },
    job: job
      ? {
          status: job.status,
          technician_name: technicianName,
          estimated_arrival_minutes: job.estimated_arrival_minutes,
          actual_arrival_minutes: job.actual_arrival_minutes,
          completed_at: job.completed_at,
        }
      : null,
  };
}

function getBusinessHours(knowledge: any, dayOfWeek: number) {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const hours = knowledge.businessHours.find((h: any) => h.day_of_week === dayOfWeek);
  
  if (!hours) {
    return { day: dayNames[dayOfWeek], status: "unknown", message: "Business hours not configured" };
  }
  
  if (hours.is_closed) {
    return { day: dayNames[dayOfWeek], status: "closed", message: `Closed on ${dayNames[dayOfWeek]}` };
  }
  
  return {
    day: dayNames[dayOfWeek],
    status: "open",
    open_time: hours.open_time,
    close_time: hours.close_time,
    message: `${dayNames[dayOfWeek]}: ${hours.open_time} - ${hours.close_time}`
  };
}

function getQuote(knowledge: any, args: any) {
  const { service_names, customer_name } = args;
  const items: any[] = [];
  let total = 0;
  
  for (const serviceName of service_names) {
    const service = knowledge.services.find((s: any) => 
      s.name.toLowerCase().includes(serviceName.toLowerCase())
    );
    if (service) {
      items.push({
        service: service.name,
        price: service.price || 0,
        duration: service.duration_minutes
      });
      total += service.price || 0;
    }
  }
  
  return {
    customer_name: customer_name || "Customer",
    items,
    total,
    message: items.length > 0 
      ? `Quote generated: $${total} for ${items.length} service(s)`
      : "No matching services found for quote"
  };
}

function listServices(knowledge: any, args: any) {
  const { category } = args || {};
  let services = knowledge.services || [];
  
  // Filter by category if provided
  if (category) {
    services = services.filter((s: any) => 
      s.category?.toLowerCase().includes(category.toLowerCase())
    );
  }
  
  // Group services by category for better presentation
  const categories: Record<string, any[]> = {};
  for (const service of services) {
    const cat = service.category || 'General';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push({
      name: service.name,
      description: service.description || '',
      price: service.price || null,
      flat_fee: service.flat_fee || null,
      hourly_rate: service.hourly_rate || null,
      duration_minutes: service.duration_minutes || 60,
      service_type: service.service_type || 'in_person'
    });
  }
  
  return {
    total_services: services.length,
    categories,
    services: services.map((s: any) => ({
      name: s.name,
      description: s.description || '',
      price: s.price || null,
      flat_fee: s.flat_fee || null,
      hourly_rate: s.hourly_rate || null,
      duration_minutes: s.duration_minutes || 60,
      category: s.category || 'General'
    })),
    message: services.length > 0 
      ? `Found ${services.length} available service(s)`
      : "No services are currently available"
  };
}

async function collectFeedback(supabase: any, companyId: string, knowledge: any, args: any) {
  const { customer_name, feedback_type, feedback_text, service_received, rating, customer_email, customer_phone, source } = args || {};
  
  const reviewLinks: { platform: string; url: string }[] = [];
  
  if (knowledge.reviewGoogleUrl) {
    reviewLinks.push({ platform: 'Google', url: knowledge.reviewGoogleUrl });
  }
  if (knowledge.reviewFacebookUrl) {
    reviewLinks.push({ platform: 'Facebook', url: knowledge.reviewFacebookUrl });
  }
  if (knowledge.reviewYelpUrl) {
    reviewLinks.push({ platform: 'Yelp', url: knowledge.reviewYelpUrl });
  }
  
  // Save feedback to database
  try {
    const { data, error } = await supabase
      .from('customer_feedback')
      .insert({
        company_id: companyId,
        customer_name: customer_name || null,
        customer_email: customer_email || null,
        customer_phone: customer_phone || null,
        rating: rating || (feedback_type === 'positive' ? 5 : feedback_type === 'neutral' ? 3 : 1),
        sentiment: feedback_type || 'neutral',
        feedback_note: feedback_text || null,
        service_type: service_received || null,
        source: source || 'chat'
      })
      .select()
      .single();
      
    if (error) {
      console.error('Failed to save feedback:', error);
    } else {
      console.log('Feedback saved:', data.id);
    }
  } catch (err) {
    console.error('Error saving feedback:', err);
  }
  
  const hasReviewLinks = reviewLinks.length > 0;
  
  if (feedback_type === 'positive' || feedback_type === 'neutral') {
    return {
      success: true,
      feedback_received: true,
      feedback_saved: true,
      customer_name: customer_name || 'Valued Customer',
      feedback_type,
      feedback_text: feedback_text || '',
      service: service_received || '',
      review_links: reviewLinks,
      message: hasReviewLinks 
        ? `Thank you for your feedback! We'd love it if you could share your experience on one of our review platforms.`
        : `Thank you for your feedback! We truly appreciate you taking the time to share your experience.`,
      action_recommended: hasReviewLinks ? 'share_review' : 'thank_customer'
    };
  } else {
    return {
      success: true,
      feedback_received: true,
      feedback_saved: true,
      customer_name: customer_name || 'Valued Customer',
      feedback_type,
      feedback_text: feedback_text || '',
      service: service_received || '',
      review_links: [],
      message: `We're sorry to hear about your experience. Your feedback is important to us and we'll use it to improve our services.`,
      action_recommended: 'escalate_to_manager'
    };
  }
}

async function escalateToHuman(supabase: any, companyId: string, args: any) {
  const { reason, priority = 'medium', customer_info } = args || {};
  
  try {
    // Log the escalation event
    const { data: event, error: eventError } = await supabase
      .from('ai_agent_events')
      .insert({
        company_id: companyId,
        source_agent: 'triage',
        event_type: 'human_escalation',
        payload: {
          reason,
          priority,
          customer_info,
          escalated_at: new Date().toISOString()
        },
        status: 'pending',
        requires_human_review: true
      })
      .select()
      .single();
    
    if (eventError) {
      console.error('Failed to create escalation event:', eventError);
    }
    
    // Get company contact info for escalation
    const { data: company } = await supabase
      .from('companies')
      .select('de_escalation_manager_contact, contact_email, contact_phone')
      .eq('id', companyId)
      .single();
    
    return {
      success: true,
      escalated: true,
      event_id: event?.id || null,
      priority,
      reason,
      message: `I understand you'd like to speak with a human representative. I've escalated your request with ${priority} priority. A team member will reach out to you shortly.`,
      contact_info: {
        email: company?.contact_email || null,
        phone: company?.contact_phone || null
      },
      action_recommended: 'await_human_contact'
    };
  } catch (err) {
    console.error('Error escalating to human:', err);
    return {
      success: false,
      escalated: false,
      message: `I apologize, but I encountered an issue while escalating your request. Please try contacting us directly.`,
      error: 'escalation_failed'
    };
  }
}

async function lookupLead(supabase: any, companyId: string, args: any) {
  const { phone, email, name } = args || {};
  
  if (!phone && !email && !name) {
    return {
      success: false,
      message: 'Please provide at least one search criterion: phone, email, or name'
    };
  }
  
  try {
    // Search in customers table
    let query = supabase
      .from('customers')
      .select('id, first_name, last_name, email, phone, mobile_phone, lifecycle_stage, lead_source, customer_since, notes')
      .eq('company_id', companyId);
    
    if (email) {
      query = query.ilike('email', `%${email}%`);
    } else if (phone) {
      query = query.or(`phone.ilike.%${phone}%,mobile_phone.ilike.%${phone}%`);
    } else if (name) {
      query = query.or(`first_name.ilike.%${name}%,last_name.ilike.%${name}%`);
    }
    
    const { data: customers, error } = await query.limit(5);
    
    if (error) {
      console.error('Error searching leads:', error);
      return { success: false, message: 'Error searching for leads' };
    }
    
    if (!customers || customers.length === 0) {
      // Search in appointments for non-registered customers
      let apptQuery = supabase
        .from('appointments')
        .select('customer_name, customer_email, customer_phone, service_type, datetime, status')
        .eq('company_id', companyId);
      
      if (email) {
        apptQuery = apptQuery.ilike('customer_email', `%${email}%`);
      } else if (phone) {
        apptQuery = apptQuery.ilike('customer_phone', `%${phone}%`);
      } else if (name) {
        apptQuery = apptQuery.ilike('customer_name', `%${name}%`);
      }
      
      const { data: appointments } = await apptQuery.limit(5);
      
      if (appointments && appointments.length > 0) {
        return {
          success: true,
          found: true,
          source: 'appointments',
          leads: appointments.map((a: any) => ({
            name: a.customer_name,
            email: a.customer_email,
            phone: a.customer_phone,
            last_service: a.service_type,
            last_visit: a.datetime,
            status: 'past_customer'
          })),
          message: `Found ${appointments.length} matching record(s) from past appointments`
        };
      }
      
      return {
        success: true,
        found: false,
        leads: [],
        message: 'No matching leads found in our system'
      };
    }
    
    return {
      success: true,
      found: true,
      source: 'customers',
      leads: customers.map((c: any) => ({
        id: c.id,
        name: `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Unknown',
        email: c.email,
        phone: c.phone || c.mobile_phone,
        lifecycle_stage: c.lifecycle_stage || 'unknown',
        lead_source: c.lead_source,
        customer_since: c.customer_since,
        notes: c.notes
      })),
      message: `Found ${customers.length} matching lead(s)`
    };
  } catch (err) {
    console.error('Error in lookupLead:', err);
    return { success: false, message: 'Error searching for leads' };
  }
}

async function fetchKnowledgeBase(supabase: any, companyId: string) {
  // Use secure RPC functions for public data, direct queries only for internal/authenticated data
  const [servicesRes, faqsRes, hoursRes, docsRes, companyRes] = await Promise.all([
    supabase.rpc('get_company_services', { p_company_id: companyId }),
    supabase.rpc('get_company_faqs', { p_company_id: companyId }),
    supabase.rpc('get_company_business_hours', { p_company_id: companyId }),
    supabase.from('knowledge_documents').select('name, content_text').eq('company_id', companyId),
    supabase.from('companies').select('name, review_google_url, review_facebook_url, review_yelp_url').eq('id', companyId).single()
  ]);

  return {
    companyName: companyRes.data?.name || 'Our Business',
    services: servicesRes.data || [],
    faqs: faqsRes.data || [],
    businessHours: hoursRes.data || [],
    documents: docsRes.data || [],
    reviewGoogleUrl: companyRes.data?.review_google_url || null,
    reviewFacebookUrl: companyRes.data?.review_facebook_url || null,
    reviewYelpUrl: companyRes.data?.review_yelp_url || null
  };
}

function getDateTimeContext(): string {
  const now = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  const today = now;
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  
  const weekDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    const isToday = d.toDateString() === today.toDateString();
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
  
  return `
CURRENT DATE/TIME:
- TODAY: ${dayNames[today.getDay()]}, ${monthNames[today.getMonth()]} ${today.getDate()}, ${today.getFullYear()}
- TOMORROW: ${dayNames[tomorrow.getDay()]}, ${monthNames[tomorrow.getMonth()]} ${tomorrow.getDate()}, ${tomorrow.getFullYear()}
- Time: ${now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}

THIS WEEK:
${weekDates.join('\n')}

NEXT WEEK:
${nextWeekDates.join('\n')}

When customers say "tomorrow", "next Monday", etc., use these dates. NEVER ask what tomorrow's date is!`;
}

function buildSystemPrompt(knowledge: any, agentType?: string) {
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

  const dateTimeContext = getDateTimeContext();

  // Agent-specific focus instructions
  const agentFocusInstructions = getAgentFocusInstructions(agentType);

  return `You are a helpful AI assistant for ${knowledge.companyName}. Your role is to help customers book appointments, answer questions about services, and provide information about the business.

${dateTimeContext}

## Business Hours
${hoursText || 'Not specified'}

## Services Offered
${servicesText || 'No services listed'}

## Frequently Asked Questions
${faqsText || 'No FAQs available'}

## Additional Information
${docsText || 'No additional documents'}

${agentFocusInstructions}

## Instructions
1. Be friendly, professional, and helpful
2. When customers want to book an appointment, use the check_availability function first to find open slots
3. Always confirm the service, date, time, and customer details before booking
4. If a specific employee is requested, check their availability specifically
5. If no slots are available, suggest alternative dates or times
6. Answer questions using the knowledge base above
7. If a customer wants to track an appointment, ask for the phone number or email used when booking, then use track_appointment
8. If you don't know something, politely say so and offer to help with something else
9. Keep responses concise but informative
10. When booking is complete, confirm all details with the customer

## Quote Generation Instructions
When a customer asks for a quote or wants to know pricing:
1. FIRST use list_services to get the available services and show them to the customer
2. Present the services in a clear, organized list with names, descriptions, and prices
3. Ask which service(s) they're interested in
4. Once they select service(s), use get_quote to generate the final quote with totals
5. If a service has pricing as flat_fee or hourly_rate instead of price, mention how pricing works

## Appointment Status Guide (for track_appointment results)
When reporting appointment status, use the "status_summary" field which provides a human-readable message. The "effective_status" shows the actual status:
- "completed" = Service was finished
- "in_progress" = Technician is currently working
- "arrived" = Technician is at the location
- "en_route" = Technician is traveling to location
- "accepted" = Technician accepted the job, waiting to start
- "pending_acceptance" = Waiting for technician assignment
- "scheduled" = Appointment booked but not yet assigned
- "cancelled" = Appointment was cancelled

Always use status_summary in your response to the customer as it provides the most accurate and friendly description.

## Feedback & Review Instructions
When a customer wants to leave feedback, share their experience, or write a review:
1. Use the collect_feedback tool to process their feedback
2. Ask about their experience to determine if it's positive, neutral, or negative
3. For positive/neutral feedback: Thank them warmly and provide any available review platform links (Google, Facebook, Yelp)
4. For negative feedback: Apologize sincerely, thank them for sharing, and assure them their feedback will be addressed
5. If review links are available, encourage them to share their positive experience online
6. Always be empathetic and appreciative of their time`;
}

// Agent-specific focus instructions for comprehensive testing
function getAgentFocusInstructions(agentType?: string): string {
  if (!agentType) return '';
  
  const focusMap: Record<string, string> = {
    triage: `
## Agent Focus: Triage/Receptionist
PRIORITY: Greeting customers, understanding their needs, and routing to appropriate services.
Focus on: classify_intent, list_services, check_availability`,
    
    booking: `
## Agent Focus: Booking
PRIORITY: Schedule appointments efficiently. Use check_availability first, then book_appointment.
Focus on: check_availability, book_appointment, get_business_hours`,
    
    followup: `
## Agent Focus: Follow-up
PRIORITY: Track existing appointments and provide status updates.
Focus on: track_appointment - always ask for phone or email to lookup`,
    
    review: `
## Agent Focus: Review Collection
PRIORITY: Collect customer feedback and direct positive reviews to review platforms.
Focus on: collect_feedback - determine sentiment and provide appropriate review links`,
    
    quoting: `
## Agent Focus: Quoting
PRIORITY: Generate accurate price quotes. List services first, then create quotes.
Focus on: list_services, get_quote - always show itemized breakdown`,
    
    invoice: `
## Agent Focus: Invoice
PRIORITY: Generate invoices and payment links for completed work.
Focus on: Creating invoices with accurate labor and parts totals, generating payment links`,
    
    dispatch: `
## Agent Focus: Dispatch
PRIORITY: Assign technicians to jobs based on proximity and availability.
Focus on: Finding nearest available technician, emergency dispatch for urgent requests`,
    
    eta: `
## Agent Focus: ETA
PRIORITY: Provide accurate arrival time estimates to customers.
Focus on: track_appointment to get technician status and provide ETA updates`,
    
    inventory: `
## Agent Focus: Inventory
PRIORITY: Track stock levels and trigger reorders for low items.
Focus on: Stock checking, reorder alerts, parts availability`,
    
    insights: `
## Agent Focus: Business Insights
PRIORITY: Provide business performance summaries and analytics.
Focus on: Revenue metrics, job completion rates, customer satisfaction scores`,
    
    marketing: `
## Agent Focus: Marketing
PRIORITY: Generate promotional offers and analyze customer retention.
Focus on: Campaign creation, customer segmentation, retention analysis`,
  };
  
  return focusMap[agentType] || '';
}
