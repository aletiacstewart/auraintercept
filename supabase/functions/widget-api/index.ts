import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Rate limiting configuration
const RATE_LIMITS = {
  chat: { requests: 20, windowSeconds: 60 },    // 20 requests per minute
  book: { requests: 5, windowSeconds: 300 },    // 5 bookings per 5 minutes
  config: { requests: 30, windowSeconds: 60 },  // 30 requests per minute
  slug: { requests: 10, windowSeconds: 60 },    // 10 slug lookups per minute (prevent enumeration)
};

// In-memory rate limit store (per-instance, resets on cold start)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

// Track failed slug lookups for enumeration detection
const failedSlugAttempts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(identifier: string, action: string): { allowed: boolean; retryAfter?: number } {
  const config = RATE_LIMITS[action as keyof typeof RATE_LIMITS] || RATE_LIMITS.config;
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

// Constant-time string comparison to prevent timing attacks
function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still do comparison to maintain constant time
    let result = 0;
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      result |= (a.charCodeAt(i % a.length) || 0) ^ (b.charCodeAt(i % b.length) || 0);
    }
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// Add artificial delay to normalize response times
async function normalizeResponseTime(startTime: number, targetMs: number = 100): Promise<void> {
  const elapsed = Date.now() - startTime;
  if (elapsed < targetMs) {
    await new Promise(resolve => setTimeout(resolve, targetMs - elapsed));
  }
}

// Check for slug enumeration attempts
function checkSlugEnumeration(clientIP: string): boolean {
  const now = Date.now();
  const record = failedSlugAttempts.get(clientIP);
  
  if (record && now < record.resetAt && record.count >= 5) {
    // More than 5 failed attempts in the window - possible enumeration
    console.warn(`Possible slug enumeration attempt from ${clientIP}`);
    return true;
  }
  return false;
}

function recordFailedSlugAttempt(clientIP: string): void {
  const now = Date.now();
  const record = failedSlugAttempts.get(clientIP);
  
  if (!record || now > record.resetAt) {
    failedSlugAttempts.set(clientIP, { count: 1, resetAt: now + 300000 }); // 5 min window
  } else {
    record.count++;
  }
}

// Input validation functions
function validateEmail(email: string | null | undefined): { valid: boolean; error?: string } {
  if (!email || email === '') return { valid: true }; // Optional field
  if (email.length > 254) return { valid: false, error: 'Email too long (max 254 characters)' };
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return { valid: false, error: 'Invalid email format' };
  return { valid: true };
}

function validatePhone(phone: string | null | undefined): { valid: boolean; error?: string } {
  if (!phone || phone === '') return { valid: true }; // Optional field
  if (phone.length > 20) return { valid: false, error: 'Phone number too long (max 20 characters)' };
  const phoneRegex = /^[\d\s\-\+\(\)]{7,20}$/;
  if (!phoneRegex.test(phone)) return { valid: false, error: 'Invalid phone format' };
  return { valid: true };
}

