import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendGuardedEmail } from '../_shared/email-guard.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('Authorization') || '';
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Auth check via JWT
    const userClient = createClient(supabaseUrl, anon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    const user = userData?.user;
    if (!user) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: isAdmin } = await admin.rpc('has_role', { _user_id: user.id, _role: 'platform_admin' });
    if (!isAdmin) return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { company_name, recipient_email } = await req.json();
    if (!company_name || !recipient_email) {
      return new Response(JSON.stringify({ error: 'company_name and recipient_email required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Generate URL-safe token
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    const token = btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    const { data: invite, error } = await admin.from('onboarding_invites').insert({
      token, company_name, recipient_email, created_by: user.id,
    }).select('*').single();
    if (error) throw error;

    const link = `https://auraintercept.ai/intake/${token}`;
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111">
        <h2 style="margin:0 0 12px">Welcome to Aura Intercept</h2>
        <p>Hi ${company_name},</p>
        <p>To get your account ready for launch, please complete your onboarding workbook. It collects your branding, contact routing, employees, integrations, and a few documents we'll need.</p>
        <p style="margin:24px 0">
          <a href="${link}" style="background:#0ea5a4;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;display:inline-block">Open Onboarding Workbook</a>
        </p>
        <p style="font-size:12px;color:#555">Your private link (do not share): <br/><a href="${link}">${link}</a></p>
        <p style="font-size:12px;color:#555">This link expires in 30 days. Your progress autosaves.</p>
      </div>`;

    await sendGuardedEmail({
      supabase: admin,
      resendApiKey: Deno.env.get('RESEND_API_KEY') ?? '',
      companyId: null,
      to: recipient_email,
      from: 'Aura Intercept <onboarding@resend.dev>',
      subject: `Your Aura Intercept onboarding workbook — ${company_name}`,
      html,
      priority: 'high',
    });

    return new Response(JSON.stringify({ invite, link }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[create-onboarding-invite]', e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});