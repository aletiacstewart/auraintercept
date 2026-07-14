import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifyCronSecret } from "../_shared/cron-auth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Legacy agent name → 10-operative consolidated name map
const LEGACY_TO_OPERATIVE_MAP: Record<string, string> = {
  campaign: 'outreach',
  lead: 'outreach',
  marketing: 'outreach',
  route: 'field_navigation',
  eta: 'field_navigation',
  checkin: 'field_navigation',
  quoting: 'business_finance',
  invoice: 'business_finance',
  inventory: 'business_finance',
  insights: 'analytics_intelligence',
  performance: 'analytics_intelligence',
  revenue: 'analytics_intelligence',
  forecast: 'analytics_intelligence',
  analytics: 'analytics_intelligence',
  creative: 'creative_content',
  social_content: 'creative_content',
  social_scheduler: 'creative_content',
  social_analytics: 'creative_content',
};

function normalizeAgentName(agent: string): string {
  return LEGACY_TO_OPERATIVE_MAP[agent] || agent;
}


const AGENT_TYPES = {
  // Customer Portal (2 agents)
  triage: { name: 'AI Receptionist', category: 'customer_portal', phase: 1 },
  customer_journey: { name: 'Customer Journey Agent', category: 'customer_portal', phase: 2 },

  // Field Operations (2 agents)
  dispatch: { name: 'Dispatch/GPS Console', category: 'field_operations', phase: 2 },
  field_navigation: { name: 'Field Navigation Agent', category: 'field_operations', phase: 2 },

  // Business Operations (2 agents)
  admin: { name: 'Admin Agent', category: 'business_operations', phase: 3 },
  business_finance: { name: 'Business Finance Agent', category: 'business_operations', phase: 3 },

  // Outreach & Sales (1 merged agent)
  outreach: { name: 'Outreach Agent', category: 'marketing_sales', phase: 4 },

  // Social Media & Creative (1 merged agent)
  creative_content: { name: 'Creative Content Agent', category: 'social_media', phase: 4 },

  // Web Presence (1 agent)
  web_presence: { name: 'Web Presence Agent', category: 'creative_web_presence', phase: 4 },

  // Analytics & Intelligence (1 unified agent)
  analytics_intelligence: { name: 'Analytics Intelligence Agent', category: 'analytics', phase: 5 },
};

// Event routing rules — which agents should receive which events.
//
// NOTE: EVENT_ROUTING intentionally covers only the 10 consolidated operatives.
// The 14 industry specialist operatives (see INDUSTRY_SPECIALIST_OPERATIVES in
// src/lib/subscriptionAgentConfig.ts) are request/response-only: they are
// activated per industry pack and invoked by consolidated operatives via the
// ai-agent-chat tool interface (e.g. `handoff_to_specialist`). They do not
// subscribe to lifecycle events, so they must not appear here.
const EVENT_ROUTING: Record<string, string[]> = {
  // Customer Portal events
  'triage_complete': ['customer_journey', 'dispatch', 'outreach'],
  'appointment_booked': ['dispatch', 'field_navigation', 'customer_journey', 'business_finance'],
  'appointment_cancelled': ['dispatch', 'customer_journey'],
  'tech_assigned': ['field_navigation'],
  'route_optimized': ['field_navigation', 'dispatch'],
  'eta_updated': ['field_navigation'],
  'tech_arrived': ['business_finance', 'field_navigation'],
  'job_complete': ['business_finance', 'customer_journey', 'outreach'],
  'quote_sent': ['business_finance'],
  'quote_approved': ['business_finance'],
  'payment_received': ['customer_journey', 'analytics_intelligence', 'outreach'],
  'followup_sent': ['customer_journey'],
  'review_received': ['analytics_intelligence', 'outreach'],
  'churn_risk_detected': ['outreach'],
  'inventory_low': ['dispatch', 'business_finance', 'admin'],
  'seasonal_trigger': ['outreach'],
  // Outreach & Sales events
  'campaign_created': ['outreach'],
  'lead_qualified': ['outreach', 'customer_journey'],
  'lead_scored': ['outreach', 'customer_journey'],
  // Creative Content events
  'content_generated': ['web_presence'],
  'post_published': ['analytics_intelligence'],
  'content_published': ['web_presence'],
  // Web Presence events
  'blog_published': ['web_presence', 'creative_content'],
  'seo_scan_complete': ['web_presence', 'analytics_intelligence'],
  'content_engine_output': ['creative_content', 'outreach', 'web_presence'],
  // Business lifecycle events
  'invoice_paid': ['customer_journey', 'analytics_intelligence', 'outreach'],
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

    // === AUTH ===
    // Internal callers (cron, edge-to-edge) pass x-internal-secret matching ORCHESTRATOR_SECRET.
    // All other callers must present a valid user JWT whose company_id matches `companyId`.
    const internalSecret = Deno.env.get('ORCHESTRATOR_SECRET');
    const providedInternal = req.headers.get('x-internal-secret');
    const isInternal = !!internalSecret && providedInternal === internalSecret;

    if (!isInternal) {
      const authHeader = req.headers.get('Authorization') || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
      if (!token) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
      const { data: userData, error: userErr } = await userClient.auth.getUser();
      if (userErr || !userData?.user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      // Verify the user belongs to the requested company (platform_admin bypasses)
      if (companyId) {
        const [{ data: isAdmin }, { data: profile }] = await Promise.all([
          supabase.rpc('has_role', { _user_id: userData.user.id, _role: 'platform_admin' }),
          supabase.from('profiles').select('company_id').eq('id', userData.user.id).maybeSingle(),
        ]);
        if (!isAdmin && profile?.company_id !== companyId) {
          return new Response(JSON.stringify({ error: 'Forbidden: company mismatch' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    }

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
      {
        const cronAuth = await verifyCronSecret(req);
        if (!cronAuth.ok) {
          return new Response(JSON.stringify({ error: cronAuth.error }), {
            status: cronAuth.status ?? 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        return await handleProcessPendingEvents(supabase, companyId);
      }
      
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

  // Pipeline side-effect: keep customer_pipeline in sync with lifecycle events.
  // Runs alongside normal event fanout — no new operative required.
  try {
    await upsertPipelineForEvent(supabase, companyId, eventType, payload);
  } catch (pipelineErr) {
    console.error('[Orchestrator] pipeline upsert failed:', pipelineErr);
  }
  
  // Get enabled agents for this company
  const { data: configs } = await supabase
    .from('ai_agent_configs')
    .select('agent_type')
    .eq('company_id', companyId)
    .eq('is_enabled', true);
  
  const enabledAgents = new Set(configs?.map((c: any) => c.agent_type) || []);
  
  // Filter to only enabled target agents — normalize legacy IDs to 10-operative names for DB lookup
  const activeTargets = targetAgents.filter(agent => {
    const normalized = normalizeAgentName(agent);
    return enabledAgents.has(agent) || enabledAgents.has(normalized);
  });
  
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

  // Hydrate context_data with the customer's recent voice + SMS history so
  // the receiving agent sees everything the previous channels know.
  const normalizedPhone = (context.customer_phone || '').replace(/\D/g, '');
  const normalizedEmail = (context.customer_email || '').trim().toLowerCase();

  let recentCalls: any[] = [];
  let recentSms: any[] = [];
  if (normalizedPhone) {
    const { data: calls } = await supabase
      .from('call_logs')
      .select('id, started_at, ended_at, direction, status, summary, transcript, recording_url, duration_seconds')
      .eq('company_id', companyId)
      .or(
        `customer_phone.eq.${context.customer_phone},from_number.eq.${context.customer_phone},to_number.eq.${context.customer_phone}`,
      )
      .order('started_at', { ascending: false })
      .limit(5);
    recentCalls = calls || [];

    const { data: sms } = await supabase
      .from('sms_logs')
      .select('id, created_at, direction, message, from_number, to_number, status')
      .eq('company_id', companyId)
      .or(`from_number.eq.${context.customer_phone},to_number.eq.${context.customer_phone}`)
      .order('created_at', { ascending: false })
      .limit(20);
    recentSms = sms || [];
  }

  // Cap transcript history to last 50 turns to bound row size.
  const existingTranscript: any[] = Array.isArray(context.context_data?.transcript)
    ? context.context_data.transcript
    : [];
  const cappedTranscript = existingTranscript.slice(-50);

  const hydratedContextData = {
    ...(context.context_data || {}),
    ...(payload.additional_context || {}),
    transcript: cappedTranscript,
    history: {
      recent_calls: recentCalls,
      recent_sms: recentSms,
      hydrated_at: new Date().toISOString(),
    },
    customer_identity: {
      name: context.customer_name,
      email: normalizedEmail || null,
      phone: context.customer_phone || null,
    },
  };

  // Add to handoff history with a summary of what's being carried forward.
  const carriedKeys = Object.keys(hydratedContextData).filter(
    (k) => k !== 'transcript' && k !== 'history',
  );
  const handoffEntry = {
    from_agent: context.active_agent,
    to_agent: toAgent,
    reason: payload.reason || 'Agent handoff',
    timestamp: new Date().toISOString(),
    context_snapshot: payload.context_snapshot || {},
    carried_keys: carriedKeys,
    summary: `Carrying ${recentCalls.length} call(s), ${recentSms.length} sms, ${cappedTranscript.length} chat turn(s).`,
  };

  const updatedHistory = [...(context.handoff_history || []), handoffEntry];

  // Update context with new active agent
  const { data, error } = await supabase
    .from('ai_agent_context')
    .update({
      active_agent: toAgent,
      handoff_history: updatedHistory,
      context_data: hydratedContextData,
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

// Process pending events by routing them to the real ai-agent-chat function
async function handleProcessPendingEvents(supabase: any, companyId?: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
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
      
      console.log(`[Orchestrator] Processing event ${event.id}: ${event.event_type} -> ${event.target_agent}`);
      
      // Route to the real ai-agent-chat function for the target agent
      if (event.target_agent) {
        try {
          const eventMessage = `[System Event: ${event.event_type}] ${JSON.stringify(event.payload || {})}`;
          
          const agentResponse = await fetch(`${supabaseUrl}/functions/v1/ai-agent-chat`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              companyId: event.company_id,
              agentType: event.target_agent,
              message: eventMessage,
              conversationHistory: [],
              systemEvent: true,
            }),
          });
          
          if (!agentResponse.ok) {
            const errText = await agentResponse.text();
            console.error(`[Orchestrator] Agent ${event.target_agent} returned error:`, errText);
          } else {
            console.log(`[Orchestrator] Event ${event.id} routed to ${event.target_agent} successfully`);
          }
        } catch (routeErr) {
          console.error(`[Orchestrator] Failed to route event to ${event.target_agent}:`, routeErr);
        }
      }
      
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

// Test an agent by routing the message through the real ai-agent-chat pipeline
async function handleTestAgent(
  supabase: any,
  companyId: string,
  agentType: string,
  payload: any
) {
  const startTime = Date.now();
  const message = payload.message || '';
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
  console.log(`[Orchestrator] Testing agent: ${agentType} with message: "${message}"`);
  
  // Get agent config to verify it exists
  const { data: config } = await supabase
    .from('ai_agent_configs')
    .select('*')
    .eq('company_id', companyId)
    .eq('agent_type', agentType)
    .single();
  
  const agentInfo = AGENT_TYPES[agentType as keyof typeof AGENT_TYPES];
  
  try {
    // Forward the test message to the real ai-agent-chat function
    const agentResponse = await fetch(`${supabaseUrl}/functions/v1/ai-agent-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        companyId,
        agentType,
        message,
        conversationHistory: payload.conversationHistory || [],
        testMode: true,
      }),
    });
    
    const duration = Date.now() - startTime;
    
    if (!agentResponse.ok) {
      const errorText = await agentResponse.text();
      console.error(`[Orchestrator] Agent test failed:`, errorText);
      
      // Log the failure
      await supabase.from('ai_agent_logs').insert({
        company_id: companyId,
        agent_type: agentType,
        action: 'test_message',
        input_data: { message, test_mode: true },
        output_data: { error: errorText },
        success: false,
        duration_ms: duration,
      });
      
      return new Response(JSON.stringify({
        response: `Agent test failed: ${errorText}`,
        event_type: 'test_error',
        handoff_to: null,
        tool_calls: [],
        duration_ms: duration,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const agentResult = await agentResponse.json();
    
    // Extract relevant info from the real agent response
    const response = agentResult.response || agentResult.message || 'Agent processed the request.';
    const toolCalls = (agentResult.toolCalls || agentResult.tool_calls || []).map((tc: any) => ({
      name: tc.name || tc.function?.name || 'unknown',
      result: typeof tc.result === 'string' ? tc.result : JSON.stringify(tc.result || tc.output || 'completed'),
    }));
    const handoffTo = agentResult.handoff_to || agentResult.handoffTo || null;
    const eventType = agentResult.event_type || 'agent_response';
    
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
      handoff_to: handoffTo,
      tool_calls: toolCalls,
      duration_ms: duration,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('[Orchestrator] Agent test error:', error);
    
    await supabase.from('ai_agent_logs').insert({
      company_id: companyId,
      agent_type: agentType,
      action: 'test_message',
      input_data: { message, test_mode: true },
      output_data: { error: error.message },
      success: false,
      duration_ms: duration,
    });
    
    return new Response(JSON.stringify({
      response: `Error testing agent: ${error.message}`,
      event_type: 'test_error',
      handoff_to: null,
      tool_calls: [],
      duration_ms: duration,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// ---------------------------------------------------------------------------
// Pipeline side-effects: updates customer_pipeline on lifecycle events.
// No new operative — pipeline data is owned by outreach/customer_journey/
// business_finance and read via ai-agent-chat tools.
// ---------------------------------------------------------------------------

const PIPELINE_EVENT_STAGE_MAP: Record<string, string | null> = {
  lead_qualified: 'contacted',
  lead_scored: 'contacted',
  quote_sent: 'quoted',
  quote_approved: 'quoted',
  payment_received: 'won',
  invoice_paid: 'won',
  job_complete: 'won',
  review_received: null, // touch last_activity_at only
  churn_risk_detected: null, // sets next_action, no stage change
};

async function upsertPipelineForEvent(
  supabase: any,
  companyId: string,
  eventType: string,
  payload: any,
) {
  if (!(eventType in PIPELINE_EVENT_STAGE_MAP)) return;
  if (!companyId) return;

  const p = payload || {};
  const customerProfileId: string | null =
    p.customer_profile_id || p.customerProfileId || null;
  const leadId: string | null = p.lead_id || p.leadId || null;

  if (!customerProfileId && !leadId) {
    console.log(`[Pipeline] skipping ${eventType} — no customer_profile_id or lead_id in payload`);
    return;
  }

  // Find existing row keyed by customer_profile_id first, then lead_id
  let existingId: string | null = null;
  if (customerProfileId) {
    const { data } = await supabase
      .from('customer_pipeline')
      .select('id, stage')
      .eq('company_id', companyId)
      .eq('customer_profile_id', customerProfileId)
      .maybeSingle();
    if (data?.id) existingId = data.id;
  }
  if (!existingId && leadId) {
    const { data } = await supabase
      .from('customer_pipeline')
      .select('id, stage')
      .eq('company_id', companyId)
      .eq('lead_id', leadId)
      .maybeSingle();
    if (data?.id) existingId = data.id;
  }

  const targetStage = PIPELINE_EVENT_STAGE_MAP[eventType];
  const nowIso = new Date().toISOString();
  const patch: Record<string, any> = { last_activity_at: nowIso };

  if (targetStage) patch.stage = targetStage;
  if (typeof p.deal_value_cents === 'number') patch.deal_value_cents = p.deal_value_cents;

  if (eventType === 'churn_risk_detected') {
    patch.next_action = p.next_action || 'Send win-back offer (no contact 90+ days)';
    patch.next_action_due_at = p.next_action_due_at || nowIso;
  }

  if (existingId) {
    // Do not downgrade from won → quoted etc.
    const stageRank: Record<string, number> = {
      new: 0, contacted: 1, quoted: 2, won: 3, repeat_customer: 4, lost: -1,
    };
    if (patch.stage) {
      const { data: cur } = await supabase
        .from('customer_pipeline')
        .select('stage')
        .eq('id', existingId)
        .maybeSingle();
      if (cur?.stage && (stageRank[patch.stage] ?? 0) < (stageRank[cur.stage] ?? 0)) {
        delete patch.stage;
      }
    }
    await supabase.from('customer_pipeline').update(patch).eq('id', existingId);
  } else {
    await supabase.from('customer_pipeline').insert({
      company_id: companyId,
      customer_profile_id: customerProfileId,
      lead_id: leadId,
      stage: targetStage || 'new',
      ...patch,
    });
  }
}
