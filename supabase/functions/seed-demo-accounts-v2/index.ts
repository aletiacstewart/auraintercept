import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PASSWORD = 'aidemo*!';

type TierKey = 'core' | 'boost' | 'pro' | 'elite';

interface TierDef {
  key: TierKey;
  label: string;
  internalTier: string; // companies.subscription_tier value
  primary: string;
  secondary: string;
  agents: string[];
}

// Mirrors src/lib/subscriptionAgentConfig.ts
const TIERS: TierDef[] = [
  {
    key: 'core',
    label: 'Demo Core',
    internalTier: 'starter',
    primary: '#0EA5E9',
    secondary: '#22D3EE',
    agents: ['triage','booking','followup','review','creative_content','web_presence','lead','marketing'],
  },
  {
    key: 'boost',
    label: 'Demo Boost',
    internalTier: 'connect',
    primary: '#8B5CF6',
    secondary: '#A78BFA',
    agents: ['triage','booking','followup','review','creative_content','web_presence','lead','marketing','dispatch','route','eta','checkin'],
  },
  {
    key: 'pro',
    label: 'Demo Pro',
    internalTier: 'performance',
    primary: '#F59E0B',
    secondary: '#FBBF24',
    agents: ['triage','booking','followup','review','creative_content','web_presence','lead','marketing','dispatch','route','eta','checkin','campaign','outreach','social_scheduler','social_analytics'],
  },
  {
    key: 'elite',
    label: 'Demo Elite',
    internalTier: 'command',
    primary: '#EF4444',
    secondary: '#F87171',
    agents: ['triage','booking','followup','review','dispatch','route','eta','checkin','admin','quoting','invoice','inventory','campaign','lead','outreach','marketing','creative_content','web_presence','social_scheduler','social_analytics','insights','performance','revenue','forecast'],
  },
];

const SAMPLE_FIRST = ['Sarah','James','Maria','David','Emma','Michael','Linda','Robert','Jessica','William'];
const SAMPLE_LAST = ['Johnson','Smith','Garcia','Brown','Davis','Miller','Wilson','Anderson','Taylor','Thomas'];
const SAMPLE_STREETS = ['Main St','Oak Ave','Pine Rd','Maple Dr','Elm St','Cedar Ln','Park Blvd','Lake Rd'];
const SAMPLE_SERVICES = ['HVAC Tune-Up','Plumbing Repair','Electrical Inspection','Drain Cleaning','AC Installation'];

function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randPhone(): string {
  const n = () => Math.floor(Math.random() * 9000 + 1000);
  return `+1555${n()}${String(n()).slice(0, 3)}`;
}
function daysAgo(d: number): string {
  return new Date(Date.now() - d * 86400000).toISOString();
}
function daysFromNow(d: number): string {
  return new Date(Date.now() + d * 86400000).toISOString();
}

interface CreateUserResult {
  userId: string;
  created: boolean;
  email: string;
}

async function ensureUser(
  admin: ReturnType<typeof createClient>,
  email: string,
  fullName: string,
): Promise<CreateUserResult> {
  // Try to find existing
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const existing = list?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (existing) {
    // Reset password to known value
    await admin.auth.admin.updateUserById(existing.id, { password: PASSWORD, email_confirm: true });
    return { userId: existing.id, created: false, email };
  }
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error || !data?.user) throw new Error(`createUser ${email}: ${error?.message ?? 'unknown'}`);
  return { userId: data.user.id, created: true, email };
}

