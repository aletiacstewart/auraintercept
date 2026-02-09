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
    const { phoneNumber, callScript, companyId } = await req.json();

    if (!phoneNumber || !companyId) {
      return new Response(JSON.stringify({ error: "phoneNumber and companyId are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalizedPhone = normalizePhoneNumber(phoneNumber);

    // Fetch SignalWire credentials
    const { data: integration } = await supabase
      .from("tenant_integrations")
      .select("signalwire_project_id, signalwire_api_token, signalwire_phone_number, signalwire_space_url")
      .eq("company_id", companyId)
      .maybeSingle();

    if (!integration?.signalwire_project_id || !integration?.signalwire_api_token || !integration?.signalwire_phone_number || !integration?.signalwire_space_url) {
      return new Response(JSON.stringify({ error: "SignalWire credentials not configured" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { signalwire_project_id, signalwire_api_token, signalwire_phone_number, signalwire_space_url } = integration;

    // Pre-insert call log
    const { data: callLog, error: logError } = await supabase
      .from("call_logs")
      .insert({
        company_id: companyId,
        direction: "outbound",
        status: "initiating",
        from_number: signalwire_phone_number,
        to_number: normalizedPhone,
        customer_phone: normalizedPhone,
        purpose: "test_reminder",
        metadata: { call_script: callScript || "This is a test voice reminder." },
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (logError || !callLog) {
      console.error("Failed to create call log:", logError);
      throw new Error("Failed to create call log");
    }

    const callLogId = callLog.id;

    // Build webhook URL
    const webhookUrl = `${supabaseUrl}/functions/v1/voice-handler?action=outbound&callLogId=${callLogId}`;
    const statusUrl = `${supabaseUrl}/functions/v1/voice-handler?action=status`;

    // Initiate call via SignalWire
    const signalwireUrl = `https://${signalwire_space_url}/api/laml/2010-04-01/Accounts/${signalwire_project_id}/Calls.json`;
    const authHeader = "Basic " + btoa(`${signalwire_project_id}:${signalwire_api_token}`);

    const callParams = new URLSearchParams({
      From: normalizePhoneNumber(signalwire_phone_number),
      To: normalizedPhone,
      Url: webhookUrl,
      StatusCallback: statusUrl,
      StatusCallbackEvent: "initiated ringing answered completed",
      Method: "POST",
    });

    const callResponse = await fetch(signalwireUrl, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: callParams.toString(),
    });

    if (!callResponse.ok) {
      const errText = await callResponse.text();
      console.error("SignalWire call failed:", callResponse.status, errText);
      await supabase.from("call_logs").update({ status: "failed" }).eq("id", callLogId);
      throw new Error(`SignalWire call failed: ${callResponse.status}`);
    }

    // Parse response defensively
    const respText = await callResponse.text();
    let callSid = "";
    try {
      const respData = JSON.parse(respText);
      callSid = respData.sid || "";
    } catch {
      console.log("SignalWire response not JSON, treating as success");
    }

    if (callSid) {
      await supabase.from("call_logs").update({ call_sid: callSid, status: "initiated" }).eq("id", callLogId);
    }

    return new Response(JSON.stringify({ success: true, callLogId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("test-voice-reminder error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
