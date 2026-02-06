import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Agent types and their capabilities
const AGENT_TYPES = {
  // Customer Engagement (Phase 1)
  triage: { name: 'AI Receptionist', category: 'customer_engagement', phase: 1 },
  booking: { name: 'Booking Agent', category: 'customer_engagement', phase: 1 },
  followup: { name: 'Follow-up Agent', category: 'customer_engagement', phase: 1 },
  review: { name: 'Review Agent', category: 'customer_engagement', phase: 1 },
  
  // Field Operations (Phase 2)
  dispatch: { name: 'Dispatch Agent', category: 'field_operations', phase: 2 },
  route: { name: 'Route Agent', category: 'field_operations', phase: 2 },
  eta: { name: 'ETA Agent', category: 'field_operations', phase: 2 },
  checkin: { name: 'Check-in Agent', category: 'field_operations', phase: 2 },
  
  // Business Operations (Phase 3)
  quoting: { name: 'Quoting Agent', category: 'business_operations', phase: 3 },
  invoice: { name: 'Invoice Agent', category: 'business_operations', phase: 3 },
  inventory: { name: 'Inventory Agent', category: 'business_operations', phase: 3 },
  admin: { name: 'Admin Agent', category: 'business_operations', phase: 3 },
  
  // Marketing & Sales (Phase 4)
  marketing: { name: 'Marketing Agent', category: 'marketing_sales', phase: 4 },
  
  // Analytics & Insights (Phase 5)
  insights: { name: 'Business Insights Agent', category: 'analytics', phase: 5 },
  forecast: { name: 'Forecast Agent', category: 'analytics', phase: 5 },
  revenue: { name: 'Revenue Agent', category: 'analytics', phase: 5 },
  performance: { name: 'Performance Agent', category: 'analytics', phase: 5 },
};

