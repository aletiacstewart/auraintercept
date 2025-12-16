import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Agent types and their capabilities
const AGENT_TYPES = {
  // Customer Engagement (Phase 1)
  triage: { name: 'Pre-Service Triage', category: 'customer_engagement', phase: 1 },
  waitlist: { name: 'Waitlist & Cancellation Recovery', category: 'customer_engagement', phase: 1 },
  followup: { name: 'Post-Service Follow-up', category: 'customer_engagement', phase: 1 },
  booking: { name: 'Intelligent Booking', category: 'customer_engagement', phase: 1 },
  
  // Field Operations (Phase 2)
  dispatch: { name: 'Smart Dispatch', category: 'field_operations', phase: 2 },
  route: { name: 'Route Optimization', category: 'field_operations', phase: 2 },
  eta: { name: 'Real-time ETA', category: 'field_operations', phase: 2 },
  checkin: { name: 'Field Tech Check-in', category: 'field_operations', phase: 2 },
  
  // Business Operations (Phase 3)
  quoting: { name: 'Smart Quoting', category: 'business_operations', phase: 3 },
  invoicing: { name: 'Invoice & Payment', category: 'business_operations', phase: 3 },
  warranty: { name: 'Warranty Tracking', category: 'business_operations', phase: 3 },
  inventory: { name: 'Inventory Alerts', category: 'business_operations', phase: 3 },
  
  // Marketing & Sales (Phase 4)
  review: { name: 'Review Response', category: 'marketing_sales', phase: 4 },
  winback: { name: 'Customer Win-back', category: 'marketing_sales', phase: 4 },
  seasonal: { name: 'Seasonal Campaigns', category: 'marketing_sales', phase: 4 },
  referral: { name: 'Referral Program', category: 'marketing_sales', phase: 4 },
  
  // Analytics & Insights (Phase 5)
  predictive: { name: 'Predictive Analytics', category: 'analytics', phase: 5 },
  performance: { name: 'Performance Coaching', category: 'analytics', phase: 5 },
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
  'churn_risk_detected': ['winback'],
  'inventory_low': ['dispatch', 'quoting'],
  'seasonal_trigger': ['seasonal'],
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
