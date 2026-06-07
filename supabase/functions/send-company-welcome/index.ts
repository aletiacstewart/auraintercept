import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { PDFDocument, StandardFonts, rgb } from 'https://esm.sh/pdf-lib@1.17.1';
import { WORKBOOK_SECTIONS } from '../_shared/onboarding-workbook-sections.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SITE_URL = 'https://auraintercept.ai';
const FROM = 'Aura Intercept <ai@auraintercept.ai>';

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function wrapText(text: string, font: any, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const w of words) {
    const candidate = current ? `${current} ${w}` : w;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth) {
      if (current) lines.push(current);
      current = w;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

async function buildWorkbookPdf(companyName: string): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 612; // US Letter
  const pageHeight = 792;
  const margin = 54;
  const contentWidth = pageWidth - margin * 2;
  const teal = rgb(0.055, 0.647, 0.643);
  const ink = rgb(0.06, 0.09, 0.16);
  const subtle = rgb(0.4, 0.45, 0.55);
  const rule = rgb(0.82, 0.85, 0.9);

  let page = pdf.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const newPage = () => {
    page = pdf.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;
  };
  const ensure = (needed: number) => {
    if (y - needed < margin) newPage();
  };

  // Cover header
  page.drawText('AURA INTERCEPT', { x: margin, y, size: 10, font: bold, color: teal });
  y -= 26;
  page.drawText('Onboarding Workbook', { x: margin, y, size: 24, font: bold, color: ink });
  y -= 24;
  page.drawText(`Prepared for ${companyName}`, { x: margin, y, size: 12, font, color: subtle });
  y -= 20;
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  page.drawText(`Generated ${today}`, { x: margin, y, size: 10, font, color: subtle });
  y -= 28;
  page.drawLine({ start: { x: margin, y }, end: { x: pageWidth - margin, y }, thickness: 1, color: teal });
  y -= 24;

  const intro =
    'This printable workbook mirrors your online onboarding form at ' +
    `${SITE_URL}/onboarding. You can fill it out by hand and bring it to your kickoff call, ` +
    'or use it as a worksheet while you complete the online version. Your Concierge Onboarding ' +
    'specialist will walk through each section with you during the 60-Day Live Trial.';
  for (const line of wrapText(intro, font, 11, contentWidth)) {
    ensure(16);
    page.drawText(line, { x: margin, y, size: 11, font, color: ink });
    y -= 14;
  }
  y -= 12;

  for (const section of WORKBOOK_SECTIONS) {
    ensure(70);
    page.drawText(section.title, { x: margin, y, size: 15, font: bold, color: teal });
    y -= 18;
    if (section.intro) {
      for (const line of wrapText(section.intro, font, 10, contentWidth)) {
        ensure(14);
        page.drawText(line, { x: margin, y, size: 10, font, color: subtle });
        y -= 12;
      }
      y -= 4;
    }
    for (const field of section.fields) {
      const lines = field.lines ?? 1;
      ensure(20 + lines * 22);
      page.drawText(field.label, { x: margin, y, size: 11, font: bold, color: ink });
      y -= 14;
      for (let i = 0; i < lines; i++) {
        page.drawLine({
          start: { x: margin, y },
          end: { x: pageWidth - margin, y },
          thickness: 0.6,
          color: rule,
        });
        y -= 22;
      }
      y -= 4;
    }
    y -= 10;
  }

  // Footer page note
  ensure(40);
  page.drawLine({ start: { x: margin, y }, end: { x: pageWidth - margin, y }, thickness: 0.5, color: rule });
  y -= 14;
  page.drawText(`Questions? ai@auraintercept.ai · ${SITE_URL}`, {
    x: margin, y, size: 9, font, color: subtle,
  });

  return await pdf.save();
}

function escapeHtml(v: unknown): string {
  return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

function buildEmailHtml(companyName: string, link: string): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#0f172a">
      <h2 style="margin:0 0 8px;color:#0ea5a4">Welcome to Aura Intercept</h2>
      <p>Hi ${escapeHtml(companyName)},</p>
      <p>Your account is created. To finish setup and start your 60-Day Live Trial, complete your onboarding workbook — it captures your branding, contact routing, hours, services, team, and integrations so we can configure Aura on your behalf.</p>
      <p style="margin:24px 0;text-align:center">
        <a href="${link}" style="background:#0ea5a4;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:600">Open your onboarding workbook</a>
      </p>
      <p style="font-size:12px;color:#475569">Your private link (do not share):<br/><a href="${link}" style="color:#0ea5a4">${link}</a></p>
      <p>We've also attached a printable PDF copy of the workbook so you can prep your answers offline or hand it to your team.</p>
      <h3 style="margin:24px 0 6px;font-size:14px">What happens next</h3>
      <ol style="line-height:1.6;font-size:13px;padding-left:20px">
        <li>Complete the workbook (online or PDF) — it autosaves.</li>
        <li>Your Concierge Onboarding specialist reaches out within 1 business day to schedule kickoff.</li>
        <li>Your 60-Day Live Trial begins: 30 days of concierge onboarding + 30 days of full live use.</li>
      </ol>
      <p style="font-size:12px;color:#64748b;margin-top:24px">Link expires in 30 days. Questions? Just reply to this email or write to ai@auraintercept.ai.</p>
    </div>`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const { company_id, company_name, recipient_email } = await req.json();
    if (!company_name || !recipient_email) {
      return new Response(JSON.stringify({ error: 'company_name and recipient_email required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const token = generateToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const { error: insertErr } = await admin.from('onboarding_invites').insert({
      token,
      company_name,
      recipient_email,
      expires_at: expiresAt,
      source: 'signup',
    });
    if (insertErr) {
      console.error('[send-company-welcome] invite insert failed', insertErr);
      return new Response(JSON.stringify({ error: insertErr.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const link = `${SITE_URL}/onboarding?token=${token}`;

    // Build PDF
    let pdfBase64: string | null = null;
    try {
      const pdfBytes = await buildWorkbookPdf(company_name);
      let binary = '';
      const chunk = 0x8000;
      for (let i = 0; i < pdfBytes.length; i += chunk) {
        binary += String.fromCharCode(...pdfBytes.subarray(i, i + chunk));
      }
      pdfBase64 = btoa(binary);
    } catch (pdfErr) {
      console.warn('[send-company-welcome] pdf generation failed (sending without attachment)', pdfErr);
    }

    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (!resendKey) {
      console.error('[send-company-welcome] RESEND_API_KEY missing');
      return new Response(JSON.stringify({ error: 'email_provider_unconfigured', token, link }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload: Record<string, unknown> = {
      from: FROM,
      to: [recipient_email],
      subject: `Welcome to Aura Intercept — your onboarding link & workbook`,
      html: buildEmailHtml(company_name, link),
    };
    if (pdfBase64) {
      payload.attachments = [{
        filename: 'Aura-Intercept-Onboarding-Workbook.pdf',
        content: pdfBase64,
      }];
    }

    const sendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify(payload),
    });
    const sendBody = await sendRes.text();
    if (!sendRes.ok) {
      console.error('[send-company-welcome] resend failed', sendRes.status, sendBody);
      return new Response(JSON.stringify({ error: 'send_failed', detail: sendBody, token, link }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (company_id) {
      await admin.from('companies').update({ onboarding_invite_token: token } as any).eq('id', company_id).then(
        () => {},
        () => {/* column may not exist; ignore */},
      );
    }

    return new Response(JSON.stringify({ ok: true, token, link }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[send-company-welcome] error', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