// Event routing rules - which agents should receive which events
const EVENT_ROUTING: Record<string, string[]> = {
  'triage_complete': ['booking', 'dispatch'],
  'appointment_booked': ['dispatch', 'route', 'followup'],
  'appointment_cancelled': ['waitlist'],
  'tech_assigned': ['route', 'eta'],
  'route_optimized': ['eta', 'dispatch'],
  'eta_updated': ['checkin'],
  'tech_arrived': ['quoting', 'checkin'],
  'job_complete': ['quoting', 'invoicing', 'followup', 'inventory'],
  'quote_sent': ['invoicing'],
  'quote_approved': ['invoicing', 'inventory'],
  'payment_received': ['followup', 'predictive'],
  'followup_sent': ['review'],
  'review_received': ['predictive', 'performance'],
  'churn_risk_detected': ['marketing'],
  'inventory_low': ['dispatch', 'quoting'],
  'seasonal_trigger': ['marketing'],
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, companyId, agentType, eventType, payload, contextId } = await req.json();

    console.log(`[Orchestrator] Action: ${action}, Company: ${companyId}, Agent: ${agentType}`);

    switch (action) {
      case 'emit_event':
        return await handleEmitEvent(supabase, companyId, agentType, eventType, payload, contextId);
      
      case 'get_context':
        return await handleGetContext(supabase, companyId, contextId);
      
      case 'update_context':
        return await handleUpdateContext(supabase, companyId, contextId, payload);
      
      case 'create_context':
        return await handleCreateContext(supabase, companyId, payload);
      
      case 'handoff':
        return await handleHandoff(supabase, companyId, contextId, agentType, payload);
      
      case 'get_agent_config':
        return await handleGetAgentConfig(supabase, companyId, agentType);
      
      case 'list_agents':
        return await handleListAgents(supabase, companyId);
      
      case 'process_pending_events':
        return await handleProcessPendingEvents(supabase, companyId);
      
      case 'test_agent':
        return await handleTestAgent(supabase, companyId, agentType, payload);
      
      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error: any) {
    console.error('[Orchestrator] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Emit an event to trigger other agents
async function handleEmitEvent(
  supabase: any,
  companyId: string,
  sourceAgent: string,
  eventType: string,
  payload: any,
  contextId?: string
) {
  console.log(`[Orchestrator] Emitting event: ${eventType} from ${sourceAgent}`);
  
  // Get target agents for this event type
  const targetAgents = EVENT_ROUTING[eventType] || [];
  
  // Get enabled agents for this company
  const { data: configs } = await supabase
    .from('ai_agent_configs')
    .select('agent_type')
    .eq('company_id', companyId)
    .eq('is_enabled', true);
  
  const enabledAgents = new Set(configs?.map((c: any) => c.agent_type) || []);
  
  // Filter to only enabled target agents
  const activeTargets = targetAgents.filter(agent => enabledAgents.has(agent));
  
  // Create events for each target
  const events: any[] = activeTargets.map(targetAgent => ({
    company_id: companyId,
    source_agent: sourceAgent,
    target_agent: targetAgent,
    event_type: eventType,
    payload: { ...payload, context_id: contextId },
    status: 'pending',
  }));
  
  // Also create a broadcast event (no specific target)
  events.push({
    company_id: companyId,
    source_agent: sourceAgent,
    target_agent: null as any,
    event_type: eventType,
    payload: { ...payload, context_id: contextId },
    status: 'processed', // Broadcast events are immediately marked processed
  });
  
  const { data, error } = await supabase
    .from('ai_agent_events')
    .insert(events)
    .select();
  
  if (error) throw error;
  
  // Log the event emission
  await supabase.from('ai_agent_logs').insert({
    company_id: companyId,
    agent_type: sourceAgent,
    context_id: contextId,
    action: 'emit_event',
    input_data: { event_type: eventType },
    output_data: { targets: activeTargets, event_count: events.length },
    success: true,
  });
  
  return new Response(JSON.stringify({ 
    success: true, 
    events_created: data?.length || 0,
    target_agents: activeTargets 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Get shared context for a customer journey
async function handleGetContext(supabase: any, companyId: string, contextId: string) {
  const { data, error } = await supabase
    .from('ai_agent_context')
    .select('*')
    .eq('id', contextId)
    .eq('company_id', companyId)
    .single();
  
  if (error) throw error;
  
  return new Response(JSON.stringify({ context: data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Update shared context
async function handleUpdateContext(
  supabase: any,
  companyId: string,
  contextId: string,
  payload: any
) {
  const { data: existing } = await supabase
    .from('ai_agent_context')
    .select('context_data')
    .eq('id', contextId)
    .single();
  
  // Merge new data with existing
  const mergedData = {
    ...existing?.context_data,
    ...payload.context_data,
  };
  
  const { data, error } = await supabase
    .from('ai_agent_context')
    .update({
      context_data: mergedData,
      active_agent: payload.active_agent || existing?.active_agent,
      updated_at: new Date().toISOString(),
    })
    .eq('id', contextId)
    .eq('company_id', companyId)
    .select()
    .single();
  
  if (error) throw error;
  
  return new Response(JSON.stringify({ context: data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Create new context for a customer journey
async function handleCreateContext(supabase: any, companyId: string, payload: any) {
  const { data, error } = await supabase
    .from('ai_agent_context')
    .insert({
      company_id: companyId,
      conversation_id: payload.conversation_id,
      appointment_id: payload.appointment_id,
      customer_phone: payload.customer_phone,
      customer_email: payload.customer_email,
      customer_name: payload.customer_name,
      context_data: payload.context_data || {},
      active_agent: payload.active_agent || 'triage',
      handoff_history: [],
    })
    .select()
    .single();
  
  if (error) throw error;
  
  return new Response(JSON.stringify({ context: data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Handle agent handoff
async function handleHandoff(
  supabase: any,
  companyId: string,
  contextId: string,
  toAgent: string,
  payload: any
) {
  // Get current context
  const { data: context } = await supabase
    .from('ai_agent_context')
    .select('*')
    .eq('id', contextId)
    .single();
  
  if (!context) {
    throw new Error('Context not found');
  }
  
  // Add to handoff history
  const handoffEntry = {
    from_agent: context.active_agent,
    to_agent: toAgent,
    reason: payload.reason || 'Agent handoff',
    timestamp: new Date().toISOString(),
    context_snapshot: payload.context_snapshot || {},
  };
  
  const updatedHistory = [...(context.handoff_history || []), handoffEntry];
  
  // Update context with new active agent
  const { data, error } = await supabase
    .from('ai_agent_context')
    .update({
      active_agent: toAgent,
      handoff_history: updatedHistory,
      context_data: {
        ...context.context_data,
        ...payload.additional_context,
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', contextId)
    .select()
    .single();
  
  if (error) throw error;
  
  // Log the handoff
  await supabase.from('ai_agent_logs').insert({
    company_id: companyId,
    agent_type: toAgent,
    context_id: contextId,
    action: 'handoff_received',
    input_data: { from_agent: context.active_agent, reason: payload.reason },
    output_data: { success: true },
    success: true,
  });
  
  // Emit handoff event
  await supabase.from('ai_agent_events').insert({
    company_id: companyId,
    source_agent: context.active_agent,
    target_agent: toAgent,
    event_type: 'agent_handoff',
    payload: { context_id: contextId, ...payload },
    status: 'pending',
  });
  
  return new Response(JSON.stringify({ 
    success: true, 
    context: data,
    handoff: handoffEntry 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Get agent configuration
async function handleGetAgentConfig(supabase: any, companyId: string, agentType: string) {
  const { data, error } = await supabase
    .from('ai_agent_configs')
    .select('*')
    .eq('company_id', companyId)
    .eq('agent_type', agentType)
    .single();
  
  // If no config exists, return defaults
  if (error || !data) {
    const agentInfo = AGENT_TYPES[agentType as keyof typeof AGENT_TYPES];
    return new Response(JSON.stringify({ 
      config: {
        agent_type: agentType,
        is_enabled: false,
        settings: {},
        ...agentInfo,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  return new Response(JSON.stringify({ 
    config: {
      ...data,
      ...AGENT_TYPES[agentType as keyof typeof AGENT_TYPES],
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// List all agents with their status
async function handleListAgents(supabase: any, companyId: string) {
  // Get all configs for this company
  const { data: configs } = await supabase
    .from('ai_agent_configs')
    .select('*')
    .eq('company_id', companyId);
  
  const configMap = new Map<string, any>(configs?.map((c: any) => [c.agent_type, c]) || []);
  
  // Build full agent list with status
  const agents = Object.entries(AGENT_TYPES).map(([type, info]) => {
    const config = configMap.get(type);
    return {
      type,
      ...info,
      is_enabled: config?.is_enabled || false,
      settings: config?.settings || {},
      config_id: config?.id,
    };
  });
  
  // Group by category
  const grouped = agents.reduce((acc, agent) => {
    if (!acc[agent.category]) acc[agent.category] = [];
    acc[agent.category].push(agent);
    return acc;
  }, {} as Record<string, typeof agents>);
  
  return new Response(JSON.stringify({ 
    agents,
    grouped,
    total: agents.length,
    enabled: agents.filter(a => a.is_enabled).length,
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Process pending events (called by cron or manually)
async function handleProcessPendingEvents(supabase: any, companyId?: string) {
  let query = supabase
    .from('ai_agent_events')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(100);
  
  if (companyId) {
    query = query.eq('company_id', companyId);
  }
  
  const { data: events, error } = await query;
  
  if (error) throw error;
  
  const processed: string[] = [];
  const failed: string[] = [];
  
  for (const event of events || []) {
    try {
      // Mark as processing
      await supabase
        .from('ai_agent_events')
        .update({ status: 'processing' })
        .eq('id', event.id);
      
      // TODO: Route to specific agent handler based on target_agent
      // For now, just mark as processed
      console.log(`[Orchestrator] Processing event ${event.id}: ${event.event_type} -> ${event.target_agent}`);
      
      await supabase
        .from('ai_agent_events')
        .update({ 
          status: 'processed',
          processed_at: new Date().toISOString(),
        })
        .eq('id', event.id);
      
      processed.push(event.id);
    } catch (err: any) {
      console.error(`[Orchestrator] Failed to process event ${event.id}:`, err);
      
      await supabase
        .from('ai_agent_events')
        .update({ 
          status: 'failed',
          error_message: err?.message || 'Unknown error',
        })
        .eq('id', event.id);
      
      failed.push(event.id);
    }
  }
  
  return new Response(JSON.stringify({ 
    processed: processed.length,
    failed: failed.length,
    total: events?.length || 0,
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Test an agent with a simulated message
async function handleTestAgent(
  supabase: any,
  companyId: string,
  agentType: string,
  payload: any
) {
  const startTime = Date.now();
  const message = payload.message || '';
  
  console.log(`[Orchestrator] Testing agent: ${agentType} with message: "${message}"`);
  
  // Get agent config
  const { data: config } = await supabase
    .from('ai_agent_configs')
    .select('*')
    .eq('company_id', companyId)
    .eq('agent_type', agentType)
    .single();
  
  const settings = config?.settings || {};
  const agentInfo = AGENT_TYPES[agentType as keyof typeof AGENT_TYPES];
  
  // Simulate agent processing based on agent type
  let response = '';
  let eventType = '';
  let handoffTo = '';
  const toolCalls: Array<{ name: string; result: string }> = [];
  
  switch (agentType) {
    case 'triage':
      // Analyze intent
      const isUrgent = /urgent|emergency|asap|broken|leak|flood/i.test(message);
      const isBooking = /book|schedule|appointment|available/i.test(message);
      const isPrice = /price|cost|how much|quote/i.test(message);
      
      if (isUrgent) {
        response = "I understand this is urgent. Let me connect you with our dispatch team immediately to get a technician to you as soon as possible.";
        eventType = 'triage_urgent';
        handoffTo = 'dispatch';
        toolCalls.push({ name: 'classify_intent', result: 'urgent' });
      } else if (isBooking) {
        response = "I'd be happy to help you schedule an appointment. Let me transfer you to our booking assistant who can find the best time for you.";
        eventType = 'triage_booking';
        handoffTo = 'booking';
        toolCalls.push({ name: 'classify_intent', result: 'booking' });
      } else if (isPrice) {
        response = "I can help you get a quote for our services. Let me connect you with our quoting specialist.";
        eventType = 'triage_quote';
        handoffTo = 'quoting';
        toolCalls.push({ name: 'classify_intent', result: 'quote_request' });
      } else {
        response = settings.greeting_message || "Hello! How can I assist you today? I can help you schedule appointments, get quotes, or answer questions about our services.";
        eventType = 'triage_greeting';
        toolCalls.push({ name: 'classify_intent', result: 'general_inquiry' });
      }
      break;
    
    case 'booking':
      const hasDate = /monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|today|next week/i.test(message);
      const isCancel = /cancel/i.test(message);
      const isReschedule = /reschedule|change|move/i.test(message);
      
      if (isCancel) {
        response = "I can help you cancel your appointment. I've located your upcoming booking and marked it as cancelled. You'll receive a confirmation shortly.";
        eventType = 'appointment_cancelled';
        toolCalls.push({ name: 'cancel_appointment', result: 'success' });
      } else if (isReschedule) {
        response = "No problem! I can help you reschedule. I see you have an existing appointment. What new date and time would work better for you?";
        eventType = 'reschedule_initiated';
        toolCalls.push({ name: 'get_appointment', result: 'found' });
      } else if (hasDate) {
        response = "I found several available time slots. Would 9:00 AM, 11:00 AM, or 2:00 PM work for you? Just let me know your preference.";
        eventType = 'slots_offered';
        toolCalls.push({ name: 'check_availability', result: '3 slots found' });
      } else {
        response = `We have availability in the next ${settings.booking_window_days || 30} days. What day works best for you?`;
        eventType = 'booking_initiated';
      }
      break;
    
    case 'dispatch':
      const isEmergency = /emergency|urgent|no heat|no power|flood/i.test(message);
      
      if (isEmergency) {
        response = "Emergency dispatch activated. I've identified the nearest available technician (John D.) who can be there within 45 minutes. They're being notified now.";
        eventType = 'tech_assigned';
        handoffTo = 'eta';
        toolCalls.push(
          { name: 'find_nearest_tech', result: 'John D. - 12 miles away' },
          { name: 'assign_job', result: 'Job #J-789 assigned' }
        );
      } else {
        response = "I've analyzed the job requirements and technician availability. Based on skills and proximity, I recommend assigning this to Mike S. who specializes in this service type.";
        eventType = 'tech_recommended';
        toolCalls.push({ name: 'analyze_requirements', result: 'HVAC expertise needed' });
      }
      break;
    
    case 'route':
      response = "Route optimized! I've reorganized today's stops to reduce total drive time by 35 minutes. The new route accounts for current traffic conditions and appointment time windows.";
      eventType = 'route_optimized';
      toolCalls.push(
        { name: 'get_traffic_data', result: 'Congestion on I-95' },
        { name: 'optimize_route', result: '8 stops, 47 miles total' }
      );
      break;
    
    case 'eta':
      response = "The technician is currently 3.2 miles away, estimated arrival in 8 minutes. I'll send the customer an update when they're 5 minutes out.";
      eventType = 'eta_updated';
      toolCalls.push({ name: 'calculate_eta', result: '8 minutes' });
      break;
    
    case 'checkin':
      const isArrival = /arrived|here|check in/i.test(message);
      const isComplete = /complete|done|finished/i.test(message);
      
      if (isArrival) {
        response = "Check-in confirmed! Location verified within the geo-fence. Job timer started. Please remember to take before photos.";
        eventType = 'tech_arrived';
        toolCalls.push(
          { name: 'verify_location', result: 'Within 50m of job site' },
          { name: 'start_timer', result: 'Started at 10:32 AM' }
        );
      } else if (isComplete) {
        response = "Job completion recorded. Total time: 1h 45m. Please upload after photos and collect customer signature for sign-off.";
        eventType = 'job_complete';
        handoffTo = 'invoice';
        toolCalls.push({ name: 'stop_timer', result: '1h 45m' });
      } else {
        response = "Ready for check-in. Please confirm arrival at the job site to start the job timer.";
        eventType = 'checkin_ready';
      }
      break;
    
    case 'quoting':
      response = `Quote generated: Labor (2 hours @ $95/hr) = $190, Parts = $245, Total = $435 + tax. Quote valid for ${settings.quote_validity_days || 30} days. Shall I send this to the customer?`;
      eventType = 'quote_generated';
      toolCalls.push(
        { name: 'calculate_labor', result: '$190' },
        { name: 'lookup_parts', result: '$245' },
        { name: 'generate_quote', result: 'Quote #Q-456' }
      );
      break;
    
    case 'invoice':
      const isReminder = /reminder|overdue/i.test(message);
      
      if (isReminder) {
        response = "Payment reminder sent to customer via email and SMS. This is reminder #2. Invoice is 7 days overdue.";
        eventType = 'reminder_sent';
        toolCalls.push({ name: 'send_reminder', result: 'Email and SMS sent' });
      } else {
        response = "Invoice #INV-789 created for $435.00. Payment link generated and sent to customer. Payment due in 30 days.";
        eventType = 'invoice_created';
        toolCalls.push(
          { name: 'create_invoice', result: 'INV-789' },
          { name: 'generate_payment_link', result: 'https://pay.example.com/xyz' }
        );
      }
      break;
    
    case 'inventory':
      const isLow = /low|stock|reorder/i.test(message);
      
      if (isLow) {
        response = "Low Stock Alert: 3 items below threshold. HVAC Filters (5 remaining), Capacitors (2 remaining), Thermostats (3 remaining). Auto-reorder has been triggered for these items.";
        eventType = 'inventory_low';
        toolCalls.push(
          { name: 'check_stock', result: '3 items low' },
          { name: 'trigger_reorder', result: 'PO #PO-123 created' }
        );
      } else {
        response = "Current inventory status: 127 items tracked, 3 low stock alerts, 2 pending orders. Last inventory sync: 10 minutes ago.";
        eventType = 'inventory_check';
        toolCalls.push({ name: 'get_inventory_status', result: '127 items' });
      }
      break;
    
    case 'warranty':
      const isClaim = /claim|file/i.test(message);
      
      if (isClaim) {
        response = "Warranty claim submitted. Claim #WC-456 filed for AC compressor replacement. Coverage verified - parts and labor covered. Expected processing time: 3-5 business days.";
        eventType = 'claim_filed';
        toolCalls.push(
          { name: 'verify_coverage', result: 'Covered until 2025-06-15' },
          { name: 'file_claim', result: 'WC-456' }
        );
      } else {
        response = "Warranty status: Your AC unit is covered until June 15, 2025. Coverage includes parts and labor for manufacturer defects. 8 months remaining.";
        eventType = 'warranty_checked';
        toolCalls.push({ name: 'check_warranty', result: 'Active, 8 months remaining' });
      }
      break;
    
    case 'followup':
      response = `Thank you for choosing our services! We hope everything went well with your recent ${settings.followup_message ? '' : 'appointment'}. On a scale of 1-5, how would you rate your experience?`;
      eventType = 'followup_sent';
      handoffTo = 'review';
      toolCalls.push({ name: 'send_followup', result: 'Sent via SMS' });
      break;
    
    case 'review':
      const isPositive = /excellent|great|5 star|amazing/i.test(message);
      const isNegative = /bad|poor|1 star|2 star|disappointed/i.test(message);
      
      if (isPositive) {
        response = "Thank you so much for the wonderful feedback! We'd love if you could share your experience on Google. Here's a direct link to leave a review.";
        eventType = 'review_requested';
        toolCalls.push({ name: 'generate_review_link', result: 'Google review link sent' });
      } else if (isNegative) {
        response = "We're sorry to hear about your experience. Your feedback has been escalated to our management team. Someone will reach out within 24 hours to make this right.";
        eventType = 'feedback_escalated';
        toolCalls.push({ name: 'escalate_feedback', result: 'Ticket #T-789 created' });
      } else {
        response = "Review request sent to customer. Will follow up in 24 hours if no response.";
        eventType = 'review_request_sent';
      }
      break;
    
    case 'promo':
      response = `Campaign created: "${settings.default_discount_percent || 15}% Holiday Special" targeting ${settings.target_segments || 'all customers'}. Estimated reach: 450 customers. Ready to launch pending approval.`;
      eventType = 'campaign_created';
      toolCalls.push(
        { name: 'create_campaign', result: 'Campaign #C-123' },
        { name: 'estimate_reach', result: '450 customers' }
      );
      break;
    
    case 'referral':
      response = "Referral program active! Your unique referral link has been generated. Share it with friends and earn $25 credit for each successful referral. They'll get 10% off their first service!";
      eventType = 'referral_link_generated';
      toolCalls.push({ name: 'generate_referral_link', result: 'ref.example.com/ABC123' });
      break;
    
    case 'winback':
      response = "Win-back campaign initiated. Identified 23 customers inactive for 90+ days. Personalized offers with 15% discount will be sent tomorrow morning.";
      eventType = 'winback_initiated';
      toolCalls.push(
        { name: 'identify_churned', result: '23 customers' },
        { name: 'schedule_outreach', result: 'Tomorrow 9 AM' }
      );
      break;
    
    case 'seasonal':
      response = "Seasonal campaign scheduled: Spring HVAC Tune-up. Will launch March 1st, targeting customers who haven't had service in 12+ months. Estimated reach: 180 customers.";
      eventType = 'seasonal_scheduled';
      toolCalls.push({ name: 'schedule_campaign', result: 'March 1st launch' });
      break;
    
    case 'insights':
      response = "Weekly Performance Report:\n• Revenue: $12,450 (+8% vs last week)\n• Jobs Completed: 34 (+3)\n• Avg. Rating: 4.7 ⭐\n• Top Service: AC Repair (40%)\n\nRecommendation: Consider hiring additional HVAC tech to meet demand.";
      eventType = 'report_generated';
      toolCalls.push({ name: 'generate_report', result: 'Weekly summary created' });
      break;
    
    case 'forecast':
      response = "30-Day Forecast:\n• Predicted Demand: 142 jobs (+15%)\n• Revenue Projection: $53,200\n• Peak Days: Mondays & Fridays\n• Capacity Status: 85% utilized\n\nAlert: May need additional capacity in weeks 3-4.";
      eventType = 'forecast_generated';
      toolCalls.push(
        { name: 'analyze_trends', result: '15% growth expected' },
        { name: 'generate_forecast', result: '142 jobs, $53,200' }
      );
      break;
    
    default:
      response = `${agentInfo?.name || agentType} agent processed your request successfully.`;
      eventType = 'agent_processed';
  }
  
  const duration = Date.now() - startTime;
  
  // Log the test
  await supabase.from('ai_agent_logs').insert({
    company_id: companyId,
    agent_type: agentType,
    action: 'test_message',
    input_data: { message, test_mode: true },
    output_data: { response, event_type: eventType, handoff_to: handoffTo, tool_calls: toolCalls },
    success: true,
    duration_ms: duration,
  });
  
  // Create a test event
  await supabase.from('ai_agent_events').insert({
    company_id: companyId,
    source_agent: agentType,
    target_agent: handoffTo || null,
    event_type: `test_${eventType}`,
    payload: { message, response, test_mode: true },
    status: 'processed',
    processed_at: new Date().toISOString(),
  });
  
  return new Response(JSON.stringify({
    response,
    event_type: eventType,
    handoff_to: handoffTo || null,
    tool_calls: toolCalls,
    duration_ms: duration,
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
