import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const { token, form_data } = await req.json();
    if (!token || typeof form_data !== 'object') {
      return new Response(JSON.stringify({ error: 'token and form_data required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: invite } = await admin.from('onboarding_invites').select('id, status, expires_at').eq('token', token).maybeSingle();
    if (!invite) return new Response(JSON.stringify({ error: 'invalid' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    if (invite.status === 'submitted') return new Response(JSON.stringify({ error: 'already_submitted' }), { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    if (new Date(invite.expires_at) < new Date()) return new Response(JSON.stringify({ error: 'expired' }), { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // Cap payload size
    const sizeBytes = JSON.stringify(form_data).length;
    if (sizeBytes > 500_000) {
      return new Response(JSON.stringify({ error: 'payload_too_large' }), { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    await admin.from('onboarding_submissions').upsert({
      invite_id: invite.id, form_data,
    }, { onConflict: 'invite_id' });
    await admin.from('onboarding_invites').update({ status: 'in_progress' }).eq('id', invite.id).eq('status', 'sent');

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});