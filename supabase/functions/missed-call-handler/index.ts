import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse Twilio webhook data (form-urlencoded)
    const formData = await req.formData();
    const callData: Record<string, string> = {};
    formData.forEach((value, key) => {
      callData[key] = value.toString();
    });

    console.log("Missed call webhook received:", callData);

    const callerNumber = callData.From || callData.Caller;
    const calledNumber = callData.To || callData.Called;
    const callStatus = callData.CallStatus;
    const callSid = callData.CallSid;

    // Find company by Twilio phone number
    const { data: integration } = await supabase
      .from('tenant_integrations')
      .select('company_id, twilio_account_sid, twilio_auth_token, twilio_phone_number, elevenlabs_api_key, elevenlabs_voice_id')
      .eq('twilio_phone_number', calledNumber)
      .single();

    if (!integration) {
      console.log("No company found for number:", calledNumber);
      return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
        headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
      });
    }

    const companyId = integration.company_id;

    // Get company details with missed call settings
    const { data: company } = await supabase
      .from('companies')
      .select('name, missed_call_action, callback_delay_seconds, callback_retry_count')
      .eq('id', companyId)
      .single();

    const missedCallAction = company?.missed_call_action || 'sms_only';
    const callbackDelay = company?.callback_delay_seconds || 30;
    const companyName = company?.name || 'Our Business';

    console.log(`Missed call settings - Action: ${missedCallAction}, Delay: ${callbackDelay}s`);

    // Only process missed/no-answer calls
    if (callStatus === 'no-answer' || callStatus === 'busy' || callStatus === 'failed') {
      
      // Log the missed call in call_logs
      await supabase.from('call_logs').insert({
        company_id: companyId,
        direction: 'inbound',
        status: 'missed',
        from_number: callerNumber,
        to_number: calledNumber,
        call_sid: callSid,
        customer_phone: callerNumber,
        purpose: 'missed_call',
        metadata: { original_status: callStatus },
      });

      if (missedCallAction === 'disabled') {
        console.log('Missed call handling disabled for this company');
        return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
          headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
        });
      }

      // Create a callback tracking record
      const { data: callbackRecord, error: insertError } = await supabase
        .from('missed_call_callbacks')
        .insert({
          company_id: companyId,
          original_call_sid: callSid,
          customer_phone: callerNumber,
          status: 'pending',
          scheduled_at: new Date(Date.now() + callbackDelay * 1000).toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating callback record:', insertError);
      }

      // Handle based on action type
      if (missedCallAction === 'callback_only' || missedCallAction === 'callback_then_sms') {
        // Schedule AI callback after delay
        console.log(`Scheduling AI callback in ${callbackDelay} seconds`);
        
        // Use background task to wait and then initiate callback
        // Note: Using Promise without await to run in background
        handleAICallback(
          supabase,
          SUPABASE_URL,
          companyId,
          callerNumber,
          companyName,
          callbackDelay,
          callbackRecord?.id,
          missedCallAction,
          integration
        ).catch(err => console.error('Background callback error:', err));
      } else if (missedCallAction === 'sms_only') {
        // Send SMS immediately
        await sendFollowUpSMS(
          integration.twilio_account_sid,
          integration.twilio_auth_token,
          calledNumber,
          callerNumber,
          companyName
        );
        console.log(`Follow-up SMS sent to ${callerNumber} for company ${companyId}`);
      }
    }

    // Return TwiML response
    return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
    });

  } catch (error) {
    console.error("Missed call handler error:", error);
    return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
    });
  }
});

async function handleAICallback(
  supabase: any,
  supabaseUrl: string,
  companyId: string,
  customerPhone: string,
  companyName: string,
  delaySeconds: number,
  callbackRecordId: string | undefined,
  missedCallAction: string,
  integration: any
) {
  try {
    // Wait for the specified delay
    await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));

    // Check if customer already called back
    const { data: recentCalls } = await supabase
      .from('call_logs')
      .select('id')
      .eq('company_id', companyId)
      .eq('from_number', customerPhone)
      .eq('direction', 'inbound')
      .gt('created_at', new Date(Date.now() - delaySeconds * 1000).toISOString())
      .neq('status', 'missed')
      .limit(1);

    if (recentCalls && recentCalls.length > 0) {
      console.log('Customer already called back, skipping AI callback');
      if (callbackRecordId) {
        await supabase
          .from('missed_call_callbacks')
          .update({ status: 'customer_called_back', completed_at: new Date().toISOString() })
          .eq('id', callbackRecordId);
      }
      return;
    }

    // Update callback status to initiated
    if (callbackRecordId) {
      await supabase
        .from('missed_call_callbacks')
        .update({ status: 'initiated', initiated_at: new Date().toISOString() })
        .eq('id', callbackRecordId);
    }

    // Initiate the AI callback via outbound-call function
    const response = await fetch(`${supabaseUrl}/functions/v1/outbound-call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        companyId,
        customerPhone,
        customerName: 'Valued Customer',
        purpose: 'custom',
        customMessage: `Hi, this is ${companyName} returning your call. We're sorry we missed you! How can I help you today? You can book an appointment, ask questions about our services, or request a quote.`,
      }),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log('AI callback initiated successfully:', result.callSid);
      if (callbackRecordId) {
        await supabase
          .from('missed_call_callbacks')
          .update({ 
            callback_call_sid: result.callSid,
            status: 'initiated',
          })
          .eq('id', callbackRecordId);
      }
    } else {
      throw new Error(result.error || 'Failed to initiate callback');
    }

  } catch (error) {
    console.error('AI callback error:', error);
    
    // Update callback record with error
    if (callbackRecordId) {
      await supabase
        .from('missed_call_callbacks')
        .update({ 
          status: 'failed', 
          error_message: error instanceof Error ? error.message : 'Unknown error',
          completed_at: new Date().toISOString(),
        })
        .eq('id', callbackRecordId);
    }

    // Fall back to SMS if configured
    if (missedCallAction === 'callback_then_sms') {
      console.log('Callback failed, falling back to SMS');
      try {
        await sendFollowUpSMS(
          integration.twilio_account_sid,
          integration.twilio_auth_token,
          integration.twilio_phone_number,
          customerPhone,
          companyName
        );
        if (callbackRecordId) {
          await supabase
            .from('missed_call_callbacks')
            .update({ sms_fallback_sent: true })
            .eq('id', callbackRecordId);
        }
      } catch (smsError) {
        console.error('SMS fallback also failed:', smsError);
      }
    }
  }
}

async function sendFollowUpSMS(
  accountSid: string,
  authToken: string,
  fromNumber: string,
  toNumber: string,
  companyName: string
) {
  const message = `Hi! We noticed you just called ${companyName} and we missed your call. We're sorry about that! Would you like to book an appointment? Reply YES to receive a link to our online booking, or we'll call you back as soon as possible.`;

  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  
  const response = await fetch(twilioUrl, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      To: toNumber,
      From: fromNumber,
      Body: message,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Twilio SMS error:', errorText);
    throw new Error(`Failed to send SMS: ${response.status}`);
  }

  const result = await response.json();
  console.log('SMS sent successfully:', result.sid);
  return result;
}
