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

// Helper: generate ElevenLabs TTS audio URL, or return null on failure
async function ttsAudioUrl(
  supabase: any, companyId: string, text: string,
  apiKey: string, voiceId: string
): Promise<string | null> {
  try {
    const audioUrl = await generateTTSAudio(supabase, apiKey, voiceId, text);
    return audioUrl;
  } catch (err) {
    console.error('ElevenLabs TTS failed, falling back to Polly:', err);
    return null;
  }
}

// Build TwiML: <Play> before <Gather> with a minimal <Say> inside, then <Redirect> for timeout
function buildPlayThenGather(
  audioUrl: string | null, fallbackText: string,
  gatherUrl: string, timeoutUrl: string
): string {
  const playPart = audioUrl
    ? `<Play>${escapeXmlUrl(audioUrl)}</Play>`
    : '';
  const gatherContent = audioUrl
    ? '<Say voice="Polly.Joanna"> </Say>'
    : `<Say voice="Polly.Joanna">${escapeXml(fallbackText)}</Say>`;

  return `
    ${playPart}
    <Gather input="speech" timeout="12" speechTimeout="5" action="${escapeXmlUrl(gatherUrl)}" method="POST">
      ${gatherContent}
    </Gather>
    <Redirect method="POST">${escapeXmlUrl(timeoutUrl)}</Redirect>
  `;
}

// Build the phone-specific system prompt with sequential collection rules
function buildPhoneSystemPrompt(companyName: string, agentPrompt: string | null, conversationHistory: Array<{role: string; content: string}>): string {
  const base = agentPrompt || `You are a helpful phone assistant for ${companyName}.`;

  const phoneRules = `

CRITICAL PHONE CALL RULES (override any conflicting instructions):
- You are speaking on a PHONE CALL. The caller HEARS your words spoken aloud.
- Keep EVERY response to 1-2 short sentences maximum.
- Do NOT use any formatting, markdown, bullet points, asterisks, dashes, or special characters.
- Do NOT list multiple items. Speak naturally as if talking to someone.
- Ask for ONE piece of information at a time. WAIT for the caller to answer before asking the next question.
- NEVER ask for name, phone, AND email in the same response.
- Follow this exact sequence when collecting information:
  1. First, greet and ask what service they need.
  2. Then ask for their NAME only.
  3. Then ask for their PHONE NUMBER only.
  4. Then ask for their EMAIL ADDRESS only.
  5. Then ask for their ADDRESS or preferred appointment time.
  6. Finally, confirm all details back to them.
- If the caller already provided some info (e.g. their name), skip that step and move to the next.
- Be warm, friendly, and conversational. Use the caller's name once you know it.`;

  let prompt = base + phoneRules;

  // Append conversation history so the AI has full context
  if (conversationHistory.length > 0) {
    prompt += '\n\nCONVERSATION SO FAR:\n';
    for (const msg of conversationHistory) {
      prompt += `${msg.role === 'user' ? 'CALLER' : 'YOU'}: ${msg.content}\n`;
    }
    prompt += '\nContinue the conversation naturally. Ask for the NEXT piece of missing information.';
  }

  return prompt;
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
        return await handleIncoming(supabase, supabaseUrl, callerNumber, calledNumber);

      case 'outbound':
        return await handleOutbound(supabase, supabaseUrl, supabaseKey, callLogId);

      case 'outbound-response':
        return await handleOutboundResponse(supabase, callLogId, formParams);

      case 'process':
        return await handleProcess(supabase, supabaseUrl, supabaseKey, callLogId, formParams);

      case 'status':
        return await handleStatus(supabase, callLogId, callSid, formParams);

      case 'timeout':
        return await handleTimeout(supabase, supabaseUrl, callLogId);

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
  supabase: any, supabaseUrl: string, callerNumber: string, calledNumber: string
): Promise<Response> {
  const normalizedCalled = normalizePhoneNumber(calledNumber);
  const normalizedCaller = normalizePhoneNumber(callerNumber);

  // Look up company by phone number + fetch ElevenLabs credentials
  const { data: integration } = await supabase
    .from('tenant_integrations')
    .select('company_id, elevenlabs_api_key, elevenlabs_voice_id')
    .eq('signalwire_phone_number', normalizedCalled)
    .maybeSingle();

  if (!integration) {
    console.log('No company found for number:', normalizedCalled);
    return twimlResponse('<Say voice="Polly.Joanna">Sorry, this number is not configured. Goodbye.</Say><Hangup/>');
  }

  const { company_id, elevenlabs_api_key, elevenlabs_voice_id } = integration;

  // Get company info
  const { data: company } = await supabase
    .from('companies')
    .select('name, ai_voice_greeting, ai_agent_prompt')
    .eq('id', company_id)
    .single();

  const defaultGreeting = `Thank you for calling ${company?.name || 'us'}. How can I help you today?`;
  let greeting = company?.ai_voice_greeting || defaultGreeting;
  // Safeguard: prevent long monologue greetings that block turn-taking
  if (greeting.length > 150) {
    console.warn(`Greeting too long (${greeting.length} chars), using default`);
    greeting = defaultGreeting;
  }

  // Log inbound call with conversation state in metadata
  const { data: callLog } = await supabase.from('call_logs').insert({
    company_id,
    customer_phone: normalizedCaller,
    from_number: normalizedCaller,
    to_number: normalizedCalled,
    direction: 'inbound',
    status: 'in-progress',
    purpose: 'inbound',
    metadata: {
      conversation_history: [],
      collected_info: {},
    },
  }).select('id').single();

  const logId = callLog?.id || `incoming_${company_id}`;

  // Generate greeting with ElevenLabs Jessica (fall back to Polly)
  const voiceId = elevenlabs_voice_id || 'cgSgspJ2msm6clMCkdW9';
  const audioUrl = elevenlabs_api_key
    ? await ttsAudioUrl(supabase, company_id, greeting, elevenlabs_api_key, voiceId)
    : null;

  const gatherUrl = `${supabaseUrl}/functions/v1/voice-handler?action=process&callLogId=${logId}`;
  const timeoutUrl = `${supabaseUrl}/functions/v1/voice-handler?action=timeout&callLogId=${logId}`;

  return twimlResponse(buildPlayThenGather(audioUrl, greeting, gatherUrl, timeoutUrl));
}