async function seedTier(admin: ReturnType<typeof createClient>, tier: TierDef) {
  const slug = `demo-${tier.key}`;
  const log: string[] = [];

  // 1. Company (upsert by slug)
  const { data: existingCompany } = await admin
    .from('companies')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  let companyId: string;
  const companyPayload = {
    name: tier.label,
    slug,
    subscription_tier: tier.internalTier,
    primary_color: tier.primary,
    secondary_color: tier.secondary,
    contact_email: `${tier.key}company@demo.com`,
    contact_phone: randPhone(),
    business_phone: randPhone(),
    address: `${100 + Math.floor(Math.random() * 900)} ${rand(SAMPLE_STREETS)}, Austin, TX 78701`,
    service_area_cities: ['Austin','Round Rock','Cedar Park'],
    service_area_zip_codes: ['78701','78702','78703'],
    service_categories: ['HVAC','Plumbing','Electrical'],
  };

  if (existingCompany) {
    companyId = existingCompany.id;
    await admin.from('companies').update(companyPayload).eq('id', companyId);
    log.push(`company ${slug} updated`);
  } else {
    const { data: c, error } = await admin.from('companies').insert(companyPayload).select('id').single();
    if (error) throw new Error(`company ${slug}: ${error.message}`);
    companyId = c.id;
    log.push(`company ${slug} created`);
  }

  // 2. Three users
  const adminUser = await ensureUser(admin, `${tier.key}company@demo.com`, `${tier.label} Admin`);
  const employeeUser = await ensureUser(admin, `${tier.key}employee@demo.com`, `${tier.label} Employee`);
  const customerUser = await ensureUser(admin, `${tier.key}customer@demo.com`, `${tier.label} Customer`);

  // 3. Profiles (handle_new_user trigger creates row; we update company_id)
  await admin.from('profiles').update({
    company_id: companyId,
    full_name: `${tier.label} Admin`,
  }).eq('id', adminUser.userId);
  await admin.from('profiles').update({
    company_id: companyId,
    full_name: `${tier.label} Employee`,
  }).eq('id', employeeUser.userId);
  await admin.from('profiles').update({
    full_name: `${tier.label} Customer`,
  }).eq('id', customerUser.userId);

  // 4. Roles (idempotent — unique on (user_id, role))
  await admin.from('user_roles').upsert({ user_id: adminUser.userId, role: 'company_admin' }, { onConflict: 'user_id,role' });
  await admin.from('user_roles').upsert({ user_id: employeeUser.userId, role: 'employee' }, { onConflict: 'user_id,role' });
  await admin.from('user_roles').upsert({ user_id: customerUser.userId, role: 'customer' }, { onConflict: 'user_id,role' });

  // 5. Employee job assignment
  await admin.from('employee_job_assignments').upsert({
    employee_id: employeeUser.userId,
    company_id: companyId,
    job_type: 'technician',
  }, { onConflict: 'company_id,employee_id,job_type' });

  // 6. Customer association
  await admin.from('customer_company_associations').upsert({
    customer_user_id: customerUser.userId,
    company_id: companyId,
  }, { onConflict: 'customer_user_id,company_id' });

  // 7. Business hours (Mon-Fri 8-17, weekends closed)
  for (let d = 0; d < 7; d++) {
    const closed = d === 0 || d === 6;
    await admin.from('business_hours').upsert({
      company_id: companyId,
      day_of_week: d,
      hour_type: 'office',
      open_time: closed ? null : '08:00:00',
      close_time: closed ? null : '17:00:00',
      is_closed: closed,
    }, { onConflict: 'company_id,day_of_week,hour_type' });
  }

  // ========= DEMO DATA =========
  const has = (a: string) => tier.agents.includes(a);

  // Wipe prior demo data scoped to this company so re-runs don't pile up
  await admin.from('appointments').delete().eq('company_id', companyId);
  await admin.from('leads').delete().eq('company_id', companyId);
  await admin.from('marketing_campaigns').delete().eq('company_id', companyId);
  await admin.from('quotes').delete().eq('company_id', companyId);
  await admin.from('invoices').delete().eq('company_id', companyId);
  await admin.from('inventory_items').delete().eq('company_id', companyId);
  await admin.from('blog_posts').delete().eq('author_id', adminUser.userId);

  // Customer profiles (5: the registered customer + 4 sample)
  const customerProfiles = [
    { email: `${tier.key}customer@demo.com`, name: `${tier.label} Customer` },
    ...Array.from({ length: 4 }, (_, i) => ({
      email: `sample${i + 1}.${tier.key}@demo.com`,
      name: `${rand(SAMPLE_FIRST)} ${rand(SAMPLE_LAST)}`,
    })),
  ];
  for (const cp of customerProfiles) {
    await admin.from('customer_profiles').upsert({
      company_id: companyId,
      email: cp.email,
      name: cp.name,
      phone: randPhone(),
      address: `${100 + Math.floor(Math.random() * 900)} ${rand(SAMPLE_STREETS)}, Austin, TX 78701`,
    }, { onConflict: 'company_id,email' });
  }

  // Appointments (triage/booking) — always seed
  if (has('booking') || has('triage')) {
    const statuses = ['scheduled','scheduled','completed','completed','cancelled'];
    const apptRows = statuses.map((status, i) => ({
      company_id: companyId,
      customer_name: `${rand(SAMPLE_FIRST)} ${rand(SAMPLE_LAST)}`,
      customer_email: `customer${i}@example.com`,
      customer_phone: randPhone(),
      customer_address: `${100 + i} ${rand(SAMPLE_STREETS)}, Austin, TX`,
      service_type: rand(SAMPLE_SERVICES),
      datetime: status === 'completed' ? daysAgo(10 + i * 3) : daysFromNow(2 + i * 2),
      duration_minutes: 60,
      status,
    }));
    await admin.from('appointments').insert(apptRows);
  }

  // Leads
  if (has('lead')) {
    const priorities = ['hot','hot','high','high','normal','normal'];
    const leadRows = priorities.map((priority, i) => ({
      company_id: companyId,
      name: `${rand(SAMPLE_FIRST)} ${rand(SAMPLE_LAST)}`,
      phone: randPhone(),
      email: `lead${i}.${tier.key}@example.com`,
      address: `${200 + i} ${rand(SAMPLE_STREETS)}, Austin, TX`,
      source: rand(['voice','chat','widget','referral']),
      intent: rand(['booking','quote','inquiry','emergency']),
      service_interest: rand(SAMPLE_SERVICES),
      status: rand(['new','contacted','qualified']),
      priority,
      score: priority === 'hot' ? 85 : priority === 'high' ? 70 : 50,
      created_at: daysAgo(Math.floor(Math.random() * 30)),
    }));
    await admin.from('leads').insert(leadRows);
  }

  // Marketing campaigns
  if (has('marketing') || has('campaign')) {
    await admin.from('marketing_campaigns').insert([
      {
        company_id: companyId,
        name: 'Spring Tune-Up Promo',
        campaign_type: 'promotional',
        target_segment: 'all_customers',
        discount_type: 'percentage',
        discount_value: 15,
        promo_code: 'SPRING15',
        message_template: 'Get 15% off your spring HVAC tune-up! Book today.',
        email_subject: 'Spring Savings: 15% Off Tune-Ups',
        channels: ['email','sms'],
        status: 'active',
        start_date: daysAgo(7),
        end_date: daysFromNow(30),
        total_sent: 245,
        total_opened: 142,
        total_clicked: 38,
        total_converted: 12,
      },
      {
        company_id: companyId,
        name: 'Win-Back Past Customers',
        campaign_type: 'reactivation',
        target_segment: 'inactive_90_days',
        discount_type: 'fixed',
        discount_value: 50,
        promo_code: 'COMEBACK50',
        message_template: 'We miss you! $50 off your next service.',
        email_subject: 'We Miss You — $50 Off',
        channels: ['email'],
        status: 'completed',
        start_date: daysAgo(45),
        end_date: daysAgo(15),
        total_sent: 89,
        total_opened: 51,
        total_clicked: 14,
        total_converted: 5,
      },
    ]);
  }

  // Blog posts (creative_content)
  if (has('creative_content')) {
    await admin.from('blog_posts').insert([
      {
        author_id: adminUser.userId,
        title: '5 Signs Your AC Needs Service Before Summer',
        slug: `${tier.key}-ac-summer-tips`,
        excerpt: 'Catch issues early and beat the heat with these inspection tips.',
        content: '## Signs to watch for\n\nWeak airflow, strange noises, rising bills, uneven cooling, and frequent cycling are all signals your AC needs attention.',
        published: true,
        published_at: daysAgo(14),
      },
      {
        author_id: adminUser.userId,
        title: 'How Smart Thermostats Save You Money',
        slug: `${tier.key}-smart-thermostat-savings`,
        excerpt: 'Modern thermostats pay for themselves in under a year.',
        content: '## The math\n\nA programmable thermostat reduces HVAC energy use by 10-15%, saving the average household $180+/year.',
        published: true,
        published_at: daysAgo(7),
      },
      {
        author_id: adminUser.userId,
        title: 'Plumbing Emergencies: What to Do First',
        slug: `${tier.key}-plumbing-emergency-guide`,
        excerpt: 'A quick playbook before the technician arrives.',
        content: '## Step 1: Shut off water\n\nKnow where your main valve is. Then call us.',
        published: false,
      },
    ]);
  }

  // Quotes & invoices (Elite-only quoting/invoice agents)
  if (has('quoting')) {
    await admin.from('quotes').insert(Array.from({ length: 3 }, (_, i) => ({
      company_id: companyId,
      customer_name: `${rand(SAMPLE_FIRST)} ${rand(SAMPLE_LAST)}`,
      customer_email: `quote${i}@example.com`,
      customer_phone: randPhone(),
      status: rand(['sent','accepted','draft']),
      subtotal: 450 + i * 100,
      tax_rate: 8.25,
      tax_amount: (450 + i * 100) * 0.0825,
      total_amount: (450 + i * 100) * 1.0825,
      valid_until: daysFromNow(30),
      notes: 'Demo quote',
    })));
  }
  if (has('invoice')) {
    await admin.from('invoices').insert(Array.from({ length: 3 }, (_, i) => ({
      company_id: companyId,
      invoice_number: `INV-DEMO-${tier.key.toUpperCase()}-${1000 + i}`,
      customer_name: `${rand(SAMPLE_FIRST)} ${rand(SAMPLE_LAST)}`,
      customer_email: `invoice${i}@example.com`,
      customer_phone: randPhone(),
      status: i === 0 ? 'paid' : i === 1 ? 'sent' : 'draft',
      subtotal: 350 + i * 75,
      tax_rate: 8.25,
      tax_amount: (350 + i * 75) * 0.0825,
      total: (350 + i * 75) * 1.0825,
      due_date: daysFromNow(15),
      paid_at: i === 0 ? daysAgo(2) : null,
    })));
  }

  // Inventory (Elite)
  if (has('inventory')) {
    const items = [
      { name: '1" Copper Pipe (10ft)', sku: 'CP-1-10', quantity: 24, min_quantity: 10, unit_cost: 18.50, category: 'Plumbing' },
      { name: 'PVC Elbow 90°', sku: 'PVC-E90', quantity: 156, min_quantity: 50, unit_cost: 1.25, category: 'Plumbing' },
      { name: 'Air Filter 16x25x1', sku: 'AF-16251', quantity: 42, min_quantity: 20, unit_cost: 8.99, category: 'HVAC' },
      { name: 'R-410A Refrigerant (lb)', sku: 'R410A-LB', quantity: 8, min_quantity: 15, unit_cost: 12.00, category: 'HVAC' },
      { name: '20A Circuit Breaker', sku: 'CB-20A', quantity: 35, min_quantity: 10, unit_cost: 14.50, category: 'Electrical' },
      { name: '14/2 Romex Wire (250ft)', sku: 'RX-142-250', quantity: 6, min_quantity: 5, unit_cost: 89.00, category: 'Electrical' },
      { name: 'Thermostat — Smart Wifi', sku: 'TH-SMART', quantity: 12, min_quantity: 5, unit_cost: 145.00, category: 'HVAC' },
      { name: 'Drain Snake 25ft', sku: 'DS-25', quantity: 4, min_quantity: 2, unit_cost: 65.00, category: 'Plumbing' },
    ];
    await admin.from('inventory_items').insert(items.map((it) => ({ ...it, company_id: companyId, supplier: 'Demo Supplier Co.' })));
  }

  return {
    tier: tier.key,
    company_id: companyId,
    users: {
      admin: adminUser,
      employee: employeeUser,
      customer: customerUser,
    },
    log,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // ===== Auth: must be platform_admin =====
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const token = authHeader.replace('Bearer ', '');
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ===== Seed all 4 tiers =====
    const results = [];
    for (const tier of TIERS) {
      try {
        const r = await seedTier(admin, tier);
        results.push({ ok: true, ...r });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`Tier ${tier.key} failed:`, msg);
        results.push({ ok: false, tier: tier.key, error: msg });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      password: PASSWORD,
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error('seed-demo-accounts-v2 error:', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
