import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const body = await req.json();
    const { action, email, password, fullName, role, companyId, oldEmail, newEmail } = body;

    if (action === 'delete') {
      // Delete user by email
      if (!email) {
        return new Response(
          JSON.stringify({ error: 'Email is required for delete' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Find user
      const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (listError) {
        console.error('Error listing users:', listError);
        return new Response(
          JSON.stringify({ error: 'Failed to list users' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const user = usersData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'User not found', email }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Delete from user_roles first
      await supabaseAdmin.from('user_roles').delete().eq('user_id', user.id);
      
      // Delete from employee_job_assignments
      await supabaseAdmin.from('employee_job_assignments').delete().eq('employee_id', user.id);

      // Delete from profiles
      await supabaseAdmin.from('profiles').delete().eq('id', user.id);

      // Delete the auth user
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
      if (deleteError) {
        console.error('Error deleting user:', deleteError);
        return new Response(
          JSON.stringify({ error: 'Failed to delete user', details: deleteError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`User deleted: ${email}`);
      return new Response(
        JSON.stringify({ success: true, message: `User ${email} deleted successfully` }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'create') {
      if (!email || !password || !role) {
        return new Response(
          JSON.stringify({ error: 'Email, password, and role are required for create' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create user
      const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName || email.split('@')[0] }
      });

      if (createError) {
        console.error('Error creating user:', createError);
        return new Response(
          JSON.stringify({ error: createError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const userId = userData.user.id;

      // Update profile with company_id if provided
      if (companyId) {
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update({ company_id: companyId, full_name: fullName || email.split('@')[0] })
          .eq('id', userId);

        if (profileError) {
          console.error('Error updating profile:', profileError);
        }
      } else {
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update({ full_name: fullName || email.split('@')[0] })
          .eq('id', userId);

        if (profileError) {
          console.error('Error updating profile:', profileError);
        }
      }

      // Assign role
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({ user_id: userId, role: role });

      if (roleError) {
        console.error('Error assigning role:', roleError);
      }

      console.log(`User created: ${email} with role ${role}`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          userId,
          email,
          role,
          message: `User ${email} created successfully with role ${role}` 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'update_email') {
      if (!oldEmail || !newEmail) {
        return new Response(
          JSON.stringify({ error: 'oldEmail and newEmail are required for update_email' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Find user by old email
      const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (listError) {
        console.error('Error listing users:', listError);
        return new Response(
          JSON.stringify({ error: 'Failed to list users' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const user = usersData.users.find(u => u.email?.toLowerCase() === oldEmail.toLowerCase());
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'User not found', oldEmail }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update the auth user email
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        email: newEmail,
        email_confirm: true
      });

      if (updateError) {
        console.error('Error updating user email:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update user email', details: updateError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Also update the profiles table email
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ email: newEmail, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (profileError) {
        console.error('Error updating profile email:', profileError);
      }

      console.log(`User email updated: ${oldEmail} -> ${newEmail}`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          oldEmail,
          newEmail,
          message: `User email updated from ${oldEmail} to ${newEmail}` 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use "create", "delete", or "update_email"' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
