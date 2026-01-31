import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-secret',
};

// Admin secret for invoking without JWT - only for initial setup
const ADMIN_SECRET = 'create-demo-setup-2024';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Check for admin secret header as alternative auth
  const adminSecret = req.headers.get('x-admin-secret');
  if (adminSecret !== ADMIN_SECRET) {
    // If no admin secret, require proper JWT auth
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const results: any[] = [];
    const password = 'aidemo*!';

    // Company IDs from the database
    const companies = {
      solo: '8fafcec0-4b2a-45a1-8663-f9ccb5afc545',
      multi: '4f85ed98-0e98-480c-b904-1c33424e26ad',
      cmd: '298a7275-0a1f-4bd8-a0ae-b692fdbcd3af',
      halo: '56c0a3a8-a2a1-4689-9c18-d115080a816d',
      xprs: 'd4a6c195-c89a-4208-a818-981902af6c51',
    };

    // Define all accounts to create
    const accounts = [
      // Company Admins
      { email: 'companysolo@demo.com', name: 'Solo Demo Admin', role: 'company_admin', companyId: companies.solo },
      { email: 'companymulti@demo.com', name: 'Multi Demo Admin', role: 'company_admin', companyId: companies.multi },
      { email: 'companycmd@demo.com', name: 'Command Demo Admin', role: 'company_admin', companyId: companies.cmd },
      { email: 'companyhalo@demo.com', name: 'Halo Demo Admin', role: 'company_admin', companyId: companies.halo },
      { email: 'companyxprs@demo.com', name: 'Express Demo Admin', role: 'company_admin', companyId: companies.xprs },
      // Employees
      { email: 'employeesolo@demo.com', name: 'Solo Demo Employee', role: 'employee', companyId: companies.solo },
      { email: 'employeemulti@demo.com', name: 'Multi Demo Employee', role: 'employee', companyId: companies.multi },
      { email: 'employeecmd@demo.com', name: 'Command Demo Employee', role: 'employee', companyId: companies.cmd },
      { email: 'employeehalo@demo.com', name: 'Halo Demo Employee', role: 'employee', companyId: companies.halo },
      { email: 'employeexprs@demo.com', name: 'Express Demo Employee', role: 'employee', companyId: companies.xprs },
      // Customers
      { email: 'customersolo@demo.com', name: 'Solo Demo Customer', role: 'customer', companyId: companies.solo },
      { email: 'customermulti@demo.com', name: 'Multi Demo Customer', role: 'customer', companyId: companies.multi },
      { email: 'customercmd@demo.com', name: 'Command Demo Customer', role: 'customer', companyId: companies.cmd },
      { email: 'customerxprs@demo.com', name: 'Express Demo Customer', role: 'customer', companyId: companies.xprs },
      { email: 'customerhalo@demo.com', name: 'Halo Demo Customer', role: 'customer', companyId: companies.halo },
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

        const userId = authData.user.id;

        // Update profile with company_id
        await supabaseAdmin
          .from('profiles')
          .update({
            company_id: account.companyId,
            full_name: account.name,
          })
          .eq('id', userId);

        // Assign role
        await supabaseAdmin
          .from('user_roles')
          .insert({
            user_id: userId,
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
              customer_user_id: userId,
              company_id: account.companyId,
              customer_profile_id: customerProfileId,
            });
        }

        results.push({ email: account.email, success: true, userId });
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
