import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const bodyText = await req.text();
    let payload: any;
    try {
      payload = JSON.parse(bodyText);
    } catch {
      console.error('Invalid JSON in post-call webhook:', bodyText.substring(0, 200));
      throw new Error('Invalid JSON body');
    }

    console.log('Post-call webhook received:', JSON.stringify(payload).substring(0, 500));

    const eventType = payload.type || payload.event_type || '';

    // Only process post_call_transcription events
    if (eventType !== 'post_call_transcription' && eventType !== '') {
      console.log(`Ignoring event type: ${eventType}`);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = payload.data || payload;
    const agentId = data.agent_id || payload.agent_id || '';
    const conversationId = data.conversation_id || payload.conversation_id || '';
    const transcript = data.transcript || [];
    const summary = data.call_summary || data.summary || '';
    const duration = data.call_duration_secs || data.duration || 0;
    const recordingUrl = data.recording_url || '';

    // Extract customer info from data_collection_results
    const collectionResults = data.data_collection_results || {};
    let customerName = '';
    let customerPhone = '';

    if (collectionResults.customer_name) {
      customerName = collectionResults.customer_name.value || '';
    }
    if (collectionResults.customer_phone || collectionResults.phone_number) {
      customerPhone = (collectionResults.customer_phone?.value || collectionResults.phone_number?.value || '');
    }

    // Map agent_id to company_id via tenant_integrations
    let companyId = '';
    if (agentId) {
      const { data: integration } = await supabase
        .from('tenant_integrations')
        .select('company_id')
        .eq('elevenlabs_agent_id', agentId)
        .maybeSingle();

      companyId = integration?.company_id || '';
    }

    if (!companyId) {
      console.error('Could not map agent_id to company:', agentId);
      return new Response(
        JSON.stringify({ error: 'Could not identify company' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert call log
    const { error: insertError } = await supabase.from('call_logs').insert({
      company_id: companyId,
      direction: 'inbound',
      status: 'completed',
      purpose: 'voice-chat',
      customer_name: customerName || null,
      customer_phone: customerPhone || null,
      duration_seconds: duration,
      recording_url: recordingUrl || null,
      summary: summary || null,
      transcript,
      metadata: {
        conversation_id: conversationId,
        agent_id: agentId,
        source: 'elevenlabs_web',
      },
    });

    if (insertError) {
      console.error('Failed to insert call log:', insertError);
      throw new Error('Failed to save call log');
    }

    console.log(`Post-call log saved for company ${companyId}, conversation ${conversationId}`);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Post-call webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
