// send-campaign v2 — force redeploy + clearer errors
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function render(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
}

function wrapLinks(html: string, sendId: string, trackBase: string): string {
  return html.replace(/href="(https?:\/\/[^"]+)"/g, (_m, url) => {
    const tracked = `${trackBase}?id=${sendId}&e=click&u=${encodeURIComponent(url)}`;
    return `href="${tracked}"`;
  });
}

function splitName(name?: string | null) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  return { firstName: parts[0] || '', lastName: parts.slice(1).join(' ') };
}

function clean(value?: string | null) {
  return (value || '').trim();
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function isValidEmail(value: string): boolean {
  if (!value) return false;
  const v = value.toLowerCase();
  if (v.endsWith('@noemail.placeholder') || v.endsWith('@phone.placeholder')) return false;
  return EMAIL_RE.test(value);
}
function normalizePhone(value: string): string | null {
  const digits = (value || '').replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return null;
}
function sanitizeSubject(value: string): string {
  return (value || '').replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  console.log('[send-campaign] request received', req.method);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const supaUrl = Deno.env.get('SUPABASE_URL')!;
  const trackBase = `${supaUrl}/functions/v1/campaign-track`;

  try {
    let body: any = {};
    try { body = await req.json(); } catch { throw new Error('Invalid JSON body'); }
    const { campaignId, dryRun = false } = body || {};
    if (!campaignId) throw new Error('campaignId required');
    console.log('[send-campaign] campaignId', campaignId, 'dryRun', dryRun);

    const { data: campaign, error: cErr } = await supabase
      .from('marketing_campaigns')
      .select('*')
      .eq('id', campaignId)
      .maybeSingle();
    if (cErr || !campaign) throw new Error('Campaign not found');

    const companyId: string = campaign.company_id;
    const channels: string[] = campaign.channels || [];
    const segment: string = campaign.target_segment || 'all';

    // Resolve recipients — strictly scoped to the campaign's company_id.
    // Customer rows come from customer_profiles; lead rows come from leads.
    // 'all', 'new', 'vip', 'inactive' = customers only (existing behavior).
    // 'leads' = leads only. 'leads_and_customers' = union, deduped by email/phone.
    const includeCustomers = segment !== 'leads';
    const includeLeads = segment === 'leads' || segment === 'leads_and_customers';

    let recipients: any[] = [];

    if (includeCustomers) {
      let query = supabase
        .from('customer_profiles')
        .select('id, company_id, name, email, phone, email_opt_out, sms_opt_out, created_at, intake_data')
        .eq('company_id', companyId);
      if (segment === 'new') {
        const cutoff = new Date(Date.now() - 30 * 86400_000).toISOString();
        query = query.gte('created_at', cutoff);
      }
      const { data, error } = await query.limit(2000);
      if (error) throw error;
      for (const c of data || []) {
        recipients.push({ ...c, _source: 'customer' });
      }
    }

    if (includeLeads) {
      const { data, error } = await supabase
        .from('leads')
        .select('id, company_id, name, email, phone, created_at, intake_data')
        .eq('company_id', companyId)
        .limit(2000);
      if (error) throw error;
      for (const l of data || []) {
        // Leads don't have opt-out columns yet — treat as opt-in.
        recipients.push({ ...l, email_opt_out: false, sms_opt_out: false, _source: 'lead' });
      }
    }

    // Dedupe across customers + leads by normalized email / phone
    if (includeCustomers && includeLeads) {
      const seen = new Set<string>();
      recipients = recipients.filter((r: any) => {
        const emailKey = clean(r.email).toLowerCase();
        const phoneKey = clean(r.phone).replace(/\D/g, '');
        const key = `${emailKey}|${phoneKey}`;
        if (!emailKey && !phoneKey) return true;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    if (segment === 'vip') {
      recipients = recipients.filter((c: any) => {
        const data = c.intake_data || {};
        return ['vip', 'loyalty', 'preferred'].includes(String(data.lifecycle_stage || data.segment || data.customer_type || '').toLowerCase());
      });
    }

    if (segment === 'inactive') {
      const cutoff = new Date(Date.now() - 90 * 86400_000).toISOString();
      const { data: recentAppointments, error: apptErr } = await supabase
        .from('appointments')
        .select('customer_email, customer_phone')
        .eq('company_id', companyId)
        .gte('datetime', cutoff)
        .limit(5000);
      if (apptErr) throw apptErr;
      const activeContacts = new Set<string>();
      for (const appt of recentAppointments || []) {
        if (appt.customer_email) activeContacts.add(String(appt.customer_email).toLowerCase());
        if (appt.customer_phone) activeContacts.add(String(appt.customer_phone).replace(/\D/g, ''));
      }
      recipients = recipients.filter((c: any) => {
        const emailKey = clean(c.email).toLowerCase();
        const phoneKey = clean(c.phone).replace(/\D/g, '');
        return !activeContacts.has(emailKey) && !activeContacts.has(phoneKey);
      });
    }

    // Defense-in-depth: drop anything whose company_id doesn't match the campaign.
    recipients = recipients.filter((r: any) => r.company_id === companyId);

    const reachableCount = recipients.reduce((count: number, c: any) => {
      const canEmail = channels.includes('email') && clean(c.email) && c.email_opt_out !== true;
      const canSms = channels.includes('sms') && clean(c.phone) && c.sms_opt_out !== true;
      return count + (canEmail ? 1 : 0) + (canSms ? 1 : 0);
    }, 0);

    if (!channels.includes('email') && !channels.includes('sms')) {
      return new Response(JSON.stringify({ error: 'No delivery channels selected for this campaign.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!reachableCount && !dryRun) {
      return new Response(JSON.stringify({
        error: `No reachable recipients found. Add customers with ${channels.join(' or ')} contact info and opt-in enabled, or choose a broader segment.`,
        recipientCount: recipients.length,
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (dryRun) {
      return new Response(JSON.stringify({ recipientCount: recipients.length, reachableCount, channels }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let sent = 0;
    let failed = 0;
    let skipped = 0;
    const byChannel: Record<string, { sent: number; failed: number; skipped: number }> = {
      email: { sent: 0, failed: 0, skipped: 0 },
      sms: { sent: 0, failed: 0, skipped: 0 },
    };
    let firstSmsError: string | null = null;
    const logs: any[] = [];

    for (const c of recipients) {
      const { firstName } = splitName(c.name);
      const name = clean(c.name) || 'there';
      const vars = {
        customer_name: name,
        first_name: firstName || 'there',
        promo_code: campaign.promo_code || '',
        discount: campaign.discount_value
          ? `${campaign.discount_value}${campaign.discount_type === 'percent' ? '%' : '$'}`
          : '',
      };
      const message = render(campaign.message_template || '', vars);
      const subject = sanitizeSubject(render(campaign.email_subject || campaign.name || 'A message for you', vars));
      const smsBody = render(campaign.sms_template || campaign.message_template || '', vars);

      const email = clean(c.email);
      if (channels.includes('email') && email && c.email_opt_out !== true) {
        if (!isValidEmail(email)) {
          skipped++;
          byChannel.email.skipped++;
          logs.push({ id: crypto.randomUUID(), campaign_id: campaignId, company_id: companyId, customer_id: c.id, customer_name: name, recipient: email, channel: 'email', status: 'skipped', error: 'invalid_email' });
        } else {
        try {
          const sendId = crypto.randomUUID();
          const baseHtml = `<div style="font-family:system-ui,sans-serif;line-height:1.5">${message.replace(/\n/g, '<br/>')}</div>`;
          const trackedHtml = wrapLinks(baseHtml, sendId, trackBase);
          const pixel = `<img src="${trackBase}?id=${sendId}&e=open" width="1" height="1" alt="" style="display:none" />`;
          const html = `${trackedHtml}${pixel}`;
          const res = await supabase.functions.invoke('send-email-guarded', {
            body: { companyId, to: email, subject, html, text: message, template: 'marketing_campaign' },
          });
          const ok = !res.error && (res.data as any)?.sent !== false;
          logs.push({
            id: sendId,
            campaign_id: campaignId, company_id: companyId, customer_id: c.id,
            customer_name: name, recipient: email, channel: 'email',
            status: ok ? 'sent' : 'failed',
            error: ok ? null : (res.error?.message || (res.data as any)?.error || (res.data as any)?.reason || 'unknown'),
          });
          if (ok) { sent++; byChannel.email.sent++; } else { failed++; byChannel.email.failed++; }
        } catch (e) {
          failed++;
          byChannel.email.failed++;
          logs.push({ id: crypto.randomUUID(), campaign_id: campaignId, company_id: companyId, customer_id: c.id, customer_name: name, recipient: email, channel: 'email', status: 'failed', error: String(e) });
        }
        }
      }

      const rawPhone = clean(c.phone);
      if (channels.includes('sms') && rawPhone && c.sms_opt_out !== true) {
        const phone = normalizePhone(rawPhone);
        if (!phone) {
          skipped++;
          byChannel.sms.skipped++;
          logs.push({ id: crypto.randomUUID(), campaign_id: campaignId, company_id: companyId, customer_id: c.id, customer_name: name, recipient: rawPhone, channel: 'sms', status: 'skipped', error: 'invalid_phone' });
        } else {
        try {
          const res = await supabase.functions.invoke('send-appointment-sms', {
            body: { companyId, customerPhone: phone, customerName: name, message: smsBody },
          });
          const ok = !res.error && (res.data as any)?.success !== false;
          const errMsg = ok ? null : (res.error?.message || (res.data as any)?.error || (res.data as any)?.reason || 'unknown');
          logs.push({
            id: crypto.randomUUID(),
            campaign_id: campaignId, company_id: companyId, customer_id: c.id,
            customer_name: name, recipient: phone, channel: 'sms',
            status: ok ? 'sent' : 'failed',
            error: errMsg,
          });
          if (ok) { sent++; byChannel.sms.sent++; } else {
            failed++;
            byChannel.sms.failed++;
            if (!firstSmsError && errMsg) firstSmsError = errMsg;
          }
        } catch (e) {
          failed++;
          byChannel.sms.failed++;
          if (!firstSmsError) firstSmsError = String(e);
          logs.push({ id: crypto.randomUUID(), campaign_id: campaignId, company_id: companyId, customer_id: c.id, customer_name: name, recipient: phone, channel: 'sms', status: 'failed', error: String(e) });
        }
        }
      }
    }

    if (logs.length) {
      const { error: logErr } = await supabase.from('campaign_sends').insert(logs);
      if (logErr) throw logErr;
    }

    if (sent === 0 && failed === 0 && skipped > 0) {
      return new Response(JSON.stringify({
        error: `No valid recipients — ${skipped} customers had missing or invalid contact info.`,
        sent, failed, skipped, recipientCount: recipients.length,
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (sent === 0 && failed > 0) {
      const firstError = logs.find((log) => log.status === 'failed')?.error || '';
      let friendly = `Campaign attempted but nothing was delivered.${firstError ? ` First error: ${firstError}` : ''}`;
      if (/verified caller id/i.test(firstError)) {
        friendly = 'SignalWire rejected SMS — your SignalWire account must verify recipient numbers (trial-account limit) or upgrade to a paid plan.';
      }
      return new Response(JSON.stringify({
        error: friendly,
        sent, failed, skipped, recipientCount: recipients.length,
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    await supabase
      .from('marketing_campaigns')
      .update({
        status: 'active',
        total_sent: (campaign.total_sent || 0) + sent,
        last_sent_at: new Date().toISOString(),
      })
      .eq('id', campaignId);

    return new Response(JSON.stringify({
      sent, failed, skipped,
      recipientCount: recipients.length,
      byChannel,
      firstSmsError,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[send-campaign] error', e);
    return new Response(JSON.stringify({ error: String(e instanceof Error ? e.message : e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});