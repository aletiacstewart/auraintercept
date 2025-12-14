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
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

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
      .select('company_id, twilio_account_sid, twilio_auth_token')
      .eq('twilio_phone_number', calledNumber)
      .single();

    if (!integration) {
      console.log("No company found for number:", calledNumber);
      return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
        headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
      });
    }

    const companyId = integration.company_id;

    // Get company details
    const { data: company } = await supabase
      .from('companies')
      .select('name')
      .eq('id', companyId)
      .single();

    // Only send SMS for missed/no-answer calls
    if (callStatus === 'no-answer' || callStatus === 'busy' || callStatus === 'failed') {
      // Send follow-up SMS via Twilio
      await sendFollowUpSMS(
        integration.twilio_account_sid,
        integration.twilio_auth_token,
        calledNumber,
        callerNumber,
        company?.name || 'Our Business'
      );

      console.log(`Follow-up SMS sent to ${callerNumber} for company ${companyId}`);
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
