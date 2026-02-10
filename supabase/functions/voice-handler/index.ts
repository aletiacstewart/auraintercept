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

      case 'dial-status':
        return await handleDialStatus(supabase, supabaseUrl, supabaseKey, callLogId, callerNumber, formParams);

      case 'outbound':
        return await handleOutbound(supabase, supabaseUrl, supabaseKey, callLogId);

      case 'outbound-response':
        return await handleOutboundResponse(supabase, callLogId, formParams);

      case 'process':
        return await handleProcess(supabase, supabaseUrl, supabaseKey, callLogId, formParams);

      case 'pickup':
        return await handlePickup(supabase, supabaseUrl, supabaseKey, callLogId);

      case 'process-background':
        return await handleProcessBackground(supabase, supabaseUrl, supabaseKey, callLogId, formParams);

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

  // Get company info including call routing settings
  const { data: company } = await supabase
    .from('companies')
    .select('name, ai_voice_greeting, ai_agent_prompt, call_routing_mode, business_phone, ring_timeout_seconds')
    .eq('id', company_id)
    .single();

  // Log inbound call
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

  // === RING FIRST MODE ===
  // If company has ring_first mode and a business phone, ring the owner first
  const routingMode = company?.call_routing_mode || 'ai_direct';
  const businessPhone = company?.business_phone;
  const ringTimeout = company?.ring_timeout_seconds || 15;

  if (routingMode === 'ring_first' && businessPhone) {
    const normalizedBusiness = normalizePhoneNumber(businessPhone);
    console.log(`Ring-first mode: ringing ${normalizedBusiness} for ${ringTimeout}s before AI takeover`);

    const dialStatusUrl = `${supabaseUrl}/functions/v1/voice-handler?action=dial-status&amp;callLogId=${logId}`;

    return twimlResponse(`
      <Dial timeout="${ringTimeout}" callerId="${escapeXml(normalizedCaller)}"
            action="${dialStatusUrl}" method="POST">
        <Number>${escapeXml(normalizedBusiness)}</Number>
      </Dial>
    `);
  }

  // === AI DIRECT MODE (default) ===
  return await startAIGreeting(supabase, supabaseUrl, company, company_id, logId, elevenlabs_api_key, elevenlabs_voice_id);
}

// Helper: Start the AI greeting flow (used by both incoming and dial-status fallback)
async function startAIGreeting(
  supabase: any, supabaseUrl: string, company: any, companyId: string,
  logId: string, elevenlabsApiKey: string, elevenlabsVoiceId: string
): Promise<Response> {
  const defaultGreeting = `Thank you for calling ${company?.name || 'us'}. How can I help you today?`;
  let greeting = company?.ai_voice_greeting || defaultGreeting;
  if (greeting.length > 150) {
    console.warn(`Greeting too long (${greeting.length} chars), using default`);
    greeting = defaultGreeting;
  }

  const voiceId = elevenlabsVoiceId || 'cgSgspJ2msm6clMCkdW9';
  const audioUrl = elevenlabsApiKey
    ? await ttsAudioUrl(supabase, companyId, greeting, elevenlabsApiKey, voiceId)
    : null;

  const gatherUrl = `${supabaseUrl}/functions/v1/voice-handler?action=process&callLogId=${logId}`;
  const timeoutUrl = `${supabaseUrl}/functions/v1/voice-handler?action=timeout&callLogId=${logId}`;

  return twimlResponse(buildPlayThenGather(audioUrl, greeting, gatherUrl, timeoutUrl));
}

