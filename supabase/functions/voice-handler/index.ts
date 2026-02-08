import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConversationState {
  companyId: string;
  messages: Array<{ role: string; content: string }>;
  customerPhone: string;
  createdAt: number; // Timestamp for TTL cleanup
}

// In-memory conversation state with TTL management
const conversations = new Map<string, ConversationState>();
const CONVERSATION_TTL_MS = 30 * 60 * 1000; // 30 minutes TTL
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // Clean up every 5 minutes
let lastCleanup = Date.now();

// Clean up expired conversations to prevent memory leaks
function cleanupExpiredConversations(): void {
  const now = Date.now();
  // Only run cleanup periodically to avoid performance impact
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  
  lastCleanup = now;
  let cleaned = 0;
  
  for (const [callSid, state] of conversations.entries()) {
    if (now - state.createdAt > CONVERSATION_TTL_MS) {
      conversations.delete(callSid);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.log(`Cleaned up ${cleaned} expired conversation(s). Active: ${conversations.size}`);
  }
}
serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.split('/').pop();

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      // Handle incoming call webhook from SignalWire
      if (path === 'incoming' || url.searchParams.get('action') === 'incoming') {
        const formData = await req.formData();
        const callerPhone = formData.get('From') as string;
        const calledPhone = formData.get('To') as string;
        const callSid = formData.get('CallSid') as string;

        console.log(`Incoming call from ${callerPhone} to ${calledPhone}, CallSid: ${callSid}`);

        // Find company by SignalWire phone number
        const { data: integration } = await supabase
          .from('tenant_integrations')
          .select('company_id, elevenlabs_api_key, elevenlabs_voice_id')
          .eq('signalwire_phone_number', calledPhone)
          .single();

      if (!integration) {
        console.error('No company found for phone number:', calledPhone);
        return new Response(
          `<?xml version="1.0" encoding="UTF-8"?>
          <Response>
            <Say>Sorry, this number is not configured. Goodbye.</Say>
            <Hangup/>
          </Response>`,
          { headers: { ...corsHeaders, 'Content-Type': 'application/xml' } }
        );
      }

      // Get company info for greeting
      const { data: company } = await supabase
        .from('companies')
        .select('name')
        .eq('id', integration.company_id)
        .single();

      // Log the incoming call
      await supabase
        .from('call_logs')
        .insert({
          company_id: integration.company_id,
          direction: 'inbound',
          status: 'answered',
          from_number: callerPhone,
          to_number: calledPhone,
          customer_phone: callerPhone,
          call_sid: callSid,
          answered_at: new Date().toISOString(),
        });

      // Initialize conversation state with TTL tracking
      cleanupExpiredConversations(); // Run cleanup on new conversations
      conversations.set(callSid, {
        companyId: integration.company_id,
        messages: [],
        customerPhone: callerPhone,
        createdAt: Date.now(),
      });

      const greeting = `Hello! Thank you for calling ${company?.name || 'us'}. How can I help you today?`;

      // Generate voice greeting with ElevenLabs or use Twilio TTS
      if (integration.elevenlabs_api_key) {
        const audioUrl = await generateElevenLabsAudio(
          greeting,
          integration.elevenlabs_api_key,
          integration.elevenlabs_voice_id || 'EXAVITQu4vr4xnSDxMaL', // Default: Sarah
          supabase,
          callSid
        );

        if (audioUrl) {
          return new Response(
            `<?xml version="1.0" encoding="UTF-8"?>
            <Response>
              <Start>
                <Record recordingStatusCallback="${SUPABASE_URL}/functions/v1/voice-handler?action=recording" recordingStatusCallbackEvent="completed"/>
              </Start>
              <Play>${audioUrl}</Play>
              <Gather input="speech" timeout="5" speechTimeout="auto" action="${SUPABASE_URL}/functions/v1/voice-handler?action=process&amp;callSid=${callSid}">
              </Gather>
              <Redirect>${SUPABASE_URL}/functions/v1/voice-handler?action=timeout&amp;callSid=${callSid}</Redirect>
            </Response>`,
            { headers: { ...corsHeaders, 'Content-Type': 'application/xml' } }
          );
        }
      }

      // Fallback to Twilio TTS with recording
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Start>
            <Record recordingStatusCallback="${SUPABASE_URL}/functions/v1/voice-handler?action=recording" recordingStatusCallbackEvent="completed"/>
          </Start>
          <Say voice="Polly.Joanna">${greeting}</Say>
          <Gather input="speech" timeout="5" speechTimeout="auto" action="${SUPABASE_URL}/functions/v1/voice-handler?action=process&amp;callSid=${callSid}">
          </Gather>
          <Redirect>${SUPABASE_URL}/functions/v1/voice-handler?action=timeout&amp;callSid=${callSid}</Redirect>
        </Response>`,
        { headers: { ...corsHeaders, 'Content-Type': 'application/xml' } }
      );
    }

    // Process speech input
    if (path === 'process' || url.searchParams.get('action') === 'process') {
      const formData = await req.formData();
      const speechResult = formData.get('SpeechResult') as string;
      const callSid = url.searchParams.get('callSid') || formData.get('CallSid') as string;

      console.log(`Speech received for ${callSid}: ${speechResult}`);

      const state = conversations.get(callSid);
      if (!state) {
        return new Response(
          `<?xml version="1.0" encoding="UTF-8"?>
          <Response>
            <Say voice="Polly.Joanna">I'm sorry, there was an error. Please call back.</Say>
            <Hangup/>
          </Response>`,
          { headers: { ...corsHeaders, 'Content-Type': 'application/xml' } }
        );
      }

      // Add user message to history
      state.messages.push({ role: 'user', content: speechResult });

      // Get AI response
      const aiResponse = await getAIResponse(supabase, state.companyId, state.messages);
      state.messages.push({ role: 'assistant', content: aiResponse });

      // Get integration for ElevenLabs
      const { data: integration } = await supabase
        .from('tenant_integrations')
        .select('elevenlabs_api_key, elevenlabs_voice_id')
        .eq('company_id', state.companyId)
        .single();

      // Generate voice response
      if (integration?.elevenlabs_api_key) {
        const audioUrl = await generateElevenLabsAudio(
          aiResponse,
          integration.elevenlabs_api_key,
          integration.elevenlabs_voice_id || 'EXAVITQu4vr4xnSDxMaL',
          supabase,
          callSid
        );

        if (audioUrl) {
          return new Response(
            `<?xml version="1.0" encoding="UTF-8"?>
            <Response>
              <Play>${audioUrl}</Play>
              <Gather input="speech" timeout="5" speechTimeout="auto" action="${SUPABASE_URL}/functions/v1/voice-handler?action=process&amp;callSid=${callSid}">
              </Gather>
              <Redirect>${SUPABASE_URL}/functions/v1/voice-handler?action=timeout&amp;callSid=${callSid}</Redirect>
            </Response>`,
            { headers: { ...corsHeaders, 'Content-Type': 'application/xml' } }
          );
        }
      }

      // Fallback to Twilio TTS
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Say voice="Polly.Joanna">${escapeXml(aiResponse)}</Say>
          <Gather input="speech" timeout="5" speechTimeout="auto" action="${SUPABASE_URL}/functions/v1/voice-handler?action=process&amp;callSid=${callSid}">
          </Gather>
          <Redirect>${SUPABASE_URL}/functions/v1/voice-handler?action=timeout&amp;callSid=${callSid}</Redirect>
        </Response>`,
        { headers: { ...corsHeaders, 'Content-Type': 'application/xml' } }
      );
    }

    // Handle timeout - prompt user again
    if (path === 'timeout' || url.searchParams.get('action') === 'timeout') {
      const callSid = url.searchParams.get('callSid');
      
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Say voice="Polly.Joanna">I didn't catch that. Is there anything else I can help you with?</Say>
          <Gather input="speech" timeout="5" speechTimeout="auto" action="${SUPABASE_URL}/functions/v1/voice-handler?action=process&amp;callSid=${callSid}">
          </Gather>
          <Say voice="Polly.Joanna">Thank you for calling. Goodbye!</Say>
          <Hangup/>
        </Response>`,
        { headers: { ...corsHeaders, 'Content-Type': 'application/xml' } }
      );
    }

    // Handle outbound calls (appointment reminders, follow-ups)
    if (path === 'outbound' || url.searchParams.get('action') === 'outbound') {
      const formData = await req.formData();
      const callSid = formData.get('CallSid') as string;
      const contextParam = url.searchParams.get('context');
      
      if (!contextParam) {
        return new Response(
          `<?xml version="1.0" encoding="UTF-8"?>
          <Response>
            <Say voice="Polly.Joanna">Hello, this is an automated call. Goodbye.</Say>
            <Hangup/>
          </Response>`,
          { headers: { ...corsHeaders, 'Content-Type': 'application/xml' } }
        );
      }

      const context = JSON.parse(decodeURIComponent(contextParam));
      console.log(`Outbound call ${callSid} for ${context.purpose}:`, context);

      // Initialize conversation state for potential follow-up with TTL tracking
      cleanupExpiredConversations();
      conversations.set(callSid, {
        companyId: context.companyId,
        messages: [{ role: 'system', content: `This is an outbound ${context.purpose} call to ${context.customerName}.` }],
        customerPhone: context.customerPhone,
        createdAt: Date.now(),
      });

      // Get ElevenLabs config
      const { data: integration } = await supabase
        .from('tenant_integrations')
        .select('elevenlabs_api_key, elevenlabs_voice_id')
        .eq('company_id', context.companyId)
        .single();

      // Generate voice message
      if (integration?.elevenlabs_api_key) {
        const audioUrl = await generateElevenLabsAudio(
          context.message,
          integration.elevenlabs_api_key,
          integration.elevenlabs_voice_id || 'EXAVITQu4vr4xnSDxMaL',
          supabase,
          callSid
        );

        if (audioUrl) {
          return new Response(
            `<?xml version="1.0" encoding="UTF-8"?>
            <Response>
              <Play>${audioUrl}</Play>
              <Gather input="dtmf speech" timeout="5" numDigits="1" action="${SUPABASE_URL}/functions/v1/voice-handler?action=outbound-response&amp;callSid=${callSid}&amp;context=${contextParam}">
              </Gather>
              <Say voice="Polly.Joanna">We didn't receive a response. Thank you for your time. Goodbye!</Say>
              <Hangup/>
            </Response>`,
            { headers: { ...corsHeaders, 'Content-Type': 'application/xml' } }
          );
        }
      }

      // Fallback to Twilio TTS
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Say voice="Polly.Joanna">${escapeXml(context.message)}</Say>
          <Gather input="dtmf speech" timeout="5" numDigits="1" action="${SUPABASE_URL}/functions/v1/voice-handler?action=outbound-response&amp;callSid=${callSid}&amp;context=${contextParam}">
          </Gather>
          <Say voice="Polly.Joanna">We didn't receive a response. Thank you for your time. Goodbye!</Say>
          <Hangup/>
        </Response>`,
        { headers: { ...corsHeaders, 'Content-Type': 'application/xml' } }
      );
    }

    // Handle outbound call responses (DTMF or speech)
    if (path === 'outbound-response' || url.searchParams.get('action') === 'outbound-response') {
      const formData = await req.formData();
      const callSid = url.searchParams.get('callSid') || formData.get('CallSid') as string;
      const digits = formData.get('Digits') as string;
      const speechResult = formData.get('SpeechResult') as string;
      const contextParam = url.searchParams.get('context');

      console.log(`Outbound response for ${callSid}: digits=${digits}, speech=${speechResult}`);

      const context = contextParam ? JSON.parse(decodeURIComponent(contextParam)) : null;

      // Handle DTMF responses
      if (digits === '1') {
        // Confirmed
        return new Response(
          `<?xml version="1.0" encoding="UTF-8"?>
          <Response>
            <Say voice="Polly.Joanna">Thank you for confirming! We look forward to seeing you. Goodbye!</Say>
            <Hangup/>
          </Response>`,
          { headers: { ...corsHeaders, 'Content-Type': 'application/xml' } }
        );
      } else if (digits === '2') {
        // Wants to reschedule or speak with someone
        return new Response(
          `<?xml version="1.0" encoding="UTF-8"?>
          <Response>
            <Say voice="Polly.Joanna">I'll connect you with our scheduling assistant. How can I help you today?</Say>
            <Gather input="speech" timeout="5" speechTimeout="auto" action="${SUPABASE_URL}/functions/v1/voice-handler?action=process&amp;callSid=${callSid}">
            </Gather>
            <Redirect>${SUPABASE_URL}/functions/v1/voice-handler?action=timeout&amp;callSid=${callSid}</Redirect>
          </Response>`,
          { headers: { ...corsHeaders, 'Content-Type': 'application/xml' } }
        );
      } else if (speechResult) {
        // Handle speech response - treat as conversation
        const state = conversations.get(callSid);
        if (state) {
          state.messages.push({ role: 'user', content: speechResult });
          const aiResponse = await getAIResponse(supabase, state.companyId, state.messages);
          state.messages.push({ role: 'assistant', content: aiResponse });

          return new Response(
            `<?xml version="1.0" encoding="UTF-8"?>
            <Response>
              <Say voice="Polly.Joanna">${escapeXml(aiResponse)}</Say>
              <Gather input="speech" timeout="5" speechTimeout="auto" action="${SUPABASE_URL}/functions/v1/voice-handler?action=process&amp;callSid=${callSid}">
              </Gather>
              <Redirect>${SUPABASE_URL}/functions/v1/voice-handler?action=timeout&amp;callSid=${callSid}</Redirect>
            </Response>`,
            { headers: { ...corsHeaders, 'Content-Type': 'application/xml' } }
          );
        }
      }

      // Default response
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Say voice="Polly.Joanna">Thank you for your time. Goodbye!</Say>
          <Hangup/>
        </Response>`,
        { headers: { ...corsHeaders, 'Content-Type': 'application/xml' } }
      );
    }

    // Handle call status updates
    if (path === 'status' || url.searchParams.get('action') === 'status') {
      const formData = await req.formData();
      const callSid = formData.get('CallSid') as string;
      const callStatus = formData.get('CallStatus') as string;
      const callDuration = formData.get('CallDuration') as string;
      const recordingUrl = formData.get('RecordingUrl') as string;
      const recordingDuration = formData.get('RecordingDuration') as string;

      console.log(`Call ${callSid} status: ${callStatus}, duration: ${callDuration}, recording: ${recordingUrl}`);

      // Update call log with status
      const state = conversations.get(callSid);
      const updateData: Record<string, any> = { status: callStatus };
      
      if (callStatus === 'in-progress') {
        updateData.answered_at = new Date().toISOString();
      }
      
      if (['completed', 'failed', 'busy', 'no-answer', 'canceled'].includes(callStatus)) {
        updateData.ended_at = new Date().toISOString();
        if (callDuration) {
          updateData.duration_seconds = parseInt(callDuration, 10);
        }
        // Save transcript if we have conversation history
        if (state && state.messages.length > 0) {
          updateData.transcript = state.messages;
        }
      }

      // Handle recording URL if provided
      if (recordingUrl) {
        updateData.recording_url = recordingUrl + '.mp3'; // Twilio recordings can be accessed as MP3
        if (recordingDuration) {
          updateData.recording_duration_seconds = parseInt(recordingDuration, 10);
        }
      }

      await supabase
        .from('call_logs')
        .update(updateData)
        .eq('call_sid', callSid);

      // Clean up conversation state on call end
      if (['completed', 'failed', 'busy', 'no-answer', 'canceled'].includes(callStatus)) {
        conversations.delete(callSid);
      }

      return new Response('OK', { headers: corsHeaders });
    }

    // Handle recording callback from Twilio
    if (path === 'recording' || url.searchParams.get('action') === 'recording') {
      const formData = await req.formData();
      const callSid = formData.get('CallSid') as string;
      const recordingUrl = formData.get('RecordingUrl') as string;
      const recordingDuration = formData.get('RecordingDuration') as string;
      const recordingSid = formData.get('RecordingSid') as string;

      console.log(`Recording received for ${callSid}: ${recordingUrl}, duration: ${recordingDuration}s, SID: ${recordingSid}`);

      if (recordingUrl) {
        await supabase
          .from('call_logs')
          .update({
            recording_url: recordingUrl + '.mp3',
            recording_duration_seconds: recordingDuration ? parseInt(recordingDuration, 10) : null,
          })
          .eq('call_sid', callSid);
      }

      return new Response('OK', { headers: corsHeaders });
    }

    return new Response('Not found', { status: 404, headers: corsHeaders });

  } catch (error) {
    console.error('Voice handler error:', error);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say voice="Polly.Joanna">Sorry, there was a technical issue. Please try again later.</Say>
        <Hangup/>
      </Response>`,
      { headers: { ...corsHeaders, 'Content-Type': 'application/xml' } }
    );
  }
});

