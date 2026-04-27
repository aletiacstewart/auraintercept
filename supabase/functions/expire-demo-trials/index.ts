import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const { data: expired, error } = await admin
      .from('demo_trials')
      .select('id, company_id, admin_user_id, employee_user_id, customer_user_id')
      .eq('status', 'active')
      .lt('expires_at', new Date().toISOString());
    if (error) throw error;

    let cleaned = 0;
    for (const trial of expired || []) {
      // Delete users (cascades roles, profiles via FKs / triggers if set; otherwise we delete profiles too)
      for (const userId of [trial.admin_user_id, trial.employee_user_id, trial.customer_user_id]) {
        if (!userId) continue;
        try {
          await admin.auth.admin.deleteUser(userId);
        } catch (e) {
          console.warn(`deleteUser ${userId} failed:`, (e as Error).message);
        }
      }

      // Delete the company (cascades appointments, leads, etc. via existing FKs)
      if (trial.company_id) {
        try {
          await admin.from('companies').delete().eq('id', trial.company_id);
        } catch (e) {
          console.warn(`delete company ${trial.company_id} failed:`, (e as Error).message);
        }
      }

      await admin.from('demo_trials').update({ status: 'expired' }).eq('id', trial.id);
      cleaned++;
    }

    return new Response(JSON.stringify({ success: true, cleaned }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('expire-demo-trials error:', msg);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