// === DIAL STATUS (ring-first callback) ===
// Called by SignalWire after the <Dial> attempt to the business phone completes
async function handleDialStatus(
  supabase: any, supabaseUrl: string, supabaseKey: string,
  callLogId: string, callerNumber: string, formParams: Record<string, string>
): Promise<Response> {
  const dialStatus = formParams['DialCallStatus'] || '';
  console.log(`Dial status callback: status=${dialStatus} callLogId=${callLogId}`);

  // If the business owner answered and the call completed normally, we're done
  if (dialStatus === 'completed') {
    console.log('Business owner answered the call, marking as handled');
    if (callLogId) {
      await supabase.from('call_logs').update({
        status: 'completed',
        summary: 'Answered by business owner (ring-first mode)',
        ended_at: new Date().toISOString(),
      }).eq('id', callLogId);
    }
    return twimlResponse('<Hangup/>');
  }

  // Owner didn't answer (no-answer, busy, failed, cancel) -- AI takes over
  console.log(`Business owner didn't answer (${dialStatus}), AI agent taking over`);

  // Get company + integration info from the call log
  let companyId = '';
  if (callLogId && !callLogId.startsWith('incoming_')) {
    const { data: callLog } = await supabase
      .from('call_logs')
      .select('company_id')
      .eq('id', callLogId)
      .single();
    if (callLog) companyId = callLog.company_id;
  }

  if (!companyId) {
    return twimlResponse('<Say voice="Polly.Joanna">Sorry, we could not connect your call. Please try again. Goodbye.</Say><Hangup/>');
  }

  // Fetch company and integration details in parallel
  const [companyResult, integrationResult] = await Promise.all([
    supabase.from('companies').select('name, ai_voice_greeting, ai_agent_prompt').eq('id', companyId).single(),
    supabase.from('tenant_integrations').select('elevenlabs_api_key, elevenlabs_voice_id').eq('company_id', companyId).maybeSingle(),
  ]);

  return await startAIGreeting(
    supabase, supabaseUrl,
    companyResult.data, companyId, callLogId,
    integrationResult.data?.elevenlabs_api_key || '',
    integrationResult.data?.elevenlabs_voice_id || ''
  );
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
    // Determine the active agent (supports handoffs across turns)
    const activeAgent = collectedInfo._activeAgent || 'triage';

    // Build AI request body
    const aiRequestBody = {
      message: speechResult,
      systemPrompt,
      model: 'google/gemini-2.5-flash-lite',
      companyId,
      agentType: activeAgent,
      isInternalRequest: true,
      channel: 'phone',
      conversationHistory,
    };

    // === TWO-PHASE RESPONSE: Race AI against 3-second deadline ===
    const aiPromise = (async () => {
      const controller = new AbortController();
      const aiTimeout = setTimeout(() => controller.abort(), 12000);
      try {
        const aiResponse = await fetch(`${supabaseUrl}/functions/v1/ai-agent-chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify(aiRequestBody),
          signal: controller.signal,
        });
        clearTimeout(aiTimeout);

        if (!aiResponse.ok) {
          console.error(`[voice-handler] AI returned ${aiResponse.status}: ${await aiResponse.text()}`);
          return { reply: "I didn't quite catch that. Could you tell me again what you need help with?", handoff: null };
        }
        const aiText = await aiResponse.text();
        try {
          const aiData = JSON.parse(aiText);
          const reply = aiData.response || aiData.reply || aiData.message || "Could you tell me more?";
          return { reply, handoff: aiData.handoff_to || null };
        } catch {
          if (aiText && aiText.length < 500) return { reply: aiText, handoff: null };
          return { reply: "Could you tell me more about what you need?", handoff: null };
        }
      } catch (fetchErr: any) {
        clearTimeout(aiTimeout);
        if (fetchErr.name === 'AbortError') {
          console.warn('[voice-handler] AI call timed out after 12s');
          return { reply: "I'm sorry, I'm having a moment. Could you repeat that?", handoff: null };
        }
        throw fetchErr;
      }
    })();

    const timer = new Promise<'timeout'>(resolve => setTimeout(() => resolve('timeout'), 3000));
    const raceResult = await Promise.race([aiPromise, timer]);

    if (raceResult === 'timeout') {
      // AI is still thinking — save state and return hold TwiML immediately
      console.log('[voice-handler] AI exceeded 3s deadline, returning hold message');

      await supabase.from('call_logs').update({
        metadata: {
          conversation_history: conversationHistory,
          collected_info: collectedInfo,
          ai_pending: true,
          pending_speech: speechResult,
          pending_system_prompt: systemPrompt,
          pending_agent: activeAgent,
          pickup_retries: 0,
        },
      }).eq('id', callLogId);

      // Fire-and-forget: kick off background processing
      fetch(`${supabaseUrl}/functions/v1/voice-handler?action=process-background&callLogId=${callLogId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(aiRequestBody),
      }).catch(err => console.error('[voice-handler] Background fire-and-forget failed:', err));

      const holdUrl = `${supabaseUrl}/functions/v1/voice-handler?action=pickup&callLogId=${callLogId}`;
      return twimlResponse(`
        <Say voice="Polly.Joanna">One moment please, let me check on that for you.</Say>
        <Pause length="4"/>
        <Redirect method="POST">${escapeXmlUrl(holdUrl)}</Redirect>
      `);
    }

    // AI responded within 3 seconds — proceed normally
    let reply = raceResult.reply;
    if (raceResult.handoff) {
      collectedInfo._activeAgent = raceResult.handoff;
      console.log(`Phone handoff: ${activeAgent} -> ${raceResult.handoff}`);
    }

    // Clean any markdown/formatting from the reply
    reply = reply.replace(/[*_#`~\[\]]/g, '').replace(/\n/g, ' ').trim();

    // Add assistant response to conversation history
    conversationHistory.push({ role: 'assistant', content: reply });

    // Run DB save and TTS generation in parallel for speed
    const [_, replyAudioUrl] = await Promise.all([
      callLogId && !callLogId.startsWith('incoming_')
        ? supabase.from('call_logs').update({
            metadata: {
              conversation_history: conversationHistory,
              collected_info: collectedInfo,
            },
          }).eq('id', callLogId)
        : Promise.resolve(),
      elevenlabsApiKey
        ? ttsAudioUrl(supabase, companyId, reply, elevenlabsApiKey, elevenlabsVoiceId)
        : Promise.resolve(null),
    ]);

    const gatherUrl = `${supabaseUrl}/functions/v1/voice-handler?action=process&callLogId=${callLogId}`;
    const timeoutUrl = `${supabaseUrl}/functions/v1/voice-handler?action=timeout&callLogId=${callLogId}`;

    return twimlResponse(buildPlayThenGather(replyAudioUrl, reply, gatherUrl, timeoutUrl));
  } catch (aiError) {
    console.error('AI response failed:', aiError);
    return twimlResponse('<Say voice="Polly.Joanna">Thank you for calling. Someone will follow up with you. Goodbye.</Say><Hangup/>');
  }
}

// === PICKUP: Check if background AI processing is done ===
async function handlePickup(
  supabase: any, supabaseUrl: string, supabaseKey: string, callLogId: string
): Promise<Response> {
  console.log(`[pickup] Checking for AI response, callLogId=${callLogId}`);

  const { data: callLog } = await supabase
    .from('call_logs')
    .select('company_id, metadata')
    .eq('id', callLogId)
    .single();

  if (!callLog) {
    return twimlResponse('<Say voice="Polly.Joanna">Sorry, an error occurred. Goodbye.</Say><Hangup/>');
  }

  const metadata = callLog.metadata || {};
  const retries = metadata.pickup_retries || 0;

  if (metadata.ai_pending === false && metadata.pending_response) {
    // AI response is ready — generate TTS and respond
    console.log(`[pickup] AI response ready after ${retries} retries`);

    let reply = metadata.pending_response;
    reply = reply.replace(/[*_#`~\[\]]/g, '').replace(/\n/g, ' ').trim();

    const conversationHistory = metadata.conversation_history || [];
    const collectedInfo = metadata.collected_info || {};

    // Track handoff
    if (metadata.pending_handoff) {
      collectedInfo._activeAgent = metadata.pending_handoff;
    }

    conversationHistory.push({ role: 'assistant', content: reply });

    // Get ElevenLabs creds
    const { data: integration } = await supabase
      .from('tenant_integrations')
      .select('elevenlabs_api_key, elevenlabs_voice_id')
      .eq('company_id', callLog.company_id)
      .maybeSingle();

    const elevenlabsApiKey = integration?.elevenlabs_api_key || '';
    const elevenlabsVoiceId = integration?.elevenlabs_voice_id || 'cgSgspJ2msm6clMCkdW9';

    // Save state and generate TTS in parallel
    const [_, replyAudioUrl] = await Promise.all([
      supabase.from('call_logs').update({
        metadata: {
          conversation_history: conversationHistory,
          collected_info: collectedInfo,
          ai_pending: undefined,
          pending_response: undefined,
          pending_speech: undefined,
          pending_system_prompt: undefined,
          pending_agent: undefined,
          pending_handoff: undefined,
          pickup_retries: undefined,
        },
      }).eq('id', callLogId),
      elevenlabsApiKey
        ? ttsAudioUrl(supabase, callLog.company_id, reply, elevenlabsApiKey, elevenlabsVoiceId)
        : Promise.resolve(null),
    ]);

    const gatherUrl = `${supabaseUrl}/functions/v1/voice-handler?action=process&callLogId=${callLogId}`;
    const timeoutUrl = `${supabaseUrl}/functions/v1/voice-handler?action=timeout&callLogId=${callLogId}`;

    return twimlResponse(buildPlayThenGather(replyAudioUrl, reply, gatherUrl, timeoutUrl));
  }

  // AI still processing
  if (retries >= 3) {
    // Give up after ~16 seconds of total hold time, use fallback
    console.warn(`[pickup] Max retries reached, using fallback`);
    const fallback = "Could you tell me a bit more about what you need? I want to make sure I help you correctly.";

    const conversationHistory = metadata.conversation_history || [];
    conversationHistory.push({ role: 'assistant', content: fallback });

    await supabase.from('call_logs').update({
      metadata: {
        ...metadata,
        conversation_history: conversationHistory,
        ai_pending: false,
        pickup_retries: undefined,
      },
    }).eq('id', callLogId);

    const gatherUrl = `${supabaseUrl}/functions/v1/voice-handler?action=process&callLogId=${callLogId}`;
    const timeoutUrl = `${supabaseUrl}/functions/v1/voice-handler?action=timeout&callLogId=${callLogId}`;

    return twimlResponse(buildPlayThenGather(null, fallback, gatherUrl, timeoutUrl));
  }

  // Not ready yet — pause and redirect again
  console.log(`[pickup] AI still pending, retry ${retries + 1}/3`);
  await supabase.from('call_logs').update({
    metadata: { ...metadata, pickup_retries: retries + 1 },
  }).eq('id', callLogId);

  const pickupUrl = `${supabaseUrl}/functions/v1/voice-handler?action=pickup&callLogId=${callLogId}`;
  return twimlResponse(`
    <Pause length="3"/>
    <Redirect method="POST">${escapeXmlUrl(pickupUrl)}</Redirect>
  `);
}

// === PROCESS-BACKGROUND: Fire-and-forget AI call ===
async function handleProcessBackground(
  supabase: any, supabaseUrl: string, supabaseKey: string,
  callLogId: string, formParams: Record<string, string>
): Promise<Response> {
  console.log(`[process-background] Starting background AI processing for callLogId=${callLogId}`);

  try {
    // Read the AI request from the POST body
    let aiRequestBody: any = {};
    try {
      aiRequestBody = formParams;
      // formParams might already be parsed JSON from the body
    } catch { /* use empty */ }

    // If formParams didn't have the AI fields, read from call_logs metadata
    if (!aiRequestBody.message) {
      const { data: callLog } = await supabase
        .from('call_logs')
        .select('company_id, metadata')
        .eq('id', callLogId)
        .single();

      if (!callLog) {
        console.error('[process-background] Call log not found');
        return new Response('OK', { headers: corsHeaders });
      }

      const metadata = callLog.metadata || {};
      const conversationHistory = metadata.conversation_history || [];

      // Rebuild AI request from saved state
      aiRequestBody = {
        message: metadata.pending_speech,
        systemPrompt: metadata.pending_system_prompt,
        model: 'google/gemini-2.5-flash-lite',
        companyId: callLog.company_id,
        agentType: metadata.pending_agent || 'triage',
        isInternalRequest: true,
        channel: 'phone',
        conversationHistory,
      };
    }

    const controller = new AbortController();
    const aiTimeout = setTimeout(() => controller.abort(), 12000);

    const aiResponse = await fetch(`${supabaseUrl}/functions/v1/ai-agent-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify(aiRequestBody),
      signal: controller.signal,
    });
    clearTimeout(aiTimeout);

    let reply = "Could you tell me more about what you need?";
    let handoff: string | null = null;

    if (aiResponse.ok) {
      const aiText = await aiResponse.text();
      try {
        const aiData = JSON.parse(aiText);
        reply = aiData.response || aiData.reply || aiData.message || reply;
        handoff = aiData.handoff_to || null;
      } catch {
        if (aiText && aiText.length < 500) reply = aiText;
      }
    } else {
      console.error(`[process-background] AI returned ${aiResponse.status}`);
    }

    // Save the response to call_logs metadata for pickup
    const { data: currentLog } = await supabase
      .from('call_logs')
      .select('metadata')
      .eq('id', callLogId)
      .single();

    const currentMetadata = currentLog?.metadata || {};
    await supabase.from('call_logs').update({
      metadata: {
        ...currentMetadata,
        ai_pending: false,
        pending_response: reply,
        pending_handoff: handoff,
      },
    }).eq('id', callLogId);

    console.log(`[process-background] AI response saved, ready for pickup`);
  } catch (err) {
    console.error('[process-background] Error:', err);
    // Mark as no longer pending so pickup uses fallback
    const { data: currentLog } = await supabase
      .from('call_logs')
      .select('metadata')
      .eq('id', callLogId)
      .single();

    await supabase.from('call_logs').update({
      metadata: {
        ...(currentLog?.metadata || {}),
        ai_pending: false,
        pending_response: "I'm sorry, could you repeat that? I want to make sure I help you correctly.",
        pending_handoff: null,
      },
    }).eq('id', callLogId);
  }

  return new Response('OK', { headers: corsHeaders });
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
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_22050_32`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_flash_v2_5',
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