import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const COMPANY_ID = '04c57cbe-358e-4036-a3ad-b777a55f5be0';

type Persona = {
  email: string;
  fullName: string;
  role: 'company_admin' | 'employee';
  jobs: string[]; // employee_job_assignments.job_type values
};

const PERSONAS: Persona[] = [
  // auraintercept@gmail.com is now the company_admin of Aura Intercept (preserves Google/OAuth integrations).
  // ai@auraintercept.ai is the platform_admin and is intentionally NOT seeded here.
  { email: 'auraintercept@gmail.com',  fullName: 'Aura Intercept Admin',   role: 'company_admin', jobs: [] },
  { email: 'support@auraintercept.ai', fullName: 'Aura Intercept Support', role: 'employee',      jobs: ['technician'] },
  { email: 'sales@auraintercept.ai',   fullName: 'Aura Intercept Sales',   role: 'employee',      jobs: ['technician'] },
];

async function ensureUser(
  admin: ReturnType<typeof createClient>,
  email: string,
  fullName: string,
  password: string,
): Promise<{ userId: string; created: boolean }> {
  let existing: { id: string } | undefined;
  for (let page = 1; page <= 10; page++) {
    const { data: list } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    const found = list?.users?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
    if (found) { existing = { id: found.id }; break; }
    if (!list?.users || list.users.length < 200) break;
  }
  if (existing) {
    await admin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    return { userId: existing.id, created: false };
  }
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error || !data?.user) throw new Error(`createUser ${email}: ${error?.message ?? 'unknown'}`);
  return { userId: data.user.id, created: true };
}

async function seedPersona(admin: ReturnType<typeof createClient>, p: Persona, password: string) {
  const { userId, created } = await ensureUser(admin, p.email, p.fullName, password);

  // Profile — link to Aura Intercept tenant
  await admin.from('profiles').upsert(
    { id: userId, company_id: COMPANY_ID, full_name: p.fullName, email: p.email },
    { onConflict: 'id' }
  );

  // Role
  await admin.from('user_roles').upsert(
    { user_id: userId, role: p.role },
    { onConflict: 'user_id,role' }
  );

  // Job assignments (only for employee personas)
  for (const job of p.jobs) {
    await admin.from('employee_job_assignments').upsert(
      { employee_id: userId, company_id: COMPANY_ID, job_type: job },
      { onConflict: 'company_id,employee_id,job_type' }
    );
  }

  return { email: p.email, role: p.role, jobs: p.jobs, userId, created };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const seedPassword = Deno.env.get('AURA_TENANT_SEED_PASSWORD');
    if (!seedPassword || seedPassword.length < 16) {
      return new Response(JSON.stringify({
        error: 'AURA_TENANT_SEED_PASSWORD secret missing or too short (min 16 chars). Set it in Cloud secrets before seeding.',
      }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

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

    // Verify the company row exists before seeding personas
    const { data: company, error: companyErr } = await admin
      .from('companies')
      .select('id, name, subscription_tier, industry_vertical')
      .eq('id', COMPANY_ID)
      .maybeSingle();
    if (companyErr || !company) {
      return new Response(JSON.stringify({ error: `Aura Intercept company row ${COMPANY_ID} not found. Run the migration first.` }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results = [];
    for (const p of PERSONAS) {
      try {
        results.push({ ok: true, ...(await seedPersona(admin, p, seedPassword)) });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`Persona ${p.email} failed:`, msg);
        results.push({ ok: false, email: p.email, error: msg });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      company: { id: company.id, name: company.name, tier: company.subscription_tier, vertical: company.industry_vertical },
      personas: results,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error('seed-aura-intercept error:', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});