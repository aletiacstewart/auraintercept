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

    const { email, password, fullName, companyId } = await req.json();

    if (!email || !password || !companyId) {
      return new Response(
        JSON.stringify({ error: 'Email, password, and companyId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create user
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName || 'Demo Employee' }
    });

    if (createError) {
      console.error('Error creating user:', createError);
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = userData.user.id;

    // Update profile with company_id
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ company_id: companyId, full_name: fullName || 'Demo Employee' })
      .eq('id', userId);

    if (profileError) {
      console.error('Error updating profile:', profileError);
    }

    // Assign employee role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({ user_id: userId, role: 'employee' });

    if (roleError) {
      console.error('Error assigning role:', roleError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        userId, 
        email,
        message: 'Demo employee account created successfully' 
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
