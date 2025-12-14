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
    
    // Create admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { companyId, adminEmail, adminName } = await req.json();

    if (!companyId || !adminEmail) {
      return new Response(
        JSON.stringify({ error: 'Company ID and admin email are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Creating admin for company ${companyId} with email ${adminEmail}`);

    // Generate a temporary password
    const tempPassword = crypto.randomUUID().slice(0, 12) + 'Aa1!';

    // Create the user account
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: tempPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: adminName || adminEmail.split('@')[0],
      },
    });

    if (authError) {
      console.error('Auth error:', authError);
      
      if (authError.message?.includes('already been registered')) {
        return new Response(
          JSON.stringify({ error: 'This email is already registered. Please use a different email.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw authError;
    }

    const userId = authData.user.id;
    console.log(`User created with ID: ${userId}`);

    // Update the profile with company_id
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        company_id: companyId,
        full_name: adminName || adminEmail.split('@')[0],
      })
      .eq('id', userId);

    if (profileError) {
      console.error('Profile error:', profileError);
      // Don't throw - the trigger might handle this
    }

    // Assign company_admin role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'company_admin',
      });

    if (roleError) {
      console.error('Role error:', roleError);
      throw roleError;
    }

    console.log(`Company admin role assigned to user ${userId}`);

    // Send password reset email so they can set their own password
    const { error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: adminEmail,
      options: {
        redirectTo: `${req.headers.get('origin')}/auth`,
      },
    });

    if (resetError) {
      console.warn('Could not generate password reset link:', resetError);
      // Don't fail the whole operation for this
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Company admin created successfully',
        userId,
        tempPassword, // Return temp password so platform admin can share it
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error creating company admin:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create company admin';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
