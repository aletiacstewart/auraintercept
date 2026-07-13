import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendGuardedEmail } from '../_shared/email-guard.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ADMIN_EMAIL = 'ai@auraintercept.ai';

function escapeHtml(v: unknown): string {
  return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

function renderFormHtml(data: Record<string, unknown>): string {
  const sections = Object.entries(data);
  if (!sections.length) return '<p><em>No form data submitted.</em></p>';
  return sections.map(([sectionKey, sectionVal]) => {
    const title = escapeHtml(sectionKey.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()));
    let body = '';
    if (sectionVal && typeof sectionVal === 'object' && !Array.isArray(sectionVal)) {
      const rows = Object.entries(sectionVal as Record<string, unknown>).map(([k, v]) => {
        const label = escapeHtml(k.replace(/_/g, ' '));
        const val = Array.isArray(v) ? v.map(escapeHtml).join(', ') : (typeof v === 'object' ? `<pre style="margin:0;font-size:12px">${escapeHtml(JSON.stringify(v, null, 2))}</pre>` : escapeHtml(v));
        return `<tr><td style="padding:6px 10px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:600;width:34%;vertical-align:top">${label}</td><td style="padding:6px 10px;border:1px solid #e5e7eb">${val}</td></tr>`;
      }).join('');
      body = `<table style="border-collapse:collapse;width:100%;font-size:13px;margin:8px 0 18px">${rows}</table>`;
    } else {
      body = `<p>${escapeHtml(JSON.stringify(sectionVal))}</p>`;
    }
    return `<h3 style="margin:18px 0 6px;color:#0f172a;font-size:15px;border-bottom:2px solid #0ea5a4;padding-bottom:4px">${title}</h3>${body}`;
  }).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const { token, form_data, signature } = await req.json();
    if (!token) return new Response(JSON.stringify({ error: 'token required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    if (!signature || !signature.signer_name || !signature.signer_title) {
      return new Response(JSON.stringify({ error: 'signature required (signer_name, signer_title)' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: invite } = await admin.from('onboarding_invites').select('*').eq('token', token).maybeSingle();
    if (!invite) return new Response(JSON.stringify({ error: 'invalid' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    if (invite.status === 'submitted') return new Response(JSON.stringify({ error: 'already_submitted' }), { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    if (new Date(invite.expires_at) < new Date()) return new Response(JSON.stringify({ error: 'expired' }), { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || '';
    const ua = req.headers.get('user-agent') || '';
    const submittedAt = new Date().toISOString();
    const fullSignature = { ...signature, ip, user_agent: ua, signed_at: submittedAt };

    await admin.from('onboarding_submissions').upsert({
      invite_id: invite.id, form_data: form_data ?? {}, signature: fullSignature, submitted_at: submittedAt,
    }, { onConflict: 'invite_id' });
    await admin.from('onboarding_invites').update({ status: 'submitted', submitted_at: submittedAt }).eq('id', invite.id);

    // Gather uploads + signed URLs
    const { data: uploads } = await admin.from('onboarding_uploads').select('section, file_name, storage_path, mime_type, size_bytes').eq('invite_id', invite.id);
    const uploadLinks: string[] = [];
    let signedPdfUrl: string | null = null;
    for (const u of uploads ?? []) {
      const { data: signed } = await admin.storage.from('onboarding-uploads').createSignedUrl(u.storage_path, 60 * 60 * 24 * 14);
      if (signed?.signedUrl) {
        uploadLinks.push(`<li><strong>${escapeHtml(u.section)}</strong>: <a href="${signed.signedUrl}">${escapeHtml(u.file_name)}</a> <span style="color:#64748b">(${Math.round((u.size_bytes || 0) / 1024)} KB)</span></li>`);
        if (u.section === 'signed_workbook' && !signedPdfUrl) signedPdfUrl = signed.signedUrl;
      }
    }
    const uploadsHtml = uploadLinks.length
      ? `<h3 style="margin:18px 0 6px;color:#0f172a;font-size:15px;border-bottom:2px solid #0ea5a4;padding-bottom:4px">Uploaded files (${uploadLinks.length})</h3><ul>${uploadLinks.join('')}</ul><p style="font-size:12px;color:#64748b">Download links expire in 14 days.</p>`
      : '<p><em>No files uploaded.</em></p>';

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:760px;margin:0 auto;color:#0f172a">
        <h2 style="margin:0 0 4px">New onboarding submission</h2>
        <p style="margin:0 0 16px;color:#475569"><strong>${escapeHtml(invite.company_name)}</strong> — ${escapeHtml(invite.recipient_email)}</p>
        <p style="font-size:12px;color:#64748b">Submitted ${escapeHtml(submittedAt)} · Signed by ${escapeHtml(signature.signer_name)} (${escapeHtml(signature.signer_title)}) · IP ${escapeHtml(ip)}</p>
        ${renderFormHtml(form_data ?? {})}
        ${uploadsHtml}
      </div>`;

    await sendGuardedEmail({
      supabase: admin,
      resendApiKey: Deno.env.get('RESEND_API_KEY') ?? '',
      companyId: null,
      to: ADMIN_EMAIL,
      from: 'Aura Intercept Onboarding <ai@auraintercept.ai>',
      subject: `New onboarding submission — ${invite.company_name}`,
      html,
      priority: 'high',
    });

    // Customer confirmation email with signed-PDF link + next steps.
    if (invite.recipient_email) {
      const customerHtml = `
        <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#0f172a">
          <h2 style="margin:0 0 8px">Your onboarding workbook was received ✓</h2>
          <p>Thanks${invite.company_name ? `, ${escapeHtml(invite.company_name)}` : ''}! We received your signed onboarding workbook on ${escapeHtml(submittedAt)}.</p>
          ${signedPdfUrl ? `<p><a href="${signedPdfUrl}" style="display:inline-block;background:#0ea5a4;color:white;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:600">Download your signed workbook (PDF)</a></p><p style="font-size:12px;color:#64748b">This download link expires in 14 days. Save a copy for your records.</p>` : ''}
          <h3 style="margin:24px 0 6px;font-size:15px">What happens next</h3>
          <ol style="line-height:1.6">
            <li>Within <strong>1 business day</strong>, your Aura Intercept Concierge will email to schedule your kickoff call.</li>
            <li>We'll review your workbook together and configure your 3rd-party accounts (SignalWire, ElevenLabs, Resend, Tavily, Stripe, A2P 10DLC, Social) using the logins + card you provide. Each provider invoices you directly and separately from your Aura plan fee.</li>
            <li>Your one-time onboarding fee is invoiced on day 31 of your 60-Day Live Trial (after concierge onboarding is complete).</li>
            <li>Your first monthly plan fee is charged on day 61 (after the full 60-Day Live Trial).</li>
            <li>Your platform goes live — the trial begins.</li>
          </ol>
          <p style="margin-top:18px;font-size:12px;color:#64748b">Questions before then? Reply to this email or write to ai@auraintercept.ai.</p>
        </div>`;
      await sendGuardedEmail({
        supabase: admin,
        resendApiKey: Deno.env.get('RESEND_API_KEY') ?? '',
        companyId: null,
        to: invite.recipient_email,
        from: 'Aura Intercept <ai@auraintercept.ai>',
        subject: `Workbook received — next steps for ${invite.company_name}`,
        html: customerHtml,
        priority: 'high',
      }).catch((e) => console.warn('[submit-onboarding] customer email failed', e));
    }

    return new Response(JSON.stringify({ ok: true, signed_pdf_url: signedPdfUrl }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('[submit-onboarding]', e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});