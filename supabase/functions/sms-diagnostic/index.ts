import { createClient } from "npm:@supabase/supabase-js@2";
import { sendGuardedSms, normalizeE164US } from "../_shared/sms-guard.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function runHealthCheck(supabase: any, companyId: string) {
  const { data: integ } = await supabase
    .from('tenant_integrations')
    .select('signalwire_project_id, signalwire_api_token, signalwire_space_url, signalwire_phone_number, signalwire_campaign_id, signalwire_csp_reference, signalwire_campaign_status, signalwire_campaign_number_attached, signalwire_campaign_synced_at, signalwire_campaign_last_error')
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
    ten_dlc: {
      campaign_id: integ.signalwire_campaign_id || null,
      csp_reference: integ.signalwire_csp_reference || null,
      status: integ.signalwire_campaign_status || null,
      number_attached: integ.signalwire_campaign_number_attached ?? null,
      synced_at: integ.signalwire_campaign_synced_at || null,
      last_error: integ.signalwire_campaign_last_error || null,
      configured: !!integ.signalwire_campaign_id,
    },
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
    if (!result.ten_dlc.configured) {
      hints.push(`Credentials, ownership, and SMS capability look correct. Aura does not yet know your A2P 10DLC Campaign ID. Paste it into Aura (or click "Sync 10DLC Status") so Aura can verify the campaign is approved and that ${from} is attached.`);
    } else if (result.ten_dlc.number_attached === false) {
      hints.push(`Aura's last 10DLC sync says campaign ${result.ten_dlc.campaign_id} exists but ${from} is NOT in its attached number list. Open the Campaign in SignalWire → Campaign Phone Numbers and add ${from}, then click "Sync 10DLC Status".`);
    } else if (result.ten_dlc.status && result.ten_dlc.status.toUpperCase() !== 'ACTIVE' && result.ten_dlc.status.toUpperCase() !== 'APPROVED') {
      hints.push(`Aura's last 10DLC sync shows campaign status "${result.ten_dlc.status}". SignalWire will keep rejecting non-verified recipients until the campaign reaches ACTIVE/APPROVED.`);
    } else if (result.ten_dlc.status && result.ten_dlc.number_attached) {
      hints.push(`10DLC campaign ${result.ten_dlc.campaign_id} is ${result.ten_dlc.status} and ${from} is attached. If sends are still failing with code 10000, the rejection is happening at the SignalWire enforcement layer despite registry approval — open a SignalWire ticket with the trace_id from any failed sms_logs row.`);
    } else {
      hints.push(`Click "Sync 10DLC Status" to pull the live campaign + number-assignment state from SignalWire.`);
    }
  }
  result.hints = hints;

  return result;
}

async function runCampaignSync(supabase: any, companyId: string, campaignIdOverride?: string, cspReferenceOverride?: string) {
  const { data: integ } = await supabase
    .from('tenant_integrations')
    .select('id, signalwire_project_id, signalwire_api_token, signalwire_space_url, signalwire_phone_number, signalwire_campaign_id, signalwire_csp_reference')
    .eq('company_id', companyId)
    .maybeSingle();

  if (!integ?.signalwire_project_id || !integ?.signalwire_api_token || !integ?.signalwire_space_url) {
    return { ok: false, error: 'SignalWire is not configured for this company.' };
  }

  const campaignId = (campaignIdOverride || integ.signalwire_campaign_id || '').trim();
  const cspReference = (cspReferenceOverride || integ.signalwire_csp_reference || '').trim() || null;

  if (!campaignId) {
    return { ok: false, error: 'A2P 10DLC Campaign ID is required. Paste it from SignalWire → Messaging → 10DLC → Campaigns.' };
  }

  const auth = 'Basic ' + btoa(`${integ.signalwire_project_id}:${integ.signalwire_api_token}`);
  const headers = { Authorization: auth, Accept: 'application/json' };
  const base = `https://${integ.signalwire_space_url}/api/relay/rest/registry/beta`;
  const fromDigits = (integ.signalwire_phone_number || '').replace(/\D/g, '').slice(-10);

  let campaign: any = null;
  let numbers: any[] = [];
  let lastError: string | null = null;

  try {
    const r = await fetch(`${base}/campaigns/${encodeURIComponent(campaignId)}`, { headers });
    const text = await r.text();
    let body: any = {};
    try { body = JSON.parse(text); } catch {}
    if (!r.ok) {
      lastError = `Campaign lookup failed: HTTP ${r.status} ${body?.message || text.slice(0, 200)}`;
    } else {
      campaign = body;
    }
  } catch (e: any) {
    lastError = `Campaign lookup threw: ${e?.message || String(e)}`;
  }

  try {
    const r = await fetch(`${base}/campaigns/${encodeURIComponent(campaignId)}/numbers?PageSize=200`, { headers });
    const text = await r.text();
    let body: any = {};
    try { body = JSON.parse(text); } catch {}
    if (!r.ok) {
      lastError = lastError || `Number assignment lookup failed: HTTP ${r.status} ${body?.message || text.slice(0, 200)}`;
    } else {
      // Response shape varies; accept either an array or { data: [...] } / { phone_numbers: [...] }
      numbers = body?.data || body?.phone_numbers || body?.numbers || (Array.isArray(body) ? body : []);
    }
  } catch (e: any) {
    lastError = lastError || `Number assignment lookup threw: ${e?.message || String(e)}`;
  }

  const status = campaign?.status || campaign?.campaign_status || campaign?.state || null;
  const attached = numbers.some((n: any) => {
    const p = (n?.phone_number || n?.number || n || '').toString().replace(/\D/g, '').slice(-10);
    return p && fromDigits && p === fromDigits;
  });

  await supabase
    .from('tenant_integrations')
    .update({
      signalwire_campaign_id: campaignId,
      signalwire_csp_reference: cspReference,
      signalwire_campaign_status: status,
      signalwire_campaign_number_attached: campaign ? attached : null,
      signalwire_campaign_synced_at: new Date().toISOString(),
      signalwire_campaign_last_error: lastError,
      signalwire_campaign_raw: { campaign, numbers_count: numbers.length, sample_numbers: numbers.slice(0, 10) },
    })
    .eq('id', integ.id);

  return {
    ok: !lastError,
    campaign_id: campaignId,
    csp_reference: cspReference,
    status,
    number_attached: campaign ? attached : null,
    attached_numbers_count: numbers.length,
    from_number: integ.signalwire_phone_number,
    error: lastError,
    synced_at: new Date().toISOString(),
  };
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

    if (mode === 'sync_10dlc') {
      const sync = await runCampaignSync(supabase, companyId, payload?.campaignId, payload?.cspReference);
      return new Response(JSON.stringify(sync), {
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