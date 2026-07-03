import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendGuardedEmail } from '../_shared/email-guard.ts';
import { authorizeInternalRequest } from '../_shared/internal-auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const body = await req.json();
    const {
      companyId = null, to, from, subject, html, text,
      template, priority: requestedPriority = 'normal',
    } = body ?? {};

    if (!to || !subject || !html) {
      return new Response(JSON.stringify({ error: 'to, subject and html are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!companyId) {
      return new Response(JSON.stringify({ error: 'companyId is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authResult = await authorizeInternalRequest(req, companyId);
    if (!authResult.ok) {
      return new Response(JSON.stringify({ error: authResult.error }), {
        status: authResult.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Only genuine service-role callers may request the cap-bypassing "critical" priority.
    const priority = authResult.ctx.isService ? requestedPriority : 'normal';

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Prefer per-company Resend key; fall back to platform key
    let resendApiKey = Deno.env.get('RESEND_API_KEY') ?? '';
    if (companyId) {
      const { data } = await supabase
        .from('tenant_integrations')
        .select('resend_api_key')
        .eq('company_id', companyId)
        .maybeSingle();
      if (data?.resend_api_key) resendApiKey = data.resend_api_key;
    }

    const fromAddress = from || `Aura Intercept <ai@auraintercept.ai>`;

    const result = await sendGuardedEmail({
      supabase, resendApiKey, companyId,
      to, from: fromAddress, subject, html, text, template, priority,
    });

    return new Response(JSON.stringify(result), {
      status: result.sent ? 200 : 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[send-email-guarded] error', e);
    return new Response(JSON.stringify({ sent: false, error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});