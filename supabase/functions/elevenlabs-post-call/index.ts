import { createClient } from "npm:@supabase/supabase-js@2";
import { extractContact, insertReceptionistLead } from "../_shared/insert-landing-lead.ts";

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
    let customerEmail = '';
    let serviceAddress = '';
    let intentRaw = '';

    if (collectionResults.customer_name) {
      customerName = collectionResults.customer_name.value || '';
    }
    if (collectionResults.customer_phone || collectionResults.phone_number) {
      customerPhone = (collectionResults.customer_phone?.value || collectionResults.phone_number?.value || '');
    }
    if (collectionResults.customer_email || collectionResults.email) {
      customerEmail = (collectionResults.customer_email?.value || collectionResults.email?.value || '');
    }
    if (collectionResults.service_address || collectionResults.address) {
      serviceAddress = (collectionResults.service_address?.value || collectionResults.address?.value || '');
    }
    if (collectionResults.intent || collectionResults.call_intent) {
      intentRaw = (collectionResults.intent?.value || collectionResults.call_intent?.value || '');
    }

    // Build a normalized intake_answers map from every data_collection_results entry.
    // ElevenLabs returns each as { value, rationale, json_schema, ... } — keep the value.
    const intakeAnswers: Record<string, string> = {};
    for (const [k, v] of Object.entries(collectionResults)) {
      const value =
        v && typeof v === 'object' && 'value' in (v as any)
          ? (v as any).value
          : v;
      if (value !== null && value !== undefined && value !== '') {
        intakeAnswers[k] = typeof value === 'string' ? value : JSON.stringify(value);
      }
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
    const { data: insertedCall, error: insertError } = await supabase.from('call_logs').insert({
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
        intake_answers: intakeAnswers,
        intent: intentRaw || null,
        service_address: serviceAddress || null,
        customer_email: customerEmail || null,
      },
    }).select('id').maybeSingle();

    if (insertError) {
      console.error('Failed to insert call log:', insertError);
      throw new Error('Failed to save call log');
    }

    console.log(`Post-call log saved for company ${companyId}, conversation ${conversationId}`);

    // If the caller provided enough info to be useful, create/refresh a lead.
    // We only insert when we have at least a name or phone — anything less is noise.
    if (customerName || customerPhone) {
      const leadPayload: Record<string, unknown> = {
        company_id: companyId,
        name: customerName || 'Unknown caller',
        phone: customerPhone || null,
        email: customerEmail || null,
        source: 'ai_receptionist',
        status: 'new',
        notes: summary || null,
        metadata: {
          call_log_id: insertedCall?.id || null,
          conversation_id: conversationId,
          intake_answers: intakeAnswers,
          intent: intentRaw || null,
          service_address: serviceAddress || null,
        },
      };
      const { error: leadErr } = await supabase.from('leads').insert(leadPayload);
      if (leadErr) {
        console.error('Failed to insert lead from receptionist call:', leadErr);
      }
    }

    // Safety net for every company's voice receptionist: if ElevenLabs did
    // not return structured contact info, scan the transcript for an email
    // or phone and still save the caller as a lead under that company.
    if (!customerPhone && !customerEmail) {
      try {
        const transcriptText = Array.isArray(transcript)
          ? transcript
              .filter((t: any) => t?.role === 'user' || t?.speaker === 'user')
              .map((t: any) => t?.message || t?.text || '')
              .join('\n')
          : '';
        const { email: scannedEmail, phone: scannedPhone } = extractContact(transcriptText);
        if (scannedEmail || scannedPhone) {
          await insertReceptionistLead({
            company_id: companyId,
            name: customerName || 'Voice visitor',
            email: scannedEmail ?? null,
            phone: scannedPhone ?? null,
            source: 'voice_post_call',
            notes: summary || transcriptText.slice(-1500),
            metadata: {
              call_log_id: insertedCall?.id || null,
              conversation_id: conversationId,
              agent_id: agentId,
            },
          });
        }
      } catch (e) {
        console.error('[elevenlabs-post-call] voice safety-net failed:', e);
      }
    }

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
