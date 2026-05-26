import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token') || (await req.json().catch(() => ({}))).token;
    if (!token) return new Response(JSON.stringify({ error: 'token required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: invite } = await admin.from('onboarding_invites').select('id, company_name, recipient_email, status, expires_at, submitted_at').eq('token', token).maybeSingle();
    if (!invite) return new Response(JSON.stringify({ error: 'invalid' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    if (new Date(invite.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: 'expired' }), { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: sub } = await admin.from('onboarding_submissions').select('form_data, submitted_at').eq('invite_id', invite.id).maybeSingle();
    const { data: uploads } = await admin.from('onboarding_uploads').select('id, section, file_name, mime_type, size_bytes, created_at').eq('invite_id', invite.id).order('created_at', { ascending: true });

    return new Response(JSON.stringify({
      invite: { company_name: invite.company_name, recipient_email: invite.recipient_email, status: invite.status, submitted_at: invite.submitted_at },
      form_data: sub?.form_data ?? {},
      uploads: uploads ?? [],
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});