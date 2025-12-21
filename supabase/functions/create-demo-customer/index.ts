import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { email, password, fullName, companyIds } = await req.json();

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

    // Update profile (no company_id for customers - they can be associated with multiple companies)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ full_name: fullName || 'Demo Customer' })
      .eq('id', userId);

    if (profileError) {
      console.error('Error updating profile:', profileError);
    }

    // Assign customer role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({ user_id: userId, role: 'customer' });

    if (roleError) {
      console.error('Error assigning role:', roleError);
    }

    // Create company associations if companyIds provided
    if (companyIds && Array.isArray(companyIds) && companyIds.length > 0) {
      for (const companyId of companyIds) {
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
        message: 'Demo customer account created successfully' 
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
