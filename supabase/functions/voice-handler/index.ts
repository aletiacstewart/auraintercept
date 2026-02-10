import { createClient } from "npm:@supabase/supabase-js@2"; // voice-handler SWML

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

function twimlResponse(twiml: string): Response {
  const xml = `<?xml version="1.0" encoding="UTF-8"?><Response>${twiml}</Response>`;
  return new Response(xml, {
    headers: { ...corsHeaders, 'Content-Type': 'application/xml' },
  });
}

function swmlResponse(swml: object): Response {
  return new Response(JSON.stringify(swml), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Build the phone-specific system prompt with sequential collection rules
function buildPhoneSystemPrompt(companyName: string, agentPrompt: string | null): string {
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
  5. Then ask for their preferred appointment date and time.
  6. Finally, confirm all details back to them.
- If the caller already provided some info (e.g. their name), skip that step and move to the next.
- Be warm, friendly, and conversational. Use the caller's name once you know it.

STRICT FLOW RULES (never violate these):
- Once the caller has mentioned a service, do NOT list services again. Move directly to collecting their name.
- NEVER say "What else can I help you with?" during a booking flow.
- Each response must contain exactly ONE question. Never combine questions.
- After the caller mentions a service, your ONLY next response should be asking for their name.
- Do NOT repeat information the caller has already provided.

TOOL USAGE:
- When you have a service type and preferred date, use the check_availability function to find open slots.
- When you have all the customer details (name, phone, email, service, date/time), use the book_appointment function.
- If the caller wants to speak to a person, use the transfer_call function.
- When the conversation is naturally ending, say goodbye warmly.`;

  return base + phoneRules;
}

// Build the SWML document for SignalWire's native AI agent
function buildSWMLDocument(
  supabaseUrl: string,
  company: any,
  companyId: string,
  callLogId: string,
  voiceId: string,
): object {
  const companyName = company?.name || 'our company';
  const greeting = company?.ai_voice_greeting || `Thank you for calling ${companyName}. How can I help you today?`;
  const systemPrompt = buildPhoneSystemPrompt(companyName, company?.ai_agent_prompt || null);

  const swaigUrl = `${supabaseUrl}/functions/v1/voice-swaig`;
  const postPromptUrl = `${supabaseUrl}/functions/v1/voice-post-prompt`;

  // Use ElevenLabs voice via SignalWire's native integration
  // Format: elevenlabs.<voice_id>:<model>
  const voice = `elevenlabs.${voiceId}:eleven_flash_v2_5`;

  return {
    version: "1.0.0",
    sections: {
      main: [
        { answer: {} },
        {
          ai: {
            prompt: {
              text: systemPrompt,
              temperature: 0.7,
            },
            post_prompt: {
              text: "Summarize the conversation. Include: customer name, phone number, email, service requested, appointment date/time if booked, and any other key details.",
            },
            post_prompt_url: postPromptUrl,
            params: {
              swaig_allow_swml: true,
              end_of_speech_timeout: 1400,
              attention_timeout: 15000,
              inactivity_timeout: 60000,
            },
            languages: [
              {
                name: "English",
                code: "en-US",
                voice,
                speech_fillers: ["um", "uh"],
                function_fillers: ["one moment", "let me check on that", "just a moment"],
              },
            ],
            hints: [companyName, "appointment", "booking", "schedule"],
            SWAIG: {
              defaults: {
                web_hook_url: swaigUrl,
                meta_data: {
                  company_id: companyId,
                  call_log_id: callLogId,
                },
              },
              functions: [
                {
                  function: "check_availability",
                  description: "Check available appointment slots for a given service and date. Call this when the caller mentions a service and a preferred date.",
                  parameters: {
                    type: "object",
                    properties: {
                      service_type: {
                        type: "string",
                        description: "The type of service the caller is requesting",
                      },
                      preferred_date: {
                        type: "string",
                        description: "The preferred date in YYYY-MM-DD format",
                      },
                    },
                    required: ["service_type"],
                  },
                  fillers: {
                    "en-US": [
                      "Let me check our availability for you.",
                      "One moment while I look that up.",
                    ],
                  },
                },
                {
                  function: "book_appointment",
                  description: "Book an appointment after collecting all required information: customer name, phone, email, service type, and date/time.",
                  parameters: {
                    type: "object",
                    properties: {
                      customer_name: {
                        type: "string",
                        description: "The customer's full name",
                      },
                      customer_phone: {
                        type: "string",
                        description: "The customer's phone number",
                      },
                      customer_email: {
                        type: "string",
                        description: "The customer's email address",
                      },
                      service_type: {
                        type: "string",
                        description: "The type of service requested",
                      },
                      appointment_date: {
                        type: "string",
                        description: "The appointment date in YYYY-MM-DD format",
                      },
                      appointment_time: {
                        type: "string",
                        description: "The appointment time in HH:MM format (24-hour)",
                      },
                    },
                    required: ["customer_name", "customer_phone", "service_type", "appointment_date", "appointment_time"],
                  },
                  fillers: {
                    "en-US": [
                      "Let me book that for you right now.",
                      "One moment while I schedule that.",
                    ],
                  },
                },
                {
                  function: "transfer_call",
                  description: "Transfer the caller to speak with someone at the business. Use when the caller explicitly asks to speak with a person or manager.",
                  parameters: {
                    type: "object",
                    properties: {},
                  },
                },
              ],
            },
          },
        },
      ],
    },
  };
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
        return await handleOutbound(supabase, supabaseUrl, callLogId);

      case 'outbound-response':
        return await handleOutboundResponse(supabase, callLogId, formParams);

      case 'status':
        return await handleStatus(supabase, callLogId, callSid, formParams);

      default:
        console.log(`Unknown action: ${action}`);
        return swmlResponse({
          version: "1.0.0",
          sections: { main: [{ answer: {} }, { play: { url: "say:Sorry, an error occurred. Goodbye." } }, { hangup: {} }] },
        });
    }
  } catch (error) {
    console.error('Voice handler error:', error);
    return swmlResponse({
      version: "1.0.0",
      sections: { main: [{ answer: {} }, { play: { url: "say:Sorry, we encountered an error. Goodbye." } }, { hangup: {} }] },
    });
  }
});

// === INCOMING CALL — returns SWML for AI or TwiML for ring-first ===
async function handleIncoming(
  supabase: any, supabaseUrl: string, callerNumber: string, calledNumber: string
): Promise<Response> {
  const normalizedCalled = normalizePhoneNumber(calledNumber);
  const normalizedCaller = normalizePhoneNumber(callerNumber);

  // Look up company by phone number + fetch ElevenLabs voice ID
  const { data: integration } = await supabase
    .from('tenant_integrations')
    .select('company_id, elevenlabs_voice_id')
    .eq('signalwire_phone_number', normalizedCalled)
    .maybeSingle();

  if (!integration) {
    console.log('No company found for number:', normalizedCalled);
    return swmlResponse({
      version: "1.0.0",
      sections: { main: [{ answer: {} }, { play: { url: "say:Sorry, this number is not configured. Goodbye." } }, { hangup: {} }] },
    });
  }

  const { company_id, elevenlabs_voice_id } = integration;

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
    metadata: {},
  }).select('id').single();

  const logId = callLog?.id || `incoming_${company_id}`;

  // Determine voice ID
  const voiceId = elevenlabs_voice_id || 'cgSgspJ2msm6clMCkdW9';

  // === RING FIRST MODE — SWML connect with AI fallback ===
  const routingMode = company?.call_routing_mode || 'ai_direct';
  const businessPhone = company?.business_phone;
  const ringTimeout = company?.ring_timeout_seconds || 15;

  if (routingMode === 'ring_first' && businessPhone) {
    const normalizedBusiness = normalizePhoneNumber(businessPhone);
    console.log(`Ring-first mode: SWML connect to ${normalizedBusiness} for ${ringTimeout}s, then AI fallback`);

    const swml = buildSWMLDocument(supabaseUrl, company, company_id, logId, voiceId);
    // Insert connect verb before the ai block
    const mainSection = (swml as any).sections.main;
    // mainSection is [answer, ai] — insert connect between them
    const aiBlock = mainSection.pop(); // remove ai
    mainSection.push({
      connect: {
        from: normalizedCalled,
        to: normalizedBusiness,
        timeout: ringTimeout,
      },
    });
    mainSection.push(aiBlock); // add ai back after connect

    return swmlResponse(swml);
  }

  // === AI DIRECT MODE — return SWML document ===
  console.log(`AI direct mode: returning SWML document for company ${company_id}`);
  return swmlResponse(buildSWMLDocument(supabaseUrl, company, company_id, logId, voiceId));
}

// (handleDialStatus removed — ring-first now uses SWML connect verb with native AI fallback)

// === OUTBOUND CALL (one-way TwiML — reminders/follow-ups, NOT interactive AI) ===
async function handleOutbound(
  supabase: any, supabaseUrl: string, callLogId: string
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

// === OUTBOUND RESPONSE (DTMF after outbound message) ===
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