// === OUTBOUND CALL (webhook from SignalWire when call connects) ===
async function handleOutbound(
  supabase: any, supabaseUrl: string, supabaseKey: string, callLogId: string
): Promise<Response> {
  if (!callLogId) {
    return twimlResponse('<Say voice="Polly.Joanna">Sorry, call configuration error. Goodbye.</Say><Hangup/>');
  }

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
    return twimlResponse(`
      <Gather input="dtmf" numDigits="1" timeout="15" action="${escapeXmlUrl(responseUrl)}" method="POST">
        <Play>${escapeXmlUrl(audioUrl)}</Play>
      </Gather>
      <Say voice="Polly.Joanna">We didn't hear a response. Goodbye.</Say>
      <Hangup/>
    `);
  }

  return twimlResponse(`
      <Gather input="dtmf" numDigits="1" timeout="15" action="${escapeXmlUrl(responseUrl)}" method="POST">
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

  if (callLogId) {
    await supabase.from('call_logs').update({
      metadata: { response: digits || speechResult },
      summary: responseMessage,
    }).eq('id', callLogId);
  }

  return twimlResponse(`<Say voice="Polly.Joanna">${escapeXml(responseMessage)}</Say><Hangup/>`);
}

// === PROCESS SPEECH (inbound call speech processing with state) ===
async function handleProcess(
  supabase: any, supabaseUrl: string, supabaseKey: string,
  callLogId: string, formParams: Record<string, string>
): Promise<Response> {
  const speechResult = formParams['SpeechResult'] || '';
  console.log(`Processing speech: "${speechResult}" callLogId=${callLogId}`);

  // Determine companyId and load conversation state
  let companyId = '';
  let conversationHistory: Array<{role: string; content: string}> = [];
  let collectedInfo: Record<string, string> = {};
  let elevenlabsApiKey = '';
  let elevenlabsVoiceId = '';

  // Try to load from call_logs (new flow with real callLogId)
  if (callLogId && !callLogId.startsWith('incoming_')) {
    const { data: callLog } = await supabase
      .from('call_logs')
      .select('company_id, metadata')
      .eq('id', callLogId)
      .single();

    if (callLog) {
      companyId = callLog.company_id;
      conversationHistory = callLog.metadata?.conversation_history || [];
      collectedInfo = callLog.metadata?.collected_info || {};
    }
  } else if (callLogId.startsWith('incoming_')) {
    // Legacy format fallback
    companyId = callLogId.replace('incoming_', '');
  }

  if (!companyId) {
    return twimlResponse('<Say voice="Polly.Joanna">Thank you for calling. Goodbye.</Say><Hangup/>');
  }

  // Fetch ElevenLabs credentials + company info in parallel
  const [integrationResult, companyResult] = await Promise.all([
    supabase
      .from('tenant_integrations')
      .select('elevenlabs_api_key, elevenlabs_voice_id')
      .eq('company_id', companyId)
      .maybeSingle(),
    supabase
      .from('companies')
      .select('name, ai_agent_prompt, brand_tone')
      .eq('id', companyId)
      .single(),
  ]);

  const integration = integrationResult.data;
  const company = companyResult.data;

  elevenlabsApiKey = integration?.elevenlabs_api_key || '';
  elevenlabsVoiceId = integration?.elevenlabs_voice_id || 'cgSgspJ2msm6clMCkdW9';

  if (!speechResult) {
    const nudge = "I'm still here. Take your time, what can I help you with?";
    const nudgeAudioUrl = elevenlabsApiKey
      ? await ttsAudioUrl(supabase, companyId, nudge, elevenlabsApiKey, elevenlabsVoiceId)
      : null;

    const nudgeGatherUrl = `${supabaseUrl}/functions/v1/voice-handler?action=process&callLogId=${callLogId}`;
    const nudgeTimeoutUrl = `${supabaseUrl}/functions/v1/voice-handler?action=timeout&callLogId=${callLogId}`;

    return twimlResponse(buildPlayThenGather(nudgeAudioUrl, nudge, nudgeGatherUrl, nudgeTimeoutUrl));
  }

  // Add user message to conversation history
  conversationHistory.push({ role: 'user', content: speechResult });

  // Build the enhanced phone system prompt with history
  const systemPrompt = buildPhoneSystemPrompt(
    company?.name || 'our company',
    company?.ai_agent_prompt || null,
    conversationHistory
  );

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

    // Clean any markdown/formatting from the reply
    reply = reply.replace(/[*_#`~\[\]]/g, '').replace(/\n/g, ' ').trim();

    // Add assistant response to conversation history
    conversationHistory.push({ role: 'assistant', content: reply });

    // Save updated conversation state back to call_logs
    if (callLogId && !callLogId.startsWith('incoming_')) {
      await supabase.from('call_logs').update({
        metadata: {
          conversation_history: conversationHistory,
          collected_info: collectedInfo,
        },
      }).eq('id', callLogId);
    }

    // Generate TTS response with ElevenLabs Jessica
    const replyAudioUrl = elevenlabsApiKey
      ? await ttsAudioUrl(supabase, companyId, reply, elevenlabsApiKey, elevenlabsVoiceId)
      : null;

    const gatherUrl = `${supabaseUrl}/functions/v1/voice-handler?action=process&callLogId=${callLogId}`;
    const timeoutUrl = `${supabaseUrl}/functions/v1/voice-handler?action=timeout&callLogId=${callLogId}`;

    return twimlResponse(buildPlayThenGather(replyAudioUrl, reply, gatherUrl, timeoutUrl));
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
async function handleTimeout(supabase: any, supabaseUrl: string, callLogId: string): Promise<Response> {
  const timeoutMsg = "I didn't hear anything. If you need assistance, please call back. Goodbye.";

  // Try to get ElevenLabs credentials for TTS
  let companyId = '';
  if (callLogId && !callLogId.startsWith('incoming_')) {
    const { data: callLog } = await supabase
      .from('call_logs')
      .select('company_id')
      .eq('id', callLogId)
      .single();
    if (callLog) companyId = callLog.company_id;
  } else if (callLogId.startsWith('incoming_')) {
    companyId = callLogId.replace('incoming_', '');
  }

  if (companyId) {
    const { data: integration } = await supabase
      .from('tenant_integrations')
      .select('elevenlabs_api_key, elevenlabs_voice_id')
      .eq('company_id', companyId)
      .maybeSingle();

    if (integration?.elevenlabs_api_key) {
      const voiceId = integration.elevenlabs_voice_id || 'cgSgspJ2msm6clMCkdW9';
      const audioUrl = await ttsAudioUrl(supabase, companyId, timeoutMsg, integration.elevenlabs_api_key, voiceId);
      if (audioUrl) {
        return twimlResponse(`<Play>${escapeXmlUrl(audioUrl)}</Play><Hangup/>`);
      }
    }
  }

  return twimlResponse(`<Say voice="Polly.Joanna">${escapeXml(timeoutMsg)}</Say><Hangup/>`);
}

// === TTS HELPER ===
async function generateTTSAudio(
  supabase: any, apiKey: string, voiceId: string, text: string
): Promise<string> {
  const ttsResponse = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.5, use_speaker_boost: true },
      }),
    }
  );

  if (!ttsResponse.ok) {
    const errorText = await ttsResponse.text();
    throw new Error(`ElevenLabs TTS error: ${ttsResponse.status} - ${errorText}`);
  }

  const audioBuffer = await ttsResponse.arrayBuffer();
  const fileName = `call_${Date.now()}_${Math.random().toString(36).substring(7)}.mp3`;

  const { error: uploadError } = await supabase.storage
    .from('voice-audio')
    .upload(fileName, audioBuffer, { contentType: 'audio/mpeg', upsert: false });

  if (uploadError) {
    throw new Error(`Storage upload error: ${uploadError.message}`);
  }

  const { data: publicUrl } = supabase.storage.from('voice-audio').getPublicUrl(fileName);
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

function escapeXmlUrl(url: string): string {
  return url.replace(/&/g, '&amp;');
}