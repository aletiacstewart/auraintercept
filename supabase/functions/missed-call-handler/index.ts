import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { normalizePhoneNumber } from "../_shared/phone-utils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Parse SignalWire form data
    let fromNumber = "";
    let toNumber = "";
    let callSid = "";
    let callStatus = "";

    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      fromNumber = (formData.get("From") || formData.get("from") || "") as string;
      toNumber = (formData.get("To") || formData.get("to") || "") as string;
      callSid = (formData.get("CallSid") || formData.get("callSid") || "") as string;
      callStatus = (formData.get("CallStatus") || formData.get("callStatus") || "") as string;
    } else {
      const text = await req.text();
      try {
        const body = JSON.parse(text);
        fromNumber = body.From || body.from || "";
        toNumber = body.To || body.to || "";
        callSid = body.CallSid || body.callSid || "";
        callStatus = body.CallStatus || body.callStatus || "";
      } catch {
        console.error("Failed to parse missed-call-handler body:", text.substring(0, 200));
      }
    }

    const normalizedFrom = normalizePhoneNumber(fromNumber);
    const normalizedTo = normalizePhoneNumber(toNumber);

    console.log(`Missed call: from=${normalizedFrom} to=${normalizedTo} status=${callStatus} sid=${callSid}`);

    // Look up company by the called number
    const { data: integration } = await supabase
      .from("tenant_integrations")
      .select("company_id, signalwire_project_id, signalwire_api_token, signalwire_phone_number, signalwire_space_url")
      .eq("signalwire_phone_number", normalizedTo)
      .maybeSingle();

    if (!integration) {
      console.log("No company found for number:", normalizedTo);
      return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
        headers: { ...corsHeaders, "Content-Type": "application/xml" },
      });
    }

    const companyId = integration.company_id;

    // Log the missed call
    await supabase.from("call_logs").insert({
      company_id: companyId,
      direction: "inbound",
      status: "missed",
      from_number: normalizedFrom,
      to_number: normalizedTo,
      customer_phone: normalizedFrom,
      call_sid: callSid,
      purpose: "missed_call",
      started_at: new Date().toISOString(),
    });

    // Fetch company settings including script templates
    const { data: company } = await supabase
      .from("companies")
      .select("missed_call_action, name, missed_call_sms_template, missed_call_callback_script")
      .eq("id", companyId)
      .single();

    const missedCallAction = company?.missed_call_action || "none";
    const companyName = company?.name || "Our company";

    if (missedCallAction === "none") {
      return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
        headers: { ...corsHeaders, "Content-Type": "application/xml" },
      });
    }

    const { signalwire_project_id, signalwire_api_token, signalwire_phone_number, signalwire_space_url } = integration;

    // Send SMS for sms_only or callback_then_sms
    if (missedCallAction === "sms_only" || missedCallAction === "callback_then_sms") {
      if (signalwire_project_id && signalwire_api_token && signalwire_space_url) {
        const smsUrl = `https://${signalwire_space_url}/api/laml/2010-04-01/Accounts/${signalwire_project_id}/Messages.json`;
        const authHeader = "Basic " + btoa(`${signalwire_project_id}:${signalwire_api_token}`);
        const defaultSms = `Hi, we noticed we missed your call at ${companyName}. How can we help? Reply to this message or call us back at your convenience.`;
        const smsBody = company?.missed_call_sms_template
          ? company.missed_call_sms_template.replace(/\{companyName\}/g, companyName)
          : defaultSms;

        const smsParams = new URLSearchParams({
          From: normalizePhoneNumber(signalwire_phone_number),
          To: normalizedFrom,
          Body: smsBody,
        });

        const smsResponse = await fetch(smsUrl, {
          method: "POST",
          headers: {
            Authorization: authHeader,
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
          },
          body: smsParams.toString(),
        });

        if (!smsResponse.ok) {
          const errText = await smsResponse.text();
          console.error("Failed to send missed call SMS:", smsResponse.status, errText);
        } else {
          console.log("Missed call SMS sent to:", normalizedFrom);

          // Log SMS
          await supabase.from("sms_logs").insert({
            company_id: companyId,
            direction: "outbound",
            from_number: normalizePhoneNumber(signalwire_phone_number),
            to_number: normalizedFrom,
            body: smsBody,
            status: "sent",
          });
        }
      }
    }

    // Trigger callback for callback_only or callback_then_sms
    if (missedCallAction === "callback_only" || missedCallAction === "callback_then_sms") {
      try {
        const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
        const callbackResponse = await fetch(`${supabaseUrl}/functions/v1/outbound-call`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${anonKey}`,
            apikey: anonKey,
          },
          body: JSON.stringify({
            companyId,
            phone: normalizedFrom,
            name: "Missed Caller",
            purpose: "missed_call_callback",
            message: company?.missed_call_callback_script
              ? company.missed_call_callback_script.replace(/\{companyName\}/g, companyName)
              : `Hello, this is ${companyName} returning your call. We noticed we missed your call and wanted to follow up. How can we help you today?`,
          }),
        });

        if (!callbackResponse.ok) {
          const errText = await callbackResponse.text();
          console.error("Failed to initiate callback:", callbackResponse.status, errText);
        } else {
          console.log("Callback initiated for:", normalizedFrom);
        }
      } catch (e) {
        console.error("Callback error:", e);
      }
    }

    return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      headers: { ...corsHeaders, "Content-Type": "application/xml" },
    });
  } catch (e) {
    console.error("missed-call-handler error:", e);
    return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      headers: { ...corsHeaders, "Content-Type": "application/xml" },
    });
  }
});
