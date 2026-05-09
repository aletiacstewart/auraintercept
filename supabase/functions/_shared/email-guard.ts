// Shared email send guard.
// Enforces per-company + platform-wide daily/monthly Resend caps,
// logs every attempt, and notifies admins at 80% / 100% thresholds.
//
// Usage from any edge function:
//   import { sendGuardedEmail } from '../_shared/email-guard.ts';
//   const result = await sendGuardedEmail({
//     supabase, resendApiKey, companyId,
//     to, from, subject, html,
//     template: 'appointment_confirmation',
//     priority: 'normal', // or 'critical' to bypass cap
//   });
//   if (!result.sent) { /* fall back */ }

import { Resend } from 'https://esm.sh/resend@4.0.0';

const DEFAULT_DAILY_CAP = Number(Deno.env.get('RESEND_DAILY_CAP') ?? '100');
const DEFAULT_MONTHLY_CAP = Number(Deno.env.get('RESEND_MONTHLY_CAP') ?? '3000');

export type EmailPriority = 'normal' | 'critical';

export interface SendGuardedEmailArgs {
  // deno-lint-ignore no-explicit-any
  supabase: any;
  resendApiKey: string;
  companyId: string | null;
  to: string | string[];
  from: string;
  subject: string;
  html: string;
  text?: string;
  template?: string;
  priority?: EmailPriority;
}

export interface SendGuardedEmailResult {
  sent: boolean;
  reason?: string;
  // deno-lint-ignore no-explicit-any
  data?: any;
  // deno-lint-ignore no-explicit-any
  error?: any;
  dailyCount?: number;
  monthlyCount?: number;
  dailyCap?: number;
  monthlyCap?: number;
}

async function resolveCaps(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  companyId: string | null,
): Promise<{ daily: number; monthly: number }> {
  if (!companyId) return { daily: DEFAULT_DAILY_CAP, monthly: DEFAULT_MONTHLY_CAP };
  try {
    const { data } = await supabase
      .from('companies')
      .select('email_caps')
      .eq('id', companyId)
      .maybeSingle();
    const caps = (data?.email_caps ?? {}) as { daily?: number; monthly?: number };
    return {
      daily: typeof caps.daily === 'number' ? caps.daily : DEFAULT_DAILY_CAP,
      monthly: typeof caps.monthly === 'number' ? caps.monthly : DEFAULT_MONTHLY_CAP,
    };
  } catch {
    return { daily: DEFAULT_DAILY_CAP, monthly: DEFAULT_MONTHLY_CAP };
  }
}

async function logAttempt(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  row: {
    company_id: string | null;
    to_email: string;
    template?: string;
    status: string;
    reason?: string;
    priority: string;
  },
) {
  try {
    await supabase.from('email_send_attempts').insert(row);
  } catch (e) {
    console.error('[email-guard] log insert failed:', e);
  }
}

async function maybeNotifyThreshold(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  companyId: string | null,
  dailyCount: number,
  dailyCap: number,
  monthlyCount: number,
  monthlyCap: number,
) {
  const dailyPct = dailyCap > 0 ? dailyCount / dailyCap : 0;
  const monthlyPct = monthlyCap > 0 ? monthlyCount / monthlyCap : 0;
  const crossed: string[] = [];
  if (dailyPct >= 1) crossed.push(`Daily email cap reached (${dailyCount}/${dailyCap})`);
  else if (dailyPct >= 0.8) crossed.push(`Daily email usage at ${Math.round(dailyPct * 100)}% (${dailyCount}/${dailyCap})`);
  if (monthlyPct >= 1) crossed.push(`Monthly email cap reached (${monthlyCount}/${monthlyCap})`);
  else if (monthlyPct >= 0.8) crossed.push(`Monthly email usage at ${Math.round(monthlyPct * 100)}% (${monthlyCount}/${monthlyCap})`);
  if (!crossed.length) return;

  // Fire-and-forget to staff notification function. Do not block the send.
  try {
    const url = `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-staff-notification`;
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        companyId,
        title: 'Email cap warning',
        body: crossed.join(' · '),
        category: 'billing',
        severity: dailyPct >= 1 || monthlyPct >= 1 ? 'high' : 'medium',
      }),
    }).catch(() => {});
  } catch { /* noop */ }
}

export async function sendGuardedEmail(args: SendGuardedEmailArgs): Promise<SendGuardedEmailResult> {
  const {
    supabase, resendApiKey, companyId,
    to, from, subject, html, text, template,
    priority = 'normal',
  } = args;
  const recipient = Array.isArray(to) ? to[0] : to;

  if (!resendApiKey) {
    await logAttempt(supabase, {
      company_id: companyId, to_email: recipient, template,
      status: 'failed', reason: 'missing_resend_key', priority,
    });
    return { sent: false, reason: 'missing_resend_key' };
  }

  const caps = await resolveCaps(supabase, companyId);

  // Atomic check + increment
  const { data: gate, error: gateErr } = await supabase.rpc('increment_email_usage', {
    p_company_id: companyId,
    p_daily_cap: caps.daily,
    p_monthly_cap: caps.monthly,
  });
  if (gateErr) {
    console.error('[email-guard] increment_email_usage error:', gateErr);
  }
  const row = Array.isArray(gate) ? gate[0] : gate;
  const allowed: boolean = row?.allowed ?? true; // if RPC fails, allow but log
  const reason: string | undefined = row?.reason;
  const dailyCount: number = row?.daily_count ?? 0;
  const monthlyCount: number = row?.monthly_count ?? 0;

  if (!allowed && priority !== 'critical') {
    await logAttempt(supabase, {
      company_id: companyId, to_email: recipient, template,
      status: reason === 'monthly_cap_reached' ? 'blocked_monthly' : 'blocked_daily',
      reason, priority,
    });
    await maybeNotifyThreshold(supabase, companyId, dailyCount, caps.daily, monthlyCount, caps.monthly);
    return {
      sent: false, reason,
      dailyCount, monthlyCount, dailyCap: caps.daily, monthlyCap: caps.monthly,
    };
  }

  const overrideUsed = !allowed && priority === 'critical';
  const resend = new Resend(resendApiKey);
  const { data, error } = await resend.emails.send({
    from, to: Array.isArray(to) ? to : [to], subject, html, text,
  });

  if (error) {
    await logAttempt(supabase, {
      company_id: companyId, to_email: recipient, template,
      status: 'failed', reason: String(error?.message ?? error), priority,
    });
    return { sent: false, error, reason: 'resend_error' };
  }

  await logAttempt(supabase, {
    company_id: companyId, to_email: recipient, template,
    status: overrideUsed ? 'overridden_critical' : 'sent', priority,
  });
  await maybeNotifyThreshold(supabase, companyId, dailyCount, caps.daily, monthlyCount, caps.monthly);

  return {
    sent: true, data,
    dailyCount, monthlyCount, dailyCap: caps.daily, monthlyCap: caps.monthly,
  };
}