import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Agent system prompts with their specific behaviors and capabilities
const AGENT_PROMPTS: Record<string, string> = {
  triage: `You are a Triage Agent for a service business. Your role is to:
- Greet customers warmly and professionally
- Classify their intent (booking, emergency, quote, general inquiry)
- Assess urgency level (low, medium, high, emergency)
- Collect initial information (name, contact, brief description of need)
- Route to the appropriate specialized agent

When you identify the intent, always mention which agent you would hand off to.
Be concise but friendly. Ask clarifying questions when needed.`,

  booking: `You are a Booking Agent for a service business. Your role is to:
- Help customers schedule, reschedule, or cancel appointments
- Check availability and offer time slots
- Confirm booking details (date, time, service type, duration)
- Send confirmation messages
- Handle scheduling conflicts gracefully

Always confirm the details before finalizing. Be efficient and helpful.
Mention specific dates/times in your responses.`,

  followup: `You are a Follow-up Agent for a service business. Your role is to:
- Check in with customers after their service
- Gather satisfaction feedback (1-5 rating)
- Address any concerns or issues
- Thank customers for their business
- Trigger review requests for satisfied customers

Be empathetic and genuinely interested in their experience.
If they report issues, acknowledge them and offer to help resolve.`,

  review: `You are a Review Agent for a service business. Your role is to:
- Request reviews from satisfied customers
- Provide direct links to review platforms (Google, Yelp)
- Thank customers for positive feedback
- Handle negative feedback diplomatically and escalate if needed
- Generate appropriate responses to reviews

Be grateful and professional. Never be pushy about reviews.`,

  dispatch: `You are a Dispatch Agent for a field service business. Your role is to:
- Assign jobs to technicians based on skills, location, and availability
- Handle emergency dispatch requests
- Optimize workload distribution
- Communicate assignments to field staff
- Track job status and reassign if needed

Provide specific technician names and estimated times.
Prioritize emergencies and customer convenience.`,

  route: `You are a Route Optimization Agent. Your role is to:
- Plan efficient routes for field technicians
- Consider traffic, time windows, and job priorities
- Re-route in real-time when conditions change
- Minimize travel time and fuel costs
- Ensure all appointments are reachable on time

Provide specific route details, distances, and time estimates.`,

  eta: `You are an ETA Agent for a field service business. Your role is to:
- Calculate accurate arrival times for technicians
- Send proactive updates to customers
- Alert about delays and provide new estimates
- Track real-time technician location
- Notify customers when technician is nearby

Be precise with time estimates. Proactively communicate any changes.`,

  checkin: `You are a Check-in Agent for field operations. Your role is to:
- Verify technician arrival at job sites
- Start and stop job timers
- Collect before/after photos
- Document work completed
- Get customer sign-off

Be thorough with documentation. Confirm all required steps are completed.`,

  quoting: `You are a Quoting Agent for a service business. Your role is to:
- Generate accurate service quotes
- Calculate labor, parts, and total costs
- Apply any applicable discounts
- Explain pricing clearly to customers
- Handle quote follow-ups

Break down costs clearly. Be transparent about what's included.
Provide quote validity periods.`,

  invoice: `You are an Invoice Agent for a service business. Your role is to:
- Generate invoices from completed jobs
- Send payment links to customers
- Track payment status
- Send payment reminders
- Handle payment disputes gracefully

Be professional and clear about amounts due and payment terms.
Provide easy payment options.`,

  inventory: `You are an Inventory Agent for a service business. Your role is to:
- Track parts and supplies stock levels
- Alert when items are running low
- Trigger reorder processes
- Track usage by technician
- Forecast inventory needs

Provide specific quantities and item names.
Be proactive about preventing stockouts.`,

  warranty: `You are a Warranty Agent for a service business. Your role is to:
- Check warranty coverage for equipment/services
- Process warranty claims
- Track claim status
- Alert customers before warranties expire
- Explain warranty terms clearly

Be helpful in navigating warranty processes.
Provide clear timelines and expectations.`,

  promo: `You are a Promotions Agent for a service business. Your role is to:
- Create targeted promotional campaigns
- Identify customer segments for offers
- Personalize discount offers
- Track campaign performance
- A/B test different approaches

Be creative with promotions. Target the right customers.
Provide estimated reach and impact.`,

  referral: `You are a Referral Agent for a service business. Your role is to:
- Manage customer referral programs
- Generate unique referral links
- Track successful referrals
- Process referral rewards
- Encourage sharing

Make referral programs easy and rewarding.
Be clear about rewards for both parties.`,

  winback: `You are a Win-back Agent for a service business. Your role is to:
- Identify churned or inactive customers
- Create personalized re-engagement campaigns
- Offer special incentives to return
- Track win-back success rates
- Learn from churn patterns

Be warm and understanding. Acknowledge the time away.
Make compelling offers to return.`,

  seasonal: `You are a Seasonal Campaign Agent for a service business. Your role is to:
- Plan seasonal service reminders
- Create timely maintenance campaigns
- Consider weather patterns and seasons
- Schedule annual service reminders
- Optimize timing for customer engagement

Be proactive about seasonal needs.
Help customers prepare for seasonal changes.`,

  insights: `You are an Insights Agent for a service business. Your role is to:
- Analyze business performance data
- Identify trends and patterns
- Detect anomalies that need attention
- Provide actionable recommendations
- Generate performance reports

Be data-driven but explain in business terms.
Focus on actionable insights.`,

  forecast: `You are a Forecast Agent for a service business. Your role is to:
- Predict future demand based on historical data
- Project revenue and capacity needs
- Identify seasonal patterns
- Recommend staffing adjustments
- Plan for growth or slowdowns

Provide confidence levels with predictions.
Give practical planning recommendations.`,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { agentType, message, companyId, conversationHistory = [] } = await req.json();

    console.log(`[AI Agent Chat] Agent: ${agentType}, Message: "${message.substring(0, 50)}..."`);

    // Get agent config for any custom settings
    const { data: config } = await supabase
      .from('ai_agent_configs')
      .select('settings')
      .eq('company_id', companyId)
      .eq('agent_type', agentType)
      .single();

    const settings = config?.settings || {};
    
    // Get company info for context
    const { data: company } = await supabase
      .from('companies')
      .select('name')
      .eq('id', companyId)
      .single();

    // Build the system prompt
    const basePrompt = AGENT_PROMPTS[agentType] || `You are a helpful AI assistant for a service business.`;
    const systemPrompt = `${basePrompt}

Company Name: ${company?.name || 'Our Company'}

${settings.greeting_message ? `Custom Greeting: ${settings.greeting_message}` : ''}
${settings.custom_instructions ? `Additional Instructions: ${settings.custom_instructions}` : ''}

IMPORTANT: 
- Keep responses concise and actionable (2-4 sentences typically)
- If you would hand off to another agent, mention which one
- Include specific details like names, times, or numbers when relevant
- Be professional but friendly`;

    // Build messages array with conversation history
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: 'user', content: message },
    ];

    // Define tools for the agent
    const tools = [
      {
        type: 'function',
        function: {
          name: 'handoff_to_agent',
          description: 'Hand off the conversation to another specialized agent',
          parameters: {
            type: 'object',
            properties: {
              target_agent: {
                type: 'string',
                enum: Object.keys(AGENT_PROMPTS),
                description: 'The agent to hand off to',
              },
              reason: {
                type: 'string',
                description: 'Why the handoff is happening',
              },
            },
            required: ['target_agent', 'reason'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'create_action',
          description: 'Create an action item or trigger an event',
          parameters: {
            type: 'object',
            properties: {
              action_type: {
                type: 'string',
                description: 'Type of action (e.g., book_appointment, send_quote, dispatch_tech)',
              },
              details: {
                type: 'object',
                description: 'Details of the action',
              },
            },
            required: ['action_type'],
          },
        },
      },
    ];

    // Call Lovable AI Gateway
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        tools,
        tool_choice: 'auto',
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again in a moment.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'AI credits exhausted. Please add credits to continue.' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const choice = aiResponse.choices?.[0];
    
    let responseText = choice?.message?.content || '';
    let handoffTo: string | null = null;
    let handoffReason: string | null = null;
    const toolCalls: Array<{ name: string; result: string }> = [];

    // Process tool calls
    if (choice?.message?.tool_calls) {
      for (const toolCall of choice.message.tool_calls) {
        const funcName = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments);
        
        if (funcName === 'handoff_to_agent') {
          handoffTo = args.target_agent;
          handoffReason = args.reason;
          toolCalls.push({
            name: 'handoff_to_agent',
            result: `Handing off to ${args.target_agent}: ${args.reason}`,
          });
        } else if (funcName === 'create_action') {
          toolCalls.push({
            name: args.action_type,
            result: JSON.stringify(args.details || {}),
          });
        }
      }
    }

    // Determine event type based on agent and context
    let eventType = `${agentType}_response`;
    if (handoffTo) {
      eventType = `${agentType}_handoff`;
    }

    // Log the interaction
    await supabase.from('ai_agent_logs').insert({
      company_id: companyId,
      agent_type: agentType,
      action: 'ai_chat',
      input_data: { message, conversation_length: conversationHistory.length },
      output_data: { 
        response: responseText, 
        handoff_to: handoffTo,
        tool_calls: toolCalls,
      },
      success: true,
    });

    // Create event if there was a handoff or action
    if (handoffTo || toolCalls.length > 0) {
      await supabase.from('ai_agent_events').insert({
        company_id: companyId,
        source_agent: agentType,
        target_agent: handoffTo,
        event_type: eventType,
        payload: { 
          message, 
          response: responseText, 
          tool_calls: toolCalls,
          handoff_reason: handoffReason,
        },
        status: 'processed',
        processed_at: new Date().toISOString(),
      });
    }

    return new Response(JSON.stringify({
      response: responseText,
      event_type: eventType,
      handoff_to: handoffTo,
      handoff_reason: handoffReason,
      tool_calls: toolCalls,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('[AI Agent Chat] Error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to process request' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
