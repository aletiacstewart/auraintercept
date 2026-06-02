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

    // Resolve recipients from customers table
    let query = supabase
      .from('customers')
      .select('id, first_name, last_name, email, phone, mobile_phone, email_opt_in, sms_opt_in, lifecycle_stage, customer_since')
      .eq('company_id', companyId);

    if (segment === 'new') {
      const cutoff = new Date(Date.now() - 30 * 86400_000).toISOString();
      query = query.gte('customer_since', cutoff.slice(0, 10));
    } else if (segment === 'vip') {
      query = query.eq('lifecycle_stage', 'vip');
    } else if (segment === 'inactive') {
      query = query.eq('lifecycle_stage', 'inactive');
    }

    const { data: customers, error: custErr } = await query.limit(2000);
    if (custErr) throw custErr;
    const recipients = customers || [];

    if (dryRun) {
      return new Response(JSON.stringify({ recipientCount: recipients.length, channels }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let sent = 0;
    let failed = 0;
    const logs: any[] = [];

    for (const c of recipients) {
      const name = [c.first_name, c.last_name].filter(Boolean).join(' ') || 'there';
      const vars = {
        customer_name: name,
        first_name: c.first_name || 'there',
        promo_code: campaign.promo_code || '',
        discount: campaign.discount_value
          ? `${campaign.discount_value}${campaign.discount_type === 'percent' ? '%' : '$'}`
          : '',
      };
      const message = render(campaign.message_template || '', vars);
      const subject = render(campaign.email_subject || campaign.name || 'A message for you', vars);

      if (channels.includes('email') && c.email && c.email_opt_in !== false) {
        try {
          const sendId = crypto.randomUUID();
          const baseHtml = `<div style="font-family:system-ui,sans-serif;line-height:1.5">${message.replace(/\n/g, '<br/>')}</div>`;
          const trackedHtml = wrapLinks(baseHtml, sendId, trackBase);
          const pixel = `<img src="${trackBase}?id=${sendId}&e=open" width="1" height="1" alt="" style="display:none" />`;
          const html = `${trackedHtml}${pixel}`;
          const res = await supabase.functions.invoke('send-email-guarded', {
            body: { companyId, to: c.email, subject, html, text: message },
          });
          const ok = !res.error && (res.data as any)?.sent !== false;
          logs.push({
            id: sendId,
            campaign_id: campaignId, company_id: companyId, customer_id: c.id,
            customer_name: name, recipient: c.email, channel: 'email',
            status: ok ? 'sent' : 'failed',
            error: ok ? null : (res.error?.message || (res.data as any)?.error || 'unknown'),
          });
          ok ? sent++ : failed++;
        } catch (e) {
          failed++;
          logs.push({ campaign_id: campaignId, company_id: companyId, customer_id: c.id, customer_name: name, recipient: c.email, channel: 'email', status: 'failed', error: String(e) });
        }
      }

      const phone = c.mobile_phone || c.phone;
      if (channels.includes('sms') && phone && c.sms_opt_in !== false) {
        try {
          const res = await supabase.functions.invoke('send-appointment-sms', {
            body: { companyId, customerPhone: phone, customerName: name, message },
          });
          const ok = !res.error && (res.data as any)?.success !== false;
          logs.push({
            campaign_id: campaignId, company_id: companyId, customer_id: c.id,
            customer_name: name, recipient: phone, channel: 'sms',
            status: ok ? 'sent' : 'failed',
            error: ok ? null : (res.error?.message || (res.data as any)?.reason || 'unknown'),
          });
          ok ? sent++ : failed++;
        } catch (e) {
          failed++;
          logs.push({ campaign_id: campaignId, company_id: companyId, customer_id: c.id, customer_name: name, recipient: phone, channel: 'sms', status: 'failed', error: String(e) });
        }
      }
    }

    if (logs.length) await supabase.from('campaign_sends').insert(logs);

    await supabase
      .from('marketing_campaigns')
      .update({
        status: 'active',
        total_sent: (campaign.total_sent || 0) + sent,
        last_sent_at: new Date().toISOString(),
      })
      .eq('id', campaignId);

    return new Response(JSON.stringify({ sent, failed, recipientCount: recipients.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[send-campaign] error', e);
    return new Response(JSON.stringify({ error: String(e instanceof Error ? e.message : e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});