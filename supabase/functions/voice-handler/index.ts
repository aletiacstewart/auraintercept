import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function normalizePhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('1') && digits.length === 11) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  if (phone.startsWith('+')) return phone;
  return `+${digits}`;
}

function twimlResponse(twiml: string): Response {
  const xml = `<?xml version="1.0" encoding="UTF-8"?><Response>${twiml}</Response>`;
  return new Response(xml, {
    headers: { ...corsHeaders, 'Content-Type': 'application/xml' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const url = new URL(req.url);
  const action = url.searchParams.get('action') || 'incoming';
  const callLogId = url.searchParams.get('callLogId') || '';

  console.log(`Voice handler: action=${action} callLogId=${callLogId}`);

  try {
    // Parse form data from SignalWire webhook
    let formParams: Record<string, string> = {};
    try {
      const formData = await req.formData();
      for (const [key, value] of formData.entries()) {
        formParams[key] = value as string;
      }
    } catch {
      // May be JSON or empty body for some actions
      try {
        const text = await req.text();
        if (text) formParams = JSON.parse(text);
      } catch { /* empty body is fine */ }
    }

    const callSid = formParams['CallSid'] || '';
    const callerNumber = formParams['From'] || '';
    const calledNumber = formParams['To'] || '';

    switch (action) {
      case 'incoming':
        return await handleIncoming(supabase, callerNumber, calledNumber);

      case 'outbound':
        return await handleOutbound(supabase, supabaseUrl, supabaseKey, callLogId);

      case 'outbound-response':
        return await handleOutboundResponse(supabase, callLogId, formParams);

      case 'process':
        return await handleProcess(supabase, supabaseUrl, supabaseKey, callLogId, formParams);

      case 'status':
        return await handleStatus(supabase, callLogId, callSid, formParams);

      case 'timeout':
        return handleTimeout(supabaseUrl, callLogId);

      default:
        console.log(`Unknown action: ${action}`);
        return twimlResponse('<Say voice="Polly.Joanna">Sorry, an error occurred.</Say><Hangup/>');
    }
  } catch (error) {
    console.error('Voice handler error:', error);
    return twimlResponse('<Say voice="Polly.Joanna">Sorry, we encountered an error. Goodbye.</Say><Hangup/>');
  }
});

// === INCOMING CALL ===
async function handleIncoming(
  supabase: any, callerNumber: string, calledNumber: string
): Promise<Response> {
  const normalizedCalled = normalizePhoneNumber(calledNumber);
  const normalizedCaller = normalizePhoneNumber(callerNumber);

  // Look up company by phone number
  const { data: integration } = await supabase
    .from('tenant_integrations')
    .select('company_id, elevenlabs_api_key, elevenlabs_voice_id')
    .eq('signalwire_phone_number', normalizedCalled)
    .maybeSingle();

  if (!integration) {
    console.log('No company found for number:', normalizedCalled);
    return twimlResponse('<Say voice="Polly.Joanna">Sorry, this number is not configured. Goodbye.</Say><Hangup/>');
  }

  const { company_id } = integration;

  // Get company info
  const { data: company } = await supabase
    .from('companies')
    .select('name, ai_voice_greeting')
    .eq('id', company_id)
    .single();

  const greeting = company?.ai_voice_greeting ||
    `Thank you for calling ${company?.name || 'us'}. How can I help you today?`;

  // Log inbound call
  await supabase.from('call_logs').insert({
    company_id,
    customer_phone: normalizedCaller,
    from_number: normalizedCaller,
    to_number: normalizedCalled,
    direction: 'inbound',
    status: 'in-progress',
    purpose: 'inbound',
  });

  // Use Polly for greeting (reliable fallback), then gather speech
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const gatherUrl = `${supabaseUrl}/functions/v1/voice-handler?action=process&callLogId=incoming_${company_id}`;
  const timeoutUrl = `${supabaseUrl}/functions/v1/voice-handler?action=timeout&callLogId=incoming_${company_id}`;

  return twimlResponse(`
    <Gather input="speech" timeout="5" speechTimeout="auto" action="${gatherUrl}" method="POST">
      <Say voice="Polly.Joanna">${escapeXml(greeting)}</Say>
    </Gather>
    <Redirect method="POST">${timeoutUrl}</Redirect>
  `);
}

// === OUTBOUND CALL (webhook from SignalWire when call connects) ===
async function handleOutbound(
  supabase: any, supabaseUrl: string, supabaseKey: string, callLogId: string
): Promise<Response> {
  if (!callLogId) {
    return twimlResponse('<Say voice="Polly.Joanna">Sorry, call configuration error. Goodbye.</Say><Hangup/>');
  }

  // Fetch call context from database
  const { data: callLog, error } = await supabase
    .from('call_logs')
    .select('company_id, customer_name, customer_phone, purpose, metadata')
    .eq('id', callLogId)
    .single();

  if (error || !callLog) {
    console.error('Could not find call log:', callLogId, error);
    return twimlResponse('<Say voice="Polly.Joanna">Sorry, call configuration error. Goodbye.</Say><Hangup/>');
  }

  const callMessage = callLog.metadata?.call_message || `Hello ${callLog.customer_name}, thank you for your time.`;
  const audioUrl = callLog.metadata?.audio_url || '';
  const purpose = callLog.purpose || 'custom';

  console.log(`Outbound call connected. Purpose: ${purpose}, Message length: ${callMessage.length}, hasPreGenAudio: ${!!audioUrl}`);

  const responseUrl = `${supabaseUrl}/functions/v1/voice-handler?action=outbound-response&callLogId=${callLogId}`;

  if (audioUrl) {
    // Use pre-generated audio — instant response, no TTS delay
    return twimlResponse(`
      <Gather input="dtmf" numDigits="1" timeout="15" action="${responseUrl}" method="POST">
        <Play>${audioUrl}</Play>
      </Gather>
      <Say voice="Polly.Joanna">We didn't hear a response. Goodbye.</Say>
      <Hangup/>
    `);
  }

  // No pre-generated audio — use Polly directly (skip TTS to avoid delay)
  return twimlResponse(`
    <Gather input="dtmf" numDigits="1" timeout="15" action="${responseUrl}" method="POST">
      <Say voice="Polly.Joanna">${escapeXml(callMessage)}</Say>
    </Gather>
    <Say voice="Polly.Joanna">We didn't hear a response. Goodbye.</Say>
    <Hangup/>
  `);
}

// === OUTBOUND RESPONSE (DTMF/speech after outbound message) ===
async function handleOutboundResponse(
  supabase: any, callLogId: string, formParams: Record<string, string>
): Promise<Response> {
  const digits = formParams['Digits'] || '';
  const speechResult = formParams['SpeechResult'] || '';

  console.log(`Outbound response: digits=${digits} speech="${speechResult}" callLogId=${callLogId}`);

  let responseMessage = 'Thank you for your response. Goodbye.';

  if (digits === '1' || speechResult.toLowerCase().includes('confirm') || speechResult.toLowerCase().includes('yes')) {
    responseMessage = 'Great, your appointment is confirmed. Thank you and goodbye.';

    // Update appointment if linked
    if (callLogId) {
      const { data: callLog } = await supabase
        .from('call_logs')
        .select('metadata')
        .eq('id', callLogId)
        .single();

      if (callLog?.metadata?.appointment_id) {
        await supabase
          .from('appointments')
          .update({ status: 'confirmed' })
          .eq('id', callLog.metadata.appointment_id);
      }
    }
  } else if (digits === '2' || speechResult.toLowerCase().includes('callback') || speechResult.toLowerCase().includes('manager')) {
    responseMessage = 'We\'ll have someone call you back shortly. Thank you and goodbye.';
  }

  // Update call log
  if (callLogId) {
    await supabase.from('call_logs').update({
      metadata: { response: digits || speechResult },
      summary: responseMessage,
    }).eq('id', callLogId);
  }

  return twimlResponse(`<Say voice="Polly.Joanna">${escapeXml(responseMessage)}</Say><Hangup/>`);
}

// === PROCESS SPEECH (inbound call speech processing) ===
async function handleProcess(
  supabase: any, supabaseUrl: string, supabaseKey: string,
  callLogId: string, formParams: Record<string, string>
): Promise<Response> {
  const speechResult = formParams['SpeechResult'] || '';
  console.log(`Processing speech: "${speechResult}" callLogId=${callLogId}`);

  if (!speechResult) {
    return twimlResponse(`
      <Say voice="Polly.Joanna">I didn't catch that. Could you please repeat?</Say>
      <Gather input="speech" timeout="5" speechTimeout="auto" action="${supabaseUrl}/functions/v1/voice-handler?action=process&callLogId=${callLogId}" method="POST">
      </Gather>
      <Redirect method="POST">${supabaseUrl}/functions/v1/voice-handler?action=timeout&callLogId=${callLogId}</Redirect>
    `);
  }

  // Extract company_id from callLogId format "incoming_<companyId>"
  const companyId = callLogId.startsWith('incoming_') ? callLogId.replace('incoming_', '') : '';

  if (!companyId) {
    return twimlResponse('<Say voice="Polly.Joanna">Thank you for calling. Goodbye.</Say><Hangup/>');
  }

  // Get company AI prompt
  const { data: company } = await supabase
    .from('companies')
    .select('name, ai_agent_prompt, brand_tone')
    .eq('id', companyId)
    .single();

  // Generate AI response
  const systemPrompt = company?.ai_agent_prompt ||
    `You are a helpful phone assistant for ${company?.name || 'our company'}. Keep responses brief and conversational. Do not use any formatting.`;

  try {
    const aiResponse = await fetch(`${supabaseUrl}/functions/v1/ai-agent-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        message: speechResult,
        systemPrompt,
        model: 'google/gemini-2.5-flash',
      }),
    });

    const aiText = await aiResponse.text();
    let reply = 'Thank you for your message. Someone will get back to you shortly.';
    try {
      const aiData = JSON.parse(aiText);
      reply = aiData.reply || aiData.response || aiData.message || reply;
    } catch {
      if (aiText && aiText.length < 500) reply = aiText;
    }

    // Continue conversation
    const gatherUrl = `${supabaseUrl}/functions/v1/voice-handler?action=process&callLogId=${callLogId}`;
    const timeoutUrl = `${supabaseUrl}/functions/v1/voice-handler?action=timeout&callLogId=${callLogId}`;

    return twimlResponse(`
      <Gather input="speech" timeout="5" speechTimeout="auto" action="${gatherUrl}" method="POST">
        <Say voice="Polly.Joanna">${escapeXml(reply)}</Say>
      </Gather>
      <Redirect method="POST">${timeoutUrl}</Redirect>
    `);
  } catch (aiError) {
    console.error('AI response failed:', aiError);
    return twimlResponse('<Say voice="Polly.Joanna">Thank you for calling. Someone will follow up with you. Goodbye.</Say><Hangup/>');
  }
}

// === STATUS CALLBACK ===
async function handleStatus(
  supabase: any, callLogId: string, callSid: string,
  formParams: Record<string, string>
): Promise<Response> {
  const callStatus = formParams['CallStatus'] || '';
  const duration = formParams['CallDuration'] || formParams['Duration'] || '';

  console.log(`Status callback: callLogId=${callLogId} status=${callStatus} duration=${duration}`);

  if (callLogId) {
    const updates: any = { status: callStatus };
    if (duration) updates.duration_seconds = parseInt(duration, 10);
    if (callSid) updates.call_sid = callSid;
    if (callStatus === 'completed' || callStatus === 'failed' || callStatus === 'no-answer' || callStatus === 'busy') {
      updates.ended_at = new Date().toISOString();
    }
    if (callStatus === 'in-progress') {
      updates.answered_at = new Date().toISOString();
    }

    await supabase.from('call_logs').update(updates).eq('id', callLogId);
  }

  return new Response('OK', { headers: corsHeaders });
}

// === TIMEOUT ===
function handleTimeout(supabaseUrl: string, callLogId: string): Response {
  return twimlResponse(`
    <Say voice="Polly.Joanna">I didn't hear anything. If you need assistance, please call back. Goodbye.</Say>
    <Hangup/>
  `);
}

// === TTS HELPER ===
async function generateTTSAudio(
  supabase: any, supabaseUrl: string, companyId: string, text: string
): Promise<string> {
  // Fetch ElevenLabs credentials
  const { data: integration } = await supabase
    .from('tenant_integrations')
    .select('elevenlabs_api_key, elevenlabs_voice_id')
    .eq('company_id', companyId)
    .maybeSingle();

  if (!integration?.elevenlabs_api_key) {
    throw new Error('No ElevenLabs API key configured');
  }

  const voiceId = integration.elevenlabs_voice_id || 'cgSgspJ2msm6clMCkdW9'; // Jessica default

  const ttsResponse = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': integration.elevenlabs_api_key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    }
  );

  if (!ttsResponse.ok) {
    const errorText = await ttsResponse.text();
    throw new Error(`ElevenLabs TTS error: ${ttsResponse.status} - ${errorText}`);
  }

  const audioBuffer = await ttsResponse.arrayBuffer();
  const fileName = `call_${Date.now()}_${Math.random().toString(36).substring(7)}.mp3`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('voice-audio')
    .upload(fileName, audioBuffer, { contentType: 'audio/mpeg', upsert: false });

  if (uploadError) {
    throw new Error(`Storage upload error: ${uploadError.message}`);
  }

  // Get public URL
  const { data: publicUrl } = supabase.storage.from('voice-audio').getPublicUrl(fileName);

  // Schedule cleanup (delete after 1 hour via metadata)
  console.log(`TTS audio uploaded: ${publicUrl.publicUrl}`);

  return publicUrl.publicUrl;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
