import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Verify the caller is authenticated and is a platform admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - No valid token provided' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's auth to verify their identity
    const supabaseAuth = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;

    // Create admin client to check user roles
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify user has platform_admin role
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'platform_admin')
      .maybeSingle();

    if (roleError || !roleData) {
      console.error('User does not have platform_admin role:', userId);
      return new Response(
        JSON.stringify({ error: 'Forbidden - Platform admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Platform admin ${userId} authorized to create demo accounts`);

    const results: any[] = [];
    const password = 'aidemo*!';

    // Company IDs from the database - mapped to tier names
    const companies = {
      starter: 'd4a6c195-c89a-4208-a818-981902af6c51',
      connect: '56c0a3a8-a2a1-4689-9c18-d115080a816d',
      growth: 'c8e9f0a1-2b3c-4d5e-6f7a-8b9c0d1e2f3a',
      presence: 'b7d8e9f0-1a2b-3c4d-5e6f-7a8b9c0d1e2f',
      logistics: '8fafcec0-4b2a-45a1-8663-f9ccb5afc545',
      performance: '4f85ed98-0e98-480c-b904-1c33424e26ad',
      command: '298a7275-0a1f-4bd8-a0ae-b692fdbcd3af',
    };

    // Define all 21 accounts to create (7 tiers × 3 account types)
    const accounts = [
      // Company Admins (7)
      { email: 'companystarter@demo.com', name: 'Starter Demo Admin', role: 'company_admin', companyId: companies.starter },
      { email: 'companyconnect@demo.com', name: 'Connect Demo Admin', role: 'company_admin', companyId: companies.connect },
      { email: 'companygrowth@demo.com', name: 'Growth Demo Admin', role: 'company_admin', companyId: companies.growth },
      { email: 'companypresence@demo.com', name: 'Presence Demo Admin', role: 'company_admin', companyId: companies.presence },
      { email: 'companylogistics@demo.com', name: 'Logistics Demo Admin', role: 'company_admin', companyId: companies.logistics },
      { email: 'companyperformance@demo.com', name: 'Performance Demo Admin', role: 'company_admin', companyId: companies.performance },
      { email: 'companycommand@demo.com', name: 'Command Demo Admin', role: 'company_admin', companyId: companies.command },
      
      // Employees (7)
      { email: 'employeestarter@demo.com', name: 'Starter Demo Employee', role: 'employee', companyId: companies.starter },
      { email: 'employeeconnect@demo.com', name: 'Connect Demo Employee', role: 'employee', companyId: companies.connect },
      { email: 'employeegrowth@demo.com', name: 'Growth Demo Employee', role: 'employee', companyId: companies.growth },
      { email: 'employeepresence@demo.com', name: 'Presence Demo Employee', role: 'employee', companyId: companies.presence },
      { email: 'employeelogistics@demo.com', name: 'Logistics Demo Employee', role: 'employee', companyId: companies.logistics },
      { email: 'employeeperformance@demo.com', name: 'Performance Demo Employee', role: 'employee', companyId: companies.performance },
      { email: 'employeecommand@demo.com', name: 'Command Demo Employee', role: 'employee', companyId: companies.command },
      
      // Customers (7)
      { email: 'customerstarter@demo.com', name: 'Starter Demo Customer', role: 'customer', companyId: companies.starter },
      { email: 'customerconnect@demo.com', name: 'Connect Demo Customer', role: 'customer', companyId: companies.connect },
      { email: 'customergrowth@demo.com', name: 'Growth Demo Customer', role: 'customer', companyId: companies.growth },
      { email: 'customerpresence@demo.com', name: 'Presence Demo Customer', role: 'customer', companyId: companies.presence },
      { email: 'customerlogistics@demo.com', name: 'Logistics Demo Customer', role: 'customer', companyId: companies.logistics },
      { email: 'customerperformance@demo.com', name: 'Performance Demo Customer', role: 'customer', companyId: companies.performance },
      { email: 'customercommand@demo.com', name: 'Command Demo Customer', role: 'customer', companyId: companies.command },
    ];

    for (const account of accounts) {
      try {
        console.log(`Creating account: ${account.email}`);

        // Create the user
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: account.email,
          password: password,
          email_confirm: true,
          user_metadata: {
            full_name: account.name,
          },
        });

        if (authError) {
          console.error(`Error creating ${account.email}:`, authError);
          results.push({ email: account.email, success: false, error: authError.message });
          continue;
        }

        const newUserId = authData.user.id;

        // Update profile with company_id
        await supabaseAdmin
          .from('profiles')
          .update({
            company_id: account.companyId,
            full_name: account.name,
          })
          .eq('id', newUserId);

        // Assign role
        await supabaseAdmin
          .from('user_roles')
          .insert({
            user_id: newUserId,
            role: account.role,
          });

        // For customers, create customer_profile and association
        if (account.role === 'customer') {
          // Check if customer_profile exists
          const { data: existingProfile } = await supabaseAdmin
            .from('customer_profiles')
            .select('id')
            .eq('company_id', account.companyId)
            .eq('email', account.email)
            .maybeSingle();

          let customerProfileId = existingProfile?.id;

          if (!customerProfileId) {
            const { data: newProfile } = await supabaseAdmin
              .from('customer_profiles')
              .insert({
                company_id: account.companyId,
                email: account.email,
                name: account.name,
              })
              .select('id')
              .single();
            
            customerProfileId = newProfile?.id;
          }

          // Create customer_company_association
          await supabaseAdmin
            .from('customer_company_associations')
            .insert({
              customer_user_id: newUserId,
              company_id: account.companyId,
              customer_profile_id: customerProfileId,
            });
        }

        results.push({ email: account.email, success: true, userId: newUserId });
        console.log(`Successfully created: ${account.email}`);

      } catch (err) {
        console.error(`Failed to create ${account.email}:`, err);
        results.push({ email: account.email, success: false, error: String(err) });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create demo accounts';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
