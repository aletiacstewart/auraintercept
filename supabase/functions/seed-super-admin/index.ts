import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPER_EMAIL = 'superadmin@auraintercept.ai';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const password = Deno.env.get('SUPER_ADMIN_PASSWORD');

    if (!password || password.length < 8) {
      return new Response(JSON.stringify({ success: false, error: 'SUPER_ADMIN_PASSWORD secret missing or too short' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Authorization: allow if no super-admin exists yet, or caller is platform_admin
    const authHeader = req.headers.get('authorization');
    let callerIsPlatformAdmin = false;
    if (authHeader?.startsWith('Bearer ')) {
      const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: claimsData } = await userClient.auth.getClaims(authHeader.replace('Bearer ', ''));
      const callerId = claimsData?.claims?.sub;
      if (callerId) {
        const { data: roles } = await admin
          .from('user_roles').select('role').eq('user_id', callerId).eq('role', 'platform_admin');
        callerIsPlatformAdmin = !!(roles && roles.length > 0);
      }
    }

    // Find existing super admin user (if any)
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const existing = list?.users?.find((u) => u.email === SUPER_EMAIL);

    if (!existing && !callerIsPlatformAdmin) {
      // First-time bootstrap requires no caller — but only if no platform_admin exists at all
      const { count } = await admin.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'platform_admin');
      if ((count ?? 0) > 0) {
        return new Response(JSON.stringify({ success: false, error: 'Forbidden — only platform_admin can create the super-admin' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    let userId: string;
    if (existing) {
      userId = existing.id;
      // Reset password to current secret
      await admin.auth.admin.updateUserById(userId, { password, email_confirm: true });
    } else {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email: SUPER_EMAIL,
        password,
        email_confirm: true,
        user_metadata: { full_name: 'Aura Intercept Super Admin' },
      });
      if (createErr) throw createErr;
      userId = created.user!.id;
    }

    // Ensure platform_admin role
    const { data: roleRow } = await admin.from('user_roles')
      .select('id').eq('user_id', userId).eq('role', 'platform_admin').maybeSingle();
    if (!roleRow) {
      await admin.from('user_roles').insert({ user_id: userId, role: 'platform_admin' });
    }

    // Ensure profile exists
    await admin.from('profiles').upsert({
      id: userId,
      email: SUPER_EMAIL,
      full_name: 'Aura Intercept Super Admin',
    }, { onConflict: 'id' });

    return new Response(JSON.stringify({
      success: true,
      email: SUPER_EMAIL,
      userId,
      message: existing ? 'Super-admin password reset' : 'Super-admin created',
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error('seed-super-admin error', e);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});