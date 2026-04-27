import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PASSWORD = 'auratrial*!';
const TRIAL_HOURS = 48;

const INDUSTRY_DEFAULTS: Record<string, { services: string[]; categories: string[]; primary: string; secondary: string }> = {
  hvac: { services: ['AC Repair', 'Furnace Install', 'Duct Cleaning', 'Maintenance', 'Emergency Service'], categories: ['HVAC'], primary: '#0EA5E9', secondary: '#22D3EE' },
  plumbing: { services: ['Drain Cleaning', 'Water Heater', 'Pipe Repair', 'Fixture Install', 'Emergency Service'], categories: ['Plumbing'], primary: '#3B82F6', secondary: '#60A5FA' },
  electrical: { services: ['Panel Upgrade', 'Wiring', 'Outlet Install', 'Lighting', 'Safety Inspection'], categories: ['Electrical'], primary: '#F59E0B', secondary: '#FBBF24' },
  general_contractor: { services: ['Remodeling', 'Additions', 'Roofing', 'Siding', 'Deck Building'], categories: ['General Contractor'], primary: '#8B5CF6', secondary: '#A78BFA' },
  landscaping: { services: ['Lawn Mowing', 'Tree Trimming', 'Landscape Design', 'Irrigation', 'Snow Removal'], categories: ['Landscaping'], primary: '#10B981', secondary: '#34D399' },
  other: { services: ['Service Calls', 'Estimates', 'Maintenance', 'Emergency Service'], categories: ['Service'], primary: '#6366F1', secondary: '#818CF8' },
};

const SAMPLE_FIRST = ['Sarah','James','Maria','David','Emma','Michael','Linda','Robert'];
const SAMPLE_LAST = ['Johnson','Smith','Garcia','Brown','Davis','Miller','Wilson'];
const STREETS = ['Main St','Oak Ave','Pine Rd','Maple Dr','Elm St'];

