import { createClient } from "npm:@supabase/supabase-js@2";
import { loadIndustryPackForCompany, applyTerminology } from "../_shared/industry-pack.ts";
import { sendGuardedSms, normalizeE164US } from "../_shared/sms-guard.ts";

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const bodyText = await req.text();
    let payload: any;
    try {
      payload = JSON.parse(bodyText);
    } catch {
      throw new Error('Invalid JSON body');
    }

    const { companyId, customerPhone, customerName, message: rawMessage, appointmentId } = payload;

    if (!companyId) throw new Error('companyId is required');
    if (!customerPhone) throw new Error('customerPhone is required');
    if (!rawMessage) throw new Error('message is required');

    // Apply industry-aware terminology (no-op if message has no placeholders)
    const pack = await loadIndustryPackForCompany(supabase, companyId);
    const message = applyTerminology(rawMessage, pack);

    const normalizedPhone = normalizeE164US(customerPhone) || normalizePhoneNumber(customerPhone);

    // Check SMS opt-out
    const { data: profile } = await supabase
      .from('customer_profiles')
      .select('sms_opt_out')
      .eq('company_id', companyId)
      .eq('phone', normalizedPhone)
      .maybeSingle();

    if (profile?.sms_opt_out) {
      console.log(`Customer ${normalizedPhone} has opted out of SMS`);
      return new Response(
        JSON.stringify({ success: false, reason: 'Customer opted out of SMS' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch From number for the guard. Guard pulls credentials itself.
    const { data: integration } = await supabase
      .from('tenant_integrations')
      .select('signalwire_phone_number')
      .eq('company_id', companyId)
      .maybeSingle();
    const fromNumber = integration?.signalwire_phone_number || '';

    const result = await sendGuardedSms({
      supabase,
      companyId,
      from: fromNumber,
      to: normalizedPhone || customerPhone,
      body: message,
      source: 'reminder',
      appointmentId: appointmentId || null,
      customerName: customerName || null,
    });

    return new Response(
      JSON.stringify({
        success: result.ok,
        messageSid: result.providerMessageId || null,
        status: result.status,
        error: result.ok ? undefined : result.error,
        provider_code: result.providerCode || null,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Send SMS error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
