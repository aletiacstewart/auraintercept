import { createClient } from "npm:@supabase/supabase-js@2";
import { sendGuardedSms, normalizeE164US } from "../_shared/sms-guard.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function runHealthCheck(supabase: any, companyId: string) {
  const { data: integ } = await supabase
    .from('tenant_integrations')
    .select('signalwire_project_id, signalwire_api_token, signalwire_space_url, signalwire_phone_number')
    .eq('company_id', companyId)
    .maybeSingle();

  if (!integ?.signalwire_project_id || !integ?.signalwire_api_token || !integ?.signalwire_space_url) {
    return { ok: false, error: 'SignalWire is not configured for this company.' };
  }

  const space = integ.signalwire_space_url;
  const project = integ.signalwire_project_id;
  const from = integ.signalwire_phone_number || '';
  const auth = 'Basic ' + btoa(`${project}:${integ.signalwire_api_token}`);
  const headers = { Authorization: auth, Accept: 'application/json' };
  const base = `https://${space}/api/laml/2010-04-01/Accounts/${project}`;

  const result: any = {
    ok: true,
    space,
    project_id_masked: project.slice(0, 8) + '…' + project.slice(-4),
    from_number: from,
    account: null,
    from_number_owned: false,
    from_number_sms_capable: false,
    incoming_numbers: [] as Array<{ phone_number: string; sms: boolean; voice: boolean; friendly_name: string }>,
    errors: [] as string[],
  };

  // 1. Account info
  try {
    const r = await fetch(`${base}.json`, { headers });
    const text = await r.text();
    let body: any = {};
    try { body = JSON.parse(text); } catch { /* ignore */ }
    if (!r.ok) {
      result.errors.push(`Account lookup failed: HTTP ${r.status} ${body?.message || text.slice(0, 200)}`);
    } else {
      result.account = {
        friendly_name: body.friendly_name,
        type: body.type, // "Trial" | "Full"
        status: body.status,
      };
    }
  } catch (e: any) {
    result.errors.push(`Account lookup threw: ${e?.message || String(e)}`);
  }

  // 2. Incoming phone numbers
  try {
    const r = await fetch(`${base}/IncomingPhoneNumbers.json?PageSize=100`, { headers });
    const text = await r.text();
    let body: any = {};
    try { body = JSON.parse(text); } catch { /* ignore */ }
    if (!r.ok) {
      result.errors.push(`Phone number lookup failed: HTTP ${r.status} ${body?.message || text.slice(0, 200)}`);
    } else {
      const list = body.incoming_phone_numbers || [];
      result.incoming_numbers = list.map((n: any) => ({
        phone_number: n.phone_number,
        sms: !!n.capabilities?.sms,
        voice: !!n.capabilities?.voice,
        friendly_name: n.friendly_name,
      }));
      const fromDigits = from.replace(/\D/g, '').slice(-10);
      const match = result.incoming_numbers.find(
        (n: any) => (n.phone_number || '').replace(/\D/g, '').slice(-10) === fromDigits,
      );
      result.from_number_owned = !!match;
      result.from_number_sms_capable = !!match?.sms;
    }
  } catch (e: any) {
    result.errors.push(`Phone number lookup threw: ${e?.message || String(e)}`);
  }

  // Diagnosis hints
  const hints: string[] = [];
  if (result.account?.type && result.account.type !== 'Full') {
    hints.push(`The connected Space reports account type "${result.account.type}". This Space is not on a paid plan — upgrade THIS Space (the upgrade may have happened on a different Space).`);
  }
  if (!result.from_number_owned && result.incoming_numbers.length > 0) {
    hints.push(`The From number ${from} is NOT owned by project ${result.project_id_masked}. SignalWire will reject sends with code 10000. Either move the number to this project, or update Aura's credentials to the project that owns ${from}.`);
  }
  if (result.from_number_owned && !result.from_number_sms_capable) {
    hints.push(`The From number ${from} is owned by this project but does NOT have SMS capability enabled. Enable SMS on the number in SignalWire.`);
  }
  if (
    result.account?.type === 'Full' &&
    result.from_number_owned &&
    result.from_number_sms_capable &&
    hints.length === 0
  ) {
    hints.push(`Credentials, ownership, and SMS capability look correct. Code 10000 to non-verified US numbers almost certainly means the number is not attached to an approved A2P 10DLC Campaign in SignalWire. Register a Brand + Campaign and attach ${from}.`);
  }
  result.hints = hints;

  return result;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    const payload = await req.json();
    const { companyId, to, body, mode } = payload || {};
    if (!companyId) {
      return new Response(
        JSON.stringify({ ok: false, error: 'companyId is required' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (mode === 'health') {
      const health = await runHealthCheck(supabase, companyId);
      return new Response(JSON.stringify(health), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!to) {
      return new Response(
        JSON.stringify({ ok: false, error: 'to is required for send mode' }),
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

    // mode === 'verified' bypasses the Aura allowlist so the caller can test
    // a SignalWire-verified number that may not exist in Leads/Customers.
    let result;
    if (mode === 'verified') {
      result = await sendDirectSignalWire(supabase, companyId, integ?.signalwire_phone_number || '', normalized, message);
    } else {
      result = await sendGuardedSms({
        supabase,
        companyId,
        from: integ?.signalwire_phone_number || '',
        to: normalized,
        body: message,
        source: 'campaign',
      });
    }

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

// Direct send that skips the contacts allowlist — for verifying delivery
// to a SignalWire-verified caller ID. Still logs to sms_logs.
async function sendDirectSignalWire(
  supabase: any,
  companyId: string,
  rawFrom: string,
  to: string,
  message: string,
) {
  const from = normalizeE164US(rawFrom) || rawFrom;
  const { data: integ } = await supabase
    .from('tenant_integrations')
    .select('signalwire_project_id, signalwire_api_token, signalwire_space_url')
    .eq('company_id', companyId)
    .maybeSingle();

  if (!integ?.signalwire_project_id || !integ?.signalwire_api_token || !integ?.signalwire_space_url) {
    return { ok: false, status: 'failed' as const, to, error: 'SignalWire not configured', providerCode: undefined, providerMessageId: undefined };
  }

  const url = `https://${integ.signalwire_space_url}/api/laml/2010-04-01/Accounts/${integ.signalwire_project_id}/Messages.json`;
  const auth = 'Basic ' + btoa(`${integ.signalwire_project_id}:${integ.signalwire_api_token}`);
  const params = new URLSearchParams({ From: from, To: to, Body: message });

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { Authorization: auth, 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: params.toString(),
    });
    const text = await resp.text();
    let payload: any = {};
    try { payload = JSON.parse(text); } catch { /* ignore */ }

    const baseLog = {
      company_id: companyId,
      from_number: from,
      to_number: to,
      message,
      direction: 'outbound' as const,
      source: 'campaign' as const,
    };

    if (!resp.ok) {
      const code = payload?.code ? String(payload.code) : String(resp.status);
      const err = `SignalWire ${code}: ${payload?.message || text}`;
      await supabase.from('sms_logs').insert({
        ...baseLog,
        status: 'failed',
        error: err,
        metadata: { provider: 'signalwire', provider_code: code, provider_status: resp.status, bypass_allowlist: true },
      });
      return { ok: false, status: 'failed' as const, to, error: err, providerCode: code, providerMessageId: undefined };
    }

    await supabase.from('sms_logs').insert({
      ...baseLog,
      status: 'sent',
      provider_message_id: payload?.sid || null,
      metadata: { provider: 'signalwire', bypass_allowlist: true },
    });
    return { ok: true, status: 'sent' as const, to, providerMessageId: payload?.sid, providerCode: undefined, error: undefined };
  } catch (e: any) {
    return { ok: false, status: 'failed' as const, to, error: e?.message || String(e), providerCode: undefined, providerMessageId: undefined };
  }
}