function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function token(len = 8) { return Math.random().toString(36).slice(2, 2 + len); }
function phone() {
  const n = () => Math.floor(Math.random() * 9000 + 1000);
  return `+1555${n()}${String(n()).slice(0, 3)}`;
}
function daysFromNow(d: number) { return new Date(Date.now() + d * 86400000).toISOString(); }
function daysAgo(d: number) { return new Date(Date.now() - d * 86400000).toISOString(); }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceKey);

    const body = await req.json();
    const { name, email, phone: prospectPhone, business_name, industry, sms_opt_in } = body || {};

    if (!name || !email || !business_name || !industry) {
      return new Response(JSON.stringify({ success: false, error: 'name, email, business_name, and industry are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const industryKey = INDUSTRY_DEFAULTS[industry] ? industry : 'other';
    const ind = INDUSTRY_DEFAULTS[industryKey];

    // Rate limit: 1 trial per email per 7 days
    const { data: recent } = await admin
      .from('demo_trials')
      .select('id, expires_at, status')
      .eq('prospect_email', email.toLowerCase())
      .gt('created_at', daysAgo(7))
      .order('created_at', { ascending: false })
      .limit(1);
    if (recent && recent.length > 0 && recent[0].status === 'active') {
      return new Response(JSON.stringify({ success: false, error: 'You already have an active demo. Check your email for credentials.' }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const slug = `demo-trial-${industryKey}-${token(6)}`;
    const tk = token(6);
    const adminEmail = `demo-admin-${tk}@auraintercept.ai`;
    const employeeEmail = `demo-tech-${tk}@auraintercept.ai`;
    const customerEmail = `demo-customer-${tk}@auraintercept.ai`;

    // 1) Create company
    const { data: company, error: companyErr } = await admin.from('companies').insert({
      name: business_name,
      slug,
      subscription_tier: 'performance',
      primary_color: ind.primary,
      secondary_color: ind.secondary,
      contact_email: email,
      contact_phone: prospectPhone || phone(),
      business_phone: phone(),
      address: `${100 + Math.floor(Math.random() * 900)} ${rand(STREETS)}, Austin, TX 78701`,
      service_area_cities: ['Austin','Round Rock','Cedar Park'],
      service_area_zip_codes: ['78701','78702','78703'],
      service_categories: ind.categories,
      industry_vertical: industryKey,
      trial_ends_at: daysFromNow(TRIAL_HOURS / 24),
    }).select('id').single();
    if (companyErr) throw new Error(`company: ${companyErr.message}`);
    const companyId = company.id as string;

    const expiresAt = new Date(Date.now() + TRIAL_HOURS * 3600000).toISOString();
    const userMeta = { aura_demo_trial: true, aura_demo_expires_at: expiresAt };

    // 2) Create three users
    const createUser = async (em: string, fullName: string) => {
      const { data, error } = await admin.auth.admin.createUser({
        email: em,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: fullName, ...userMeta },
      });
      if (error || !data?.user) throw new Error(`createUser ${em}: ${error?.message}`);
      return data.user.id;
    };

    const adminUserId = await createUser(adminEmail, `${name} (Demo Owner)`);
    const employeeUserId = await createUser(employeeEmail, `${business_name} Tech`);
    const customerUserId = await createUser(customerEmail, `Sample Customer`);

    // 3) Profile links
    await admin.from('profiles').update({ company_id: companyId, full_name: `${name} (Demo Owner)` }).eq('id', adminUserId);
    await admin.from('profiles').update({ company_id: companyId, full_name: `${business_name} Tech` }).eq('id', employeeUserId);
    await admin.from('profiles').update({ full_name: 'Sample Customer' }).eq('id', customerUserId);

    // 4) Roles
    await admin.from('user_roles').upsert({ user_id: adminUserId, role: 'company_admin' }, { onConflict: 'user_id,role' });
    await admin.from('user_roles').upsert({ user_id: employeeUserId, role: 'employee' }, { onConflict: 'user_id,role' });
    await admin.from('user_roles').upsert({ user_id: customerUserId, role: 'customer' }, { onConflict: 'user_id,role' });

    // 5) Job assignment + customer association
    await admin.from('employee_job_assignments').upsert({
      employee_id: employeeUserId, company_id: companyId, job_type: 'technician',
    }, { onConflict: 'company_id,employee_id,job_type' });
    await admin.from('customer_company_associations').upsert({
      customer_user_id: customerUserId, company_id: companyId,
    }, { onConflict: 'customer_user_id,company_id' });

    // 6) Business hours
    for (let d = 0; d < 7; d++) {
      const closed = d === 0 || d === 6;
      await admin.from('business_hours').upsert({
        company_id: companyId, day_of_week: d, hour_type: 'office',
        open_time: closed ? null : '08:00:00', close_time: closed ? null : '17:00:00',
        is_closed: closed,
      }, { onConflict: 'company_id,day_of_week,hour_type' });
    }

    // 7) Sample customers + appointments
    for (let i = 0; i < 4; i++) {
      await admin.from('customer_profiles').insert({
        company_id: companyId,
        email: `sample${i + 1}-${tk}@example.com`,
        name: `${rand(SAMPLE_FIRST)} ${rand(SAMPLE_LAST)}`,
        phone: phone(),
        address: `${100 + i * 12} ${rand(STREETS)}, Austin, TX 78701`,
      });
    }
    // The signed-in customer's profile too
    await admin.from('customer_profiles').insert({
      company_id: companyId,
      email: customerEmail,
      name: 'Sample Customer',
      phone: phone(),
      address: '742 Evergreen Terrace, Austin, TX 78701',
    });

    const apptStatuses = ['scheduled','scheduled','scheduled','completed','completed','cancelled'];
    await admin.from('appointments').insert(apptStatuses.map((status, i) => ({
      company_id: companyId,
      customer_name: i === 0 ? 'Sample Customer' : `${rand(SAMPLE_FIRST)} ${rand(SAMPLE_LAST)}`,
      customer_email: i === 0 ? customerEmail : `sample${i}-${tk}@example.com`,
      customer_phone: phone(),
      customer_address: i === 0 ? '742 Evergreen Terrace, Austin, TX 78701' : `${100 + i} ${rand(STREETS)}, Austin, TX`,
      service_type: rand(ind.services),
      datetime: status === 'completed' ? daysAgo(5 + i * 2) : daysFromNow(1 + i),
      duration_minutes: 60,
      status,
    })));

    // 8) Seed leads
    await admin.from('leads').insert([
      { company_id: companyId, name: `${rand(SAMPLE_FIRST)} ${rand(SAMPLE_LAST)}`, phone: phone(), email: `lead1-${tk}@example.com`, source: 'voice', intent: 'emergency', service_interest: rand(ind.services), priority: 'hot', score: 88, status: 'new' },
      { company_id: companyId, name: `${rand(SAMPLE_FIRST)} ${rand(SAMPLE_LAST)}`, phone: phone(), email: `lead2-${tk}@example.com`, source: 'chat', intent: 'quote', service_interest: rand(ind.services), priority: 'high', score: 72, status: 'contacted' },
      { company_id: companyId, name: `${rand(SAMPLE_FIRST)} ${rand(SAMPLE_LAST)}`, phone: phone(), email: `lead3-${tk}@example.com`, source: 'widget', intent: 'booking', service_interest: rand(ind.services), priority: 'normal', score: 55, status: 'new' },
    ]);

    // 9) Insert trial record
    await admin.from('demo_trials').insert({
      company_id: companyId,
      prospect_email: email.toLowerCase(),
      prospect_name: name,
      prospect_phone: prospectPhone || null,
      industry: industryKey,
      admin_user_id: adminUserId,
      employee_user_id: employeeUserId,
      customer_user_id: customerUserId,
      admin_email: adminEmail,
      employee_email: employeeEmail,
      customer_email: customerEmail,
      password: PASSWORD,
      sms_opt_in: !!sms_opt_in,
      expires_at: expiresAt,
      created_ip: req.headers.get('x-forwarded-for') || null,
    });

    return new Response(JSON.stringify({
      success: true,
      trial_id: companyId,
      expires_at: expiresAt,
      password: PASSWORD,
      admin: { email: adminEmail, redirect: '/dashboard' },
      employee: { email: employeeEmail, redirect: '/technician' },
      customer: { email: customerEmail, redirect: '/customer-portal' },
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('create-demo-trial error:', msg);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
