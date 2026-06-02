import { createClient } from "npm:@supabase/supabase-js@2";
import { sendGuardedSms, normalizeE164US } from "../_shared/sms-guard.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    const { companyId, to, body } = await req.json();
    if (!companyId || !to) {
      return new Response(
        JSON.stringify({ ok: false, error: 'companyId and to are required' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const normalized = normalizeE164US(to);
    if (!normalized) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Invalid US phone number' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const { data: integ } = await supabase
      .from('tenant_integrations')
      .select('signalwire_phone_number')
      .eq('company_id', companyId)
      .maybeSingle();

    const message = body || 'Aura Intercept test — please ignore.';
    console.log(`[sms-diagnostic] sending test to ${normalized} for company ${companyId}`);

    const result = await sendGuardedSms({
      supabase,
      companyId,
      from: integ?.signalwire_phone_number || '',
      to: normalized,
      body: message,
      source: 'campaign',
    });

    return new Response(
      JSON.stringify({
        ok: result.ok,
        status: result.status,
        to: result.to,
        error: result.error || null,
        providerCode: result.providerCode || null,
        providerMessageId: result.providerMessageId || null,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e: any) {
    console.error('[sms-diagnostic] error:', e);
    return new Response(
      JSON.stringify({ ok: false, error: e?.message || String(e) }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});