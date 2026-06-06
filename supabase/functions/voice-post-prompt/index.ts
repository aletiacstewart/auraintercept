import { createClient } from "npm:@supabase/supabase-js@2"; // voice-post-prompt
import { verifySignalWireRequest, recordSignatureFailure } from "../_shared/signalwire-signature.ts";

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

  const verify = await verifySignalWireRequest(req);
  if (!verify.ok) {
    await recordSignatureFailure(verify.reason || 'unknown', { fn: 'voice-post-prompt' });
    return new Response('Forbidden', { status: 403, headers: corsHeaders });
  }

  let body: any = {};
  try {
    if (verify.rawBody) body = JSON.parse(verify.rawBody);
  } catch (err) {
    console.error('Failed to parse post-prompt body:', err);
    return new Response(JSON.stringify({ response: "ok" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  console.log(`Post-prompt received: action=${body.action || 'unknown'}`);

  const metaData = body.SWMLVars?.meta_data || body.meta_data || {};
  const callLogId = metaData.call_log_id || '';
  const postPromptData = body.post_prompt_data || {};
  const summary = postPromptData.output || postPromptData.raw || body.post_prompt_response?.output || '';
  const aiEndDate = body.ai_end_date || null;
  const totalInputTokens = body.total_input_tokens || 0;
  const totalOutputTokens = body.total_output_tokens || 0;
  const callId = body.call_id || '';

  console.log(`Post-prompt: callLogId=${callLogId} summary length=${summary.length} tokens=${totalInputTokens}/${totalOutputTokens}`);

  if (callLogId) {
    try {
      const updates: any = {
        status: 'completed',
        ended_at: new Date().toISOString(),
      };

      if (summary) {
        updates.summary = typeof summary === 'string' ? summary : JSON.stringify(summary);
      }

      // Store transcript and token usage in metadata
      const { data: existingLog } = await supabase
        .from('call_logs')
        .select('metadata')
        .eq('id', callLogId)
        .single();

      const existingMetadata = existingLog?.metadata || {};
      updates.metadata = {
        ...existingMetadata,
        post_prompt_summary: summary,
        total_input_tokens: totalInputTokens,
        total_output_tokens: totalOutputTokens,
        signalwire_call_id: callId,
        ai_end_date: aiEndDate,
      };

      if (body.call_start_date) {
        // Calculate duration from timestamps
        const startMs = typeof body.call_start_date === 'number'
          ? body.call_start_date / 1000  // microseconds to ms
          : 0;
        const endMs = typeof aiEndDate === 'number'
          ? aiEndDate / 1000
          : Date.now();

        if (startMs > 0) {
          updates.duration_seconds = Math.round((endMs - startMs) / 1000);
        }
      }

      await supabase.from('call_logs').update(updates).eq('id', callLogId);
      console.log(`Post-prompt: updated call log ${callLogId}`);
    } catch (err) {
      console.error('Failed to update call log from post-prompt:', err);
    }
  } else {
    console.warn('Post-prompt received without call_log_id in meta_data');
  }

  // SignalWire expects a JSON response
  return new Response(JSON.stringify({ response: "ok" }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
