import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ElevenLabsPostCallPayload {
  conversation_id: string;
  agent_id: string;
  status: string;
  transcript?: Array<{
    role: string;
    message: string;
    time_in_call_secs?: number;
  }>;
  metadata?: {
    start_time_unix_secs?: number;
    end_time_unix_secs?: number;
    call_duration_secs?: number;
    cost?: number;
    feedback?: {
      overall_rating?: number;
      likes?: string[];
      dislikes?: string[];
    };
  };
  analysis?: {
    evaluation_criteria_results?: Record<string, {
      criteria_id: string;
      result: string;
      rationale: string;
    }>;
    data_collection_results?: Record<string, {
      data_collection_id: string;
      value: string;
      rationale: string;
    }>;
    call_successful?: string;
    transcript_summary?: string;
  };
  recording_url?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: ElevenLabsPostCallPayload = await req.json();
    console.log('ElevenLabs post-call webhook received:', JSON.stringify(payload, null, 2));

    const { conversation_id, agent_id, transcript, metadata, analysis, recording_url, status } = payload;

    if (!agent_id) {
      console.error('Missing agent_id in payload');
      return new Response(
        JSON.stringify({ success: false, error: 'Missing agent_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Look up company_id from tenant_integrations using agent_id
    const { data: integration, error: integrationError } = await supabase
      .from('tenant_integrations')
      .select('company_id')
      .eq('elevenlabs_agent_id', agent_id)
      .single();

    if (integrationError || !integration) {
      console.error('Could not find company for agent_id:', agent_id, integrationError);
      // Still return success to ElevenLabs to prevent retries
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Company not found for agent_id',
          agent_id 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const companyId = integration.company_id;

    // Calculate duration from metadata
    const durationSeconds = metadata?.call_duration_secs || 
      (metadata?.start_time_unix_secs && metadata?.end_time_unix_secs 
        ? metadata.end_time_unix_secs - metadata.start_time_unix_secs 
        : null);

    // Extract customer info from data collection if available
    const dataCollection = analysis?.data_collection_results || {};
    const customerName = dataCollection.customer_name?.value || 
                         dataCollection.name?.value || 
                         null;
    const customerPhone = dataCollection.customer_phone?.value || 
                          dataCollection.phone?.value || 
                          null;

    // Build the call log entry
    const callLogEntry = {
      company_id: companyId,
      direction: 'inbound' as const,
      status: status === 'done' ? 'completed' : status || 'completed',
      purpose: 'voice_booking_agent',
      started_at: metadata?.start_time_unix_secs 
        ? new Date(metadata.start_time_unix_secs * 1000).toISOString()
        : new Date().toISOString(),
      ended_at: metadata?.end_time_unix_secs
        ? new Date(metadata.end_time_unix_secs * 1000).toISOString()
        : null,
      duration_seconds: durationSeconds,
      customer_name: customerName,
      customer_phone: customerPhone,
      summary: analysis?.transcript_summary || null,
      transcript: transcript || null,
      recording_url: recording_url || null,
      call_sid: conversation_id, // Use conversation_id as unique identifier
      metadata: {
        elevenlabs_conversation_id: conversation_id,
        elevenlabs_agent_id: agent_id,
        call_successful: analysis?.call_successful,
        evaluation_criteria: analysis?.evaluation_criteria_results,
        data_collection: analysis?.data_collection_results,
        cost: metadata?.cost,
        feedback: metadata?.feedback
      }
    };

    // Insert into call_logs
    const { data: callLog, error: insertError } = await supabase
      .from('call_logs')
      .insert(callLogEntry)
      .select()
      .single();

    if (insertError) {
      console.error('Failed to insert call log:', insertError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to log call', details: insertError.message }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Call log created successfully:', callLog.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        call_log_id: callLog.id,
        company_id: companyId
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error processing ElevenLabs post-call webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