function sanitizeString(input: string | null | undefined, maxLength: number): string {
  if (!input) return '';
  // HTML entity encoding for XSS prevention
  return input
    .slice(0, maxLength)
    .trim()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function validateBookingInput(args: any): { valid: boolean; errors: string[]; sanitized: any } {
  const errors: string[] = [];
  
  // Validate required fields
  if (!args.customer_name || args.customer_name.trim() === '') {
    errors.push('Customer name is required');
  }
  if (!args.customer_phone || args.customer_phone.trim() === '') {
    errors.push('Customer phone is required');
  }
  if (!args.service_type || args.service_type.trim() === '') {
    errors.push('Service type is required');
  }
  if (!args.preferred_datetime) {
    errors.push('Preferred date/time is required');
  }
  
  // Validate formats
  const emailCheck = validateEmail(args.customer_email);
  if (!emailCheck.valid) errors.push(emailCheck.error!);
  
  const phoneCheck = validatePhone(args.customer_phone);
  if (!phoneCheck.valid) errors.push(phoneCheck.error!);
  
  // Validate datetime format
  if (args.preferred_datetime) {
    const date = new Date(args.preferred_datetime);
    if (isNaN(date.getTime())) {
      errors.push('Invalid date/time format');
    } else if (date < new Date()) {
      errors.push('Appointment date must be in the future');
    }
  }
  
  // Sanitize inputs
  const sanitized = {
    customer_name: sanitizeString(args.customer_name, 100),
    customer_phone: sanitizeString(args.customer_phone, 20),
    customer_email: args.customer_email ? sanitizeString(args.customer_email, 254) : null,
    customer_address: args.customer_address ? sanitizeString(args.customer_address, 500) : null,
    service_type: sanitizeString(args.service_type, 100),
    preferred_datetime: args.preferred_datetime,
    notes: args.notes ? sanitizeString(args.notes, 2000) : null,
    is_emergency: Boolean(args.is_emergency),
  };
  
  return { valid: errors.length === 0, errors, sanitized };
}

function getClientIP(req: Request): string {
  // Try various headers for client IP
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIP = req.headers.get('x-real-ip');
  if (realIP) return realIP;
  return 'unknown';
}

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
    const clientIP = getClientIP(req);

    if (!companySlug) {
      await normalizeResponseTime(Date.now(), 100);
      return new Response(JSON.stringify({ error: 'Invalid request' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check for slug enumeration attempts before any database query
    if (checkSlugEnumeration(clientIP)) {
      await normalizeResponseTime(Date.now(), 100);
      return new Response(JSON.stringify({ error: 'Invalid request' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Rate limiting check - includes slug lookup rate limit
    const slugRateCheck = checkRateLimit(clientIP, 'slug');
    if (!slugRateCheck.allowed) {
      console.log(`Slug rate limit exceeded for ${clientIP}`);
      await normalizeResponseTime(Date.now(), 100);
      return new Response(JSON.stringify({ error: 'Invalid request' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const rateLimitAction = action === 'book' ? 'book' : action === 'chat' ? 'chat' : 'config';
    const rateCheck = checkRateLimit(clientIP, rateLimitAction);
    if (!rateCheck.allowed) {
      console.log(`Rate limit exceeded for ${clientIP} on action ${rateLimitAction}`);
      return new Response(JSON.stringify({ 
        error: 'Too many requests. Please try again later.',
        retryAfter: rateCheck.retryAfter 
      }), {
        status: 429,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Retry-After': String(rateCheck.retryAfter || 60)
        },
      });
    }

    // Get company by slug with timing normalization
    const queryStartTime = Date.now();
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('slug', companySlug)
      .single();

    // SECURITY: Normalize response time and return generic error to prevent enumeration
    if (companyError || !company) {
      recordFailedSlugAttempt(clientIP);
      await normalizeResponseTime(queryStartTime, 100);
      return new Response(JSON.stringify({ error: 'Invalid request' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Also normalize successful responses to have similar timing
    await normalizeResponseTime(queryStartTime, 100);

    // Get company config action - using secure RPC functions
    if (action === 'config') {
      const { data: hours } = await supabase
        .rpc('get_company_business_hours', { p_company_id: company.id });

      const { data: services } = await supabase
        .rpc('get_company_services', { p_company_id: company.id });

      // Determine effective tier (trial gets full access)
      const inTrial = company.trial_ends_at && new Date(company.trial_ends_at) > new Date();
      const effectiveTier = inTrial ? 'command' : (company.subscription_tier || 'single_point');

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
          subscription_tier: effectiveTier,
          in_trial: inTrial,
        },
        business_hours: hours || [],
        services: services || [],
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Quick actions endpoint - filtered by subscription tier
    if (action === 'quick-actions') {
      // Determine effective tier
      const inTrial = company.trial_ends_at && new Date(company.trial_ends_at) > new Date();
      const effectiveTier = inTrial ? 'command' : (company.subscription_tier || 'single_point');
      
      // All available actions
      const allActions = [
        { id: 'schedule', label: 'Book Appointment', icon: 'calendar', message: "I'd like to schedule an appointment", requiresTier: 'multi_track' },
        { id: 'emergency', label: 'Emergency', icon: 'alert-triangle', highlight: true, message: "I have an urgent emergency situation", requiresTier: 'single_point' },
        { id: 'quote', label: 'Get Quote', icon: 'dollar-sign', message: "I need a quote for your services", requiresTier: 'multi_track' },
        { id: 'hours', label: 'Business Hours', icon: 'clock', message: "What are your business hours?", requiresTier: 'single_point' },
        { id: 'services', label: 'View Services', icon: 'sparkles', message: "What services do you offer?", requiresTier: 'single_point' },
        { id: 'track', label: 'Track Appointment', icon: 'map-pin', message: "I want to track my appointment status", requiresTier: 'multi_track' },
        { id: 'feedback', label: 'Leave Feedback', icon: 'star', message: "I'd like to leave feedback about my service", requiresTier: 'single_point' },
      ];
      
      // Tier hierarchy for filtering
      const tierLevels = { 'single_point': 1, 'multi_track': 2, 'command': 3 };
      const companyLevel = tierLevels[effectiveTier as keyof typeof tierLevels] || 1;
      
      // Filter actions based on tier
      let filteredActions = allActions.filter(action => {
        const requiredLevel = tierLevels[action.requiresTier as keyof typeof tierLevels] || 1;
        return companyLevel >= requiredLevel;
      });
      
      // For single_point, replace schedule with call_to_book if company has phone
      if (effectiveTier === 'single_point' && company.dispatch_phone) {
        filteredActions = filteredActions.filter(a => a.id !== 'schedule');
        filteredActions.unshift({
          id: 'call_to_book',
          label: 'Call to Book',
          icon: 'phone',
          message: '',
          requiresTier: 'single_point',
          isCallAction: true,
          phoneNumber: company.dispatch_phone,
        } as any);
      }
      
      return new Response(JSON.stringify({
        actions: filteredActions,
        subscription_tier: effectiveTier,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Chat action with multi-agent support
    if (action === 'chat' && req.method === 'POST') {
      const { messages, session_id, customer_user_id } = await req.json();

      // Validate messages array
      if (!Array.isArray(messages) || messages.length === 0) {
        return new Response(JSON.stringify({ error: 'Messages array is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Limit message count to prevent abuse
      if (messages.length > 50) {
        return new Response(JSON.stringify({ error: 'Too many messages in conversation' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Build comprehensive knowledge base context using secure RPC functions
      const [servicesRes, faqsRes, hoursRes, docsRes, employeesRes] = await Promise.all([
        supabase.rpc('get_company_services', { p_company_id: company.id }),
        supabase.rpc('get_company_faqs', { p_company_id: company.id }),
        supabase.rpc('get_company_business_hours', { p_company_id: company.id }),
        supabase.from('knowledge_documents').select('name, content_text').eq('company_id', company.id),
        supabase.from('profiles').select('id, full_name, availability_json').eq('company_id', company.id),
      ]);

      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const today = new Date();
      const currentDay = dayNames[today.getDay()];
      const currentTime = today.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

      const hoursText = (hoursRes.data || []).map((h: any) => 
        h.is_closed ? `${dayNames[h.day_of_week]}: Closed` : `${dayNames[h.day_of_week]}: ${h.open_time} - ${h.close_time}`
      ).join('\n');

      const servicesText = (servicesRes.data || []).map((s: any) => 
        `- ${s.name}: ${s.duration_minutes} mins, $${s.price || 'varies'}${s.description ? ` - ${s.description}` : ''}`
      ).join('\n');

      const faqsText = (faqsRes.data || []).map((f: any) => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');
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

      // Single-pass streaming with tool support - uses faster model
      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [{ role: "system", content: systemPrompt }, ...messages],
          tools,
          stream: true,
        }),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error('AI Gateway error:', aiResponse.status, errorText);
        
        if (aiResponse.status === 429) {
          return new Response(JSON.stringify({ error: 'Service busy, please try again' }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        if (aiResponse.status === 402) {
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

      // Check if we need to handle tool calls by consuming the stream
      const reader = aiResponse.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';
      let toolCalls: any[] = [];
      let hasToolCalls = false;

      // Collect chunks to detect tool calls
      const chunks: Uint8Array[] = [];
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        buffer += decoder.decode(value, { stream: true });
        
        // Quick check for tool_calls in buffer
        if (buffer.includes('"tool_calls"') || buffer.includes('"function"')) {
          hasToolCalls = true;
        }
        
        // Parse content for streaming
        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta;
            
            if (delta?.content) {
              fullContent += delta.content;
            }
            
            if (delta?.tool_calls) {
              hasToolCalls = true;
              for (const tc of delta.tool_calls) {
                const idx = tc.index ?? 0;
                if (!toolCalls[idx]) {
                  toolCalls[idx] = { id: tc.id, function: { name: '', arguments: '' } };
                }
                if (tc.id) toolCalls[idx].id = tc.id;
                if (tc.function?.name) toolCalls[idx].function.name += tc.function.name;
                if (tc.function?.arguments) toolCalls[idx].function.arguments += tc.function.arguments;
              }
            }
          } catch { /* ignore parse errors */ }
        }
      }

      // If tool calls detected, process them and make follow-up request
      if (hasToolCalls && toolCalls.length > 0) {
        console.log('Processing tool calls:', toolCalls);
        
        const toolResults: any[] = [];
        
        for (const toolCall of toolCalls) {
          if (!toolCall.function?.name) continue;
          
          const funcName = toolCall.function.name;
          let args: any = {};
          try {
            args = JSON.parse(toolCall.function.arguments || '{}');
          } catch (e) {
            console.error('Failed to parse tool args:', e);
          }
          
          let result = '';
          
          if (funcName === 'book_appointment') {
            const validation = validateBookingInput(args);
            if (!validation.valid) {
              result = JSON.stringify({ success: false, error: 'Invalid booking data', details: validation.errors });
            } else {
              const bookingRateCheck = checkRateLimit(clientIP, 'book');
              if (!bookingRateCheck.allowed) {
                result = JSON.stringify({ success: false, error: 'Too many booking attempts. Please try again later.' });
              } else {
                const { data: service } = await supabase
                  .from('services')
                  .select('*')
                  .eq('company_id', company.id)
                  .ilike('name', `%${validation.sanitized.service_type}%`)
                  .maybeSingle();

                const { data: appointment, error: bookError } = await supabase
                  .from('appointments')
                  .insert({
                    company_id: company.id,
                    customer_name: validation.sanitized.customer_name,
                    customer_phone: validation.sanitized.customer_phone,
                    customer_email: validation.sanitized.customer_email,
                    customer_address: validation.sanitized.customer_address,
                    service_type: validation.sanitized.service_type,
                    datetime: validation.sanitized.preferred_datetime,
                    duration_minutes: service?.duration_minutes || 60,
                    notes: validation.sanitized.notes,
                    status: validation.sanitized.is_emergency ? 'emergency' : 'pending',
                    customer_user_id: customer_user_id || null,
                  })
                  .select()
                  .single();

                if (bookError) {
                  result = JSON.stringify({ success: false, error: 'Failed to book appointment' });
                } else {
                  if (validation.sanitized.is_emergency && appointment) {
                    await supabase.from('job_assignments').insert({
                      company_id: company.id,
                      appointment_id: appointment.id,
                      customer_address: validation.sanitized.customer_address,
                      status: 'pending_acceptance',
                    });
                  }
                  result = JSON.stringify({ success: true, appointment_id: appointment.id, message: 'Appointment booked successfully' });
                }
              }
            }
          } else if (funcName === 'check_availability') {
            const { data: hours } = await supabase
              .from('business_hours')
              .select('*')
              .eq('company_id', company.id)
              .eq('is_closed', false);
            const slots = hours?.length ? ['9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM', '4:00 PM'] : [];
            result = JSON.stringify({ available_slots: slots, date: args.date });
          } else if (funcName === 'get_quote') {
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
            const { data: techs } = await supabase
              .from('profiles')
              .select('id, full_name, availability_json')
              .eq('company_id', company.id)
              .not('availability_json', 'is', null);
            
            const available = (techs || []).filter(t => t.availability_json).slice(0, 3);
            result = JSON.stringify({ available_technicians: available.map(t => ({ id: t.id, name: t.full_name })), count: available.length });
          } else if (funcName === 'assign_technician') {
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
              
              result = assignError 
                ? JSON.stringify({ success: false, error: 'Failed to assign technician' })
                : JSON.stringify({ success: true, technician_name: techs?.[0]?.full_name, message: 'Technician assigned' });
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
        
        // Make follow-up streaming request with tool results
        const followUpResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: systemPrompt },
              ...messages,
              { role: "assistant", content: fullContent || null, tool_calls: toolCalls },
              ...toolResults,
            ],
            stream: true,
          }),
        });

        if (!followUpResponse.ok) {
          return new Response(JSON.stringify({ error: 'AI service error' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(followUpResponse.body, {
          headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
        });
      }
      
      // No tool calls - reconstruct the stream from collected chunks
      const reconstructedStream = new ReadableStream({
        start(controller) {
          for (const chunk of chunks) {
            controller.enqueue(chunk);
          }
          controller.close();
        }
      });

      return new Response(reconstructedStream, {
        headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
      });
    }

    // Book appointment action (direct API)
    if (action === 'book' && req.method === 'POST') {
      const booking = await req.json();

      // Validate booking input
      const validation = validateBookingInput(booking);
      if (!validation.valid) {
        return new Response(JSON.stringify({ 
          error: 'Invalid booking data', 
          details: validation.errors 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Find matching service
      const { data: service } = await supabase
        .from('services')
        .select('*')
        .eq('company_id', company.id)
        .ilike('name', `%${validation.sanitized.service_type}%`)
        .single();

      const { data: appointment, error: bookError } = await supabase
        .from('appointments')
        .insert({
          company_id: company.id,
          customer_name: validation.sanitized.customer_name,
          customer_phone: validation.sanitized.customer_phone,
          customer_email: validation.sanitized.customer_email,
          service_type: validation.sanitized.service_type,
          datetime: validation.sanitized.preferred_datetime,
          duration_minutes: service?.duration_minutes || 60,
          notes: validation.sanitized.notes,
          status: validation.sanitized.is_emergency ? 'emergency' : 'pending',
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

      console.log(`Direct booking created: ${appointment.id}`);
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
