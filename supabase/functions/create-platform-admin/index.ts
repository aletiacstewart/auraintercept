import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // ============ AUTHORIZATION CHECK ============
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Missing or invalid authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the caller's JWT
    const supabaseClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error('JWT verification failed:', claimsError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const callerId = claimsData.claims.sub;
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Verify caller has platform_admin role (only platform admins can create the initial admin)
    const { data: roles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', callerId)
      .eq('role', 'platform_admin');

    // Allow if no platform_admin exists yet (first-time setup) or if caller is platform_admin
    const { count: adminCount } = await supabaseAdmin
      .from('user_roles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'platform_admin');

    const isFirstTimeSetup = adminCount === 0;
    const isExistingAdmin = roles && roles.length > 0;

    if (!isFirstTimeSetup && !isExistingAdmin) {
      console.error('Unauthorized platform admin creation attempt by:', callerId);
      return new Response(
        JSON.stringify({ error: 'Forbidden - Only platform admins can create new platform admins' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(isFirstTimeSetup ? 'First-time platform admin setup' : `Platform admin action by ${callerId}`);
    // ============ END AUTHORIZATION CHECK ============
    
    // Security: Get credentials from environment secrets instead of hardcoding
    const adminEmail = Deno.env.get('PLATFORM_ADMIN_EMAIL');
    const adminPassword = Deno.env.get('PLATFORM_ADMIN_PASSWORD');
    
    if (!adminEmail || !adminPassword) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Platform admin credentials not configured. Set PLATFORM_ADMIN_EMAIL and PLATFORM_ADMIN_PASSWORD secrets.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Security: Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(adminEmail)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid admin email format'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Security: Validate password strength
    if (adminPassword.length < 12) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Admin password must be at least 12 characters'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const companyName = 'Aura Intercept Platform';
    const companySlug = 'aura-intercept';

    console.log('Creating platform admin account for:', adminEmail);

    // Step 1: Create the user with auto-confirm
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: { full_name: 'Aura Intercept Admin' }
    });

    if (userError) {
      // Check if user already exists
      if (userError.message?.includes('already been registered')) {
        console.log('User already exists, checking if setup is complete...');
        
        // Get existing user
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listError) throw listError;
        
        const existingUser = users?.find(u => u.email === adminEmail);
        if (!existingUser) throw new Error('User exists but could not be found');
        
        // Check if role exists
        const { data: existingRole } = await supabaseAdmin
          .from('user_roles')
          .select('*')
          .eq('user_id', existingUser.id)
          .eq('role', 'platform_admin')
          .single();
        
        if (existingRole) {
          return new Response(JSON.stringify({
            success: true,
            message: 'Platform admin account already exists and is fully configured',
            userId: existingUser.id
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        // Continue setup with existing user
        console.log('Continuing setup for existing user:', existingUser.id);
        
        // Assign platform_admin role
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .insert({ user_id: existingUser.id, role: 'platform_admin' });
        
        if (roleError && !roleError.message?.includes('duplicate')) {
          console.error('Role assignment error:', roleError);
          throw roleError;
        }

        // Create or get company
        let companyId: string;
        const { data: existingCompany } = await supabaseAdmin
          .from('companies')
          .select('id')
          .eq('slug', companySlug)
          .single();

        if (existingCompany) {
          companyId = existingCompany.id;
        } else {
          const { data: newCompany, error: companyError } = await supabaseAdmin
            .from('companies')
            .insert({
              name: companyName,
              slug: companySlug,
              primary_color: '#6366F1',
              secondary_color: '#8B5CF6'
            })
            .select('id')
            .single();

          if (companyError) throw companyError;
          companyId = newCompany.id;
        }

        // Update profile
        await supabaseAdmin
          .from('profiles')
          .update({ company_id: companyId, full_name: 'Aura Intercept Admin' })
          .eq('id', existingUser.id);

        return new Response(JSON.stringify({
          success: true,
          message: 'Platform admin setup completed for existing user',
          userId: existingUser.id,
          companyId
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      throw userError;
    }

    const userId = userData.user!.id;
    console.log('User created with ID:', userId);

    // Step 2: Create the company
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .insert({
        name: companyName,
        slug: companySlug,
        primary_color: '#6366F1',
        secondary_color: '#8B5CF6'
      })
      .select('id')
      .single();

    if (companyError) {
      console.error('Company creation error:', companyError);
      throw companyError;
    }

    console.log('Company created with ID:', company.id);

    // Step 3: Assign platform_admin role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({ user_id: userId, role: 'platform_admin' });

    if (roleError) {
      console.error('Role assignment error:', roleError);
      throw roleError;
    }

    console.log('Platform admin role assigned');

    // Step 4: Update user profile with company_id
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        company_id: company.id,
        full_name: 'Aura Intercept Admin'
      })
      .eq('id', userId);

    if (profileError) {
      console.error('Profile update error:', profileError);
      throw profileError;
    }

    console.log('Profile updated with company_id');

    return new Response(JSON.stringify({
      success: true,
      message: 'Platform admin account created successfully',
      userId,
      companyId: company.id
      // Note: Credentials are not returned for security
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error creating platform admin:', error);
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