// Generate ElevenLabs audio and upload to storage for SignalWire playback
async function generateElevenLabsAudio(
  text: string,
  apiKey: string,
  voiceId: string,
  supabase: any,
  callSid: string
): Promise<string | null> {
  try {
    console.log(`Generating ElevenLabs audio for callSid: ${callSid}, voiceId: ${voiceId}`);
    
    // Generate audio using ElevenLabs TTS API
    const response = await fetch(
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
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            speed: 1.0,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`ElevenLabs API error (${response.status}):`, errorText);
      return null;
    }

    // Get audio as ArrayBuffer
    const audioBuffer = await response.arrayBuffer();
    console.log(`ElevenLabs audio generated: ${audioBuffer.byteLength} bytes`);

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${callSid}-${timestamp}.mp3`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('voice-audio')
      .upload(filename, audioBuffer, {
        contentType: 'audio/mpeg',
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return null;
    }

    console.log(`Audio uploaded successfully: ${filename}`);

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from('voice-audio')
      .getPublicUrl(filename);

    const publicUrl = urlData?.publicUrl;
    console.log(`Generated public URL: ${publicUrl}`);

    // Clean up old audio files asynchronously (don't block response)
    cleanupOldAudioFiles(supabase).catch(err => 
      console.error('Cleanup error (non-blocking):', err)
    );

    return publicUrl;
  } catch (error) {
    console.error('ElevenLabs generation error:', error);
    return null;
  }
}

// Clean up audio files older than 1 hour to prevent storage bloat
async function cleanupOldAudioFiles(supabase: any): Promise<void> {
  try {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    // List files in the bucket
    const { data: files, error: listError } = await supabase.storage
      .from('voice-audio')
      .list();

    if (listError || !files) {
      console.log('Could not list files for cleanup:', listError);
      return;
    }

    // Find files older than 1 hour based on their timestamp in filename
    const filesToDelete = files.filter((file: any) => {
      // Extract timestamp from filename (format: callSid-timestamp.mp3)
      const match = file.name.match(/-(\d+)\.mp3$/);
      if (match) {
        const fileTimestamp = parseInt(match[1], 10);
        return fileTimestamp < oneHourAgo;
      }
      // Delete files with unexpected format that are old based on created_at
      return file.created_at && new Date(file.created_at).getTime() < oneHourAgo;
    });

    if (filesToDelete.length > 0) {
      const fileNames = filesToDelete.map((f: any) => f.name);
      const { error: deleteError } = await supabase.storage
        .from('voice-audio')
        .remove(fileNames);

      if (deleteError) {
        console.error('Error deleting old audio files:', deleteError);
      } else {
        console.log(`Cleaned up ${filesToDelete.length} old audio file(s)`);
      }
    }
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}

// Get AI response using the AI agent
async function getAIResponse(
  supabase: any,
  companyId: string,
  messages: Array<{ role: string; content: string }>
): Promise<string> {
  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    // Fetch knowledge base for RAG
    const knowledge = await fetchKnowledgeBase(supabase, companyId);
    const systemPrompt = buildSystemPrompt(knowledge);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      console.error('AI response error:', await response.text());
      return "I'm sorry, I'm having trouble processing your request. Would you like me to have someone call you back?";
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "I'm sorry, I didn't understand. Could you please repeat that?";
  } catch (error) {
    console.error('AI response error:', error);
    return "I'm experiencing technical difficulties. Would you like to leave a message?";
  }
}

async function fetchKnowledgeBase(supabase: any, companyId: string) {
  const [servicesRes, faqsRes, hoursRes, docsRes, companyRes] = await Promise.all([
    supabase.from('services').select('*').eq('company_id', companyId).eq('is_active', true),
    supabase.from('faqs').select('*').eq('company_id', companyId).eq('is_active', true),
    supabase.from('business_hours').select('*').eq('company_id', companyId),
    supabase.from('knowledge_documents').select('name, content_text').eq('company_id', companyId),
    supabase.from('companies').select('name').eq('id', companyId).single(),
  ]);

  return {
    companyName: companyRes.data?.name || 'Our Business',
    services: servicesRes.data || [],
    faqs: faqsRes.data || [],
    businessHours: hoursRes.data || [],
    documents: docsRes.data || [],
  };
}

function buildSystemPrompt(knowledge: any): string {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  let prompt = `You are a friendly, professional AI phone receptionist for ${knowledge.companyName}. 
You are speaking on a phone call, so keep responses concise and conversational (2-3 sentences max).
Speak naturally as if talking to someone on the phone. Don't use bullet points or lists in your responses.

IMPORTANT PHONE CALL GUIDELINES:
- Keep responses brief and natural for phone conversation
- Don't overwhelm the caller with too much information at once
- Ask one question at a time
- If booking an appointment, collect: name, service needed, and preferred date/time
- Confirm details before finalizing anything

`;

  // Add business hours
  if (knowledge.businessHours.length > 0) {
    prompt += '\nBUSINESS HOURS:\n';
    knowledge.businessHours.forEach((h: any) => {
      if (h.is_closed) {
        prompt += `${dayNames[h.day_of_week]}: Closed\n`;
      } else {
        prompt += `${dayNames[h.day_of_week]}: ${h.open_time} - ${h.close_time}\n`;
      }
    });
  }

  // Add services
  if (knowledge.services.length > 0) {
    prompt += '\nSERVICES OFFERED:\n';
    knowledge.services.forEach((s: any) => {
      prompt += `- ${s.name}: ${s.duration_minutes} minutes, ${s.price ? `$${s.price}` : 'Price varies'}\n`;
    });
  }

  // Add FAQs
  if (knowledge.faqs.length > 0) {
    prompt += '\nCOMMON QUESTIONS:\n';
    knowledge.faqs.slice(0, 10).forEach((f: any) => {
      prompt += `Q: ${f.question}\nA: ${f.answer}\n\n`;
    });
  }

  return prompt;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
