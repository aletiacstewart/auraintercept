import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Hard-delete every is_demo=true company + everything attached to it.
// Auth: caller must be platform_admin.
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const token = authHeader.replace('Bearer ', '');
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const callerId = claims.claims.sub as string;

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: roleRow } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', callerId)
      .eq('role', 'platform_admin')
      .maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: 'Forbidden — platform_admin required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1) Collect all demo company IDs.
    const { data: demoCompanies, error: listErr } = await admin
      .from('companies')
      .select('id, name, slug')
      .eq('is_demo', true);
    if (listErr) throw listErr;
    const companyIds = (demoCompanies ?? []).map((c) => c.id);

    if (companyIds.length === 0) {
      return new Response(JSON.stringify({ success: true, deleted_companies: 0, deleted_users: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2) Collect every profile attached to those companies (these are the demo auth users).
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, email')
      .in('company_id', companyIds);
    const demoUserIds = (profiles ?? []).map((p) => p.id);
    const demoEmails = (profiles ?? []).map((p) => p.email).filter(Boolean) as string[];

    // 3) Wipe per-company child tables. Order chosen to satisfy FKs.
    const childTables = [
      'ai_agent_configs', 'ai_agent_context', 'ai_agent_events', 'ai_agent_logs',
      'appointment_access_logs', 'appointments',
      'business_hours', 'holiday_closures',
      'calendar_event_mappings', 'calendar_sync_jobs', 'call_logs',
      'campaign_recipients', 'campaign_sends', 'marketing_campaigns',
      'company_ai_content_profiles', 'company_compliance_documents',
      'company_integrations', 'company_role_agent_access', 'company_role_permissions',
      'content_engine_history', 'cost_estimates', 'cross_company_access_logs',
      'customer_company_associations', 'customer_feedback', 'customer_referrals',
      'customer_technician_history', 'customers',
      'digest_delivery_logs', 'email_send_attempts', 'email_templates', 'email_usage_counters',
      'employee_availability', 'employee_job_assignments', 'employee_registration_codes',
      'employee_time_off', 'faqs', 'google_calendar_connections',
      'insurance_verification_requests', 'inventory_items', 'inventory_transactions',
      'invoice_line_items', 'invoices', 'job_assignments',
      'knowledge_documents', 'launch_milestones', 'launch_progress',
      'lead_activities', 'lead_follow_ups', 'leads',
      'missed_call_callbacks', 'onboarding_invites', 'onboarding_step_events',
      'onboarding_submissions', 'onboarding_uploads', 'platform_issues',
      'protocol_switch_events', 'quote_line_items', 'quotes',
      'reminder_logs', 'reminder_settings', 'role_mappings',
      'scheduled_blog_posts', 'scheduled_posts', 'scheduled_social_posts',
      'services', 'site_chat_logs', 'site_metrics', 'site_visitor_logs',
      'smart_links', 'smart_website_holidays', 'smart_websites',
      'sms_keywords', 'sms_logs', 'sms_templates',
      'social_accounts', 'social_content_drafts',
      'staff_notification_preferences', 'staff_notifications',
      'subscription_events', 'subscription_usage_tracking',
      'tavily_usage_attempts', 'tavily_usage_counters',
      'technician_service_assignments', 'tenant_integrations',
      'tts_usage', 'unsubscribe_alerts', 'winback_offers',
      'blog_posts',
    ];
    const childResults: Record<string, string | number> = {};
    for (const tbl of childTables) {
      const { error, count } = await admin.from(tbl).delete({ count: 'exact' }).in('company_id', companyIds);
      childResults[tbl] = error ? `err:${error.message}` : (count ?? 0);
    }

    // 4) Delete profiles + user_roles for the demo users.
    if (demoUserIds.length > 0) {
      await admin.from('user_roles').delete().in('user_id', demoUserIds);
      await admin.from('push_subscriptions').delete().in('user_id', demoUserIds);
      await admin.from('profiles').delete().in('id', demoUserIds);
    }

    // 5) Delete the demo companies themselves.
    const { error: companyDelErr } = await admin.from('companies').delete().in('id', companyIds);
    if (companyDelErr) throw companyDelErr;

    // 6) Delete demo auth users (best-effort; failures are non-fatal).
    let deletedUsers = 0;
    for (const uid of demoUserIds) {
      const { error } = await admin.auth.admin.deleteUser(uid);
      if (!error) deletedUsers++;
    }

    // 7) Also clean any stale @demo.com auth users not linked to a profile.
    let strayUsers = 0;
    for (let page = 1; page <= 10; page++) {
      const { data: list } = await admin.auth.admin.listUsers({ page, perPage: 200 });
      if (!list?.users || list.users.length === 0) break;
      for (const u of list.users) {
        if (u.email && u.email.toLowerCase().endsWith('@demo.com') && !demoUserIds.includes(u.id)) {
          const { error } = await admin.auth.admin.deleteUser(u.id);
          if (!error) strayUsers++;
        }
      }
      if (list.users.length < 200) break;
    }

    return new Response(JSON.stringify({
      success: true,
      deleted_companies: companyIds.length,
      deleted_profile_users: deletedUsers,
      deleted_stray_demo_users: strayUsers,
      sample_emails: demoEmails.slice(0, 5),
      child_row_counts: childResults,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error('wipe-demo-companies error:', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});