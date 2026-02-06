import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Demo company configurations
const DEMO_COMPANIES = {
  business: {
    id: 'b7d8e9f0-1a2b-3c4d-5e6f-7a8b9c0d1e2f',
    name: 'Demo Business Company',
    slug: 'demo-business'
  },
  growth: {
    id: 'c8e9f0a1-2b3c-4d5e-6f7a-8b9c0d1e2f3a',
    name: 'Demo Growth Company',
    slug: 'demo-growth'
  },
  field_ops: {
    id: '8fafcec0-4b2a-45a1-8663-f9ccb5afc545',
    name: 'Demo Field Ops Company',
    slug: 'demo-fieldops'
  },
  performance: {
    id: '4f85ed98-0e98-480c-b904-1c33424e26ad',
    name: 'Demo Performance Company',
    slug: 'demo-performance'
  },
  command: {
    id: '298a7275-0a1f-4bd8-a0ae-b692fdbcd3af',
    name: 'Demo Command Company',
    slug: 'demo-command'
  },
  scheduling: {
    id: '56c0a3a8-a2a1-4689-9c18-d115080a816d',
    name: 'Demo Scheduling Company',
    slug: 'demo-scheduling'
  },
  starter: {
    id: 'd4a6c195-c89a-4208-a818-981902af6c51',
    name: 'Demo Starter Company',
    slug: 'demo-starter'
  }
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { email, password, fullName, companyIds, demoCompanyKey, role } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create user
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName || 'Demo Customer' }
    });

    if (createError) {
      console.error('Error creating user:', createError);
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = userData.user.id;
    const userRole = role || 'customer';

    // Determine company IDs
    let targetCompanyIds = companyIds || [];
    if (demoCompanyKey && DEMO_COMPANIES[demoCompanyKey as keyof typeof DEMO_COMPANIES]) {
      targetCompanyIds = [DEMO_COMPANIES[demoCompanyKey as keyof typeof DEMO_COMPANIES].id];
    }

    // Update profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        full_name: fullName || 'Demo User',
        company_id: userRole === 'employee' || userRole === 'company_admin' 
          ? targetCompanyIds[0] || null 
          : null
      })
      .eq('id', userId);

    if (profileError) {
      console.error('Error updating profile:', profileError);
    }

    // Assign role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({ user_id: userId, role: userRole });

    if (roleError) {
      console.error('Error assigning role:', roleError);
    }

    // Create company associations for customers
    if (userRole === 'customer' && targetCompanyIds.length > 0) {
      for (const companyId of targetCompanyIds) {
        // First, check if a customer_profile exists for this company
        const { data: existingProfile } = await supabaseAdmin
          .from('customer_profiles')
          .select('id')
          .eq('company_id', companyId)
          .eq('email', email)
          .single();

        let customerProfileId = existingProfile?.id;

        // If no profile exists, create one
        if (!customerProfileId) {
          const { data: newProfile, error: profileCreateError } = await supabaseAdmin
            .from('customer_profiles')
            .insert({
              company_id: companyId,
              email: email,
              name: fullName || 'Demo Customer',
            })
            .select('id')
            .single();

          if (profileCreateError) {
            console.error('Error creating customer profile:', profileCreateError);
          } else {
            customerProfileId = newProfile?.id;
          }
        }

        // Create the association
        const { error: assocError } = await supabaseAdmin
          .from('customer_company_associations')
          .insert({
            customer_user_id: userId,
            company_id: companyId,
            customer_profile_id: customerProfileId || null,
          });

        if (assocError) {
          console.error('Error creating company association:', assocError);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        userId, 
        email,
        role: userRole,
        message: `Demo ${userRole} account created successfully` 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});