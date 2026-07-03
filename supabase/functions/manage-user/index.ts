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

    // Create admin client for role check
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Verify caller has admin role (platform_admin or company_admin)
    const { data: roles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', callerId)
      .in('role', ['platform_admin', 'company_admin']);

    if (rolesError || !roles || roles.length === 0) {
      console.error('Admin role check failed:', rolesError);
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isPlatformAdmin = roles.some(r => r.role === 'platform_admin');
    // Resolve caller's company so company_admins are strictly scoped to their own tenant.
    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('company_id')
      .eq('id', callerId)
      .maybeSingle();
    const callerCompanyId = callerProfile?.company_id ?? null;

    // Helper: for company_admins, require the target user (looked up by email) to be
    // in the same company as the caller. Also blocks operating on platform_admins.
    const assertTargetInCallerCompany = async (targetEmail: string): Promise<{ ok: true; targetId: string } | { ok: false; response: Response }> => {
      const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
      const target = usersData?.users.find(u => u.email?.toLowerCase() === targetEmail.toLowerCase());
      if (!target) {
        return { ok: false, response: new Response(
          JSON.stringify({ error: 'User not found', email: targetEmail }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )};
      }
      if (isPlatformAdmin) return { ok: true, targetId: target.id };
      // company_admin: verify same tenant and target is not a platform_admin
      const [{ data: tProfile }, { data: tRoles }] = await Promise.all([
        supabaseAdmin.from('profiles').select('company_id').eq('id', target.id).maybeSingle(),
        supabaseAdmin.from('user_roles').select('role').eq('user_id', target.id),
      ]);
      const targetIsPlatformAdmin = (tRoles ?? []).some((r: { role: string }) => r.role === 'platform_admin');
      if (targetIsPlatformAdmin) {
        return { ok: false, response: new Response(
          JSON.stringify({ error: 'Forbidden - cannot operate on platform admin accounts' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )};
      }
      if (!callerCompanyId || tProfile?.company_id !== callerCompanyId) {
        return { ok: false, response: new Response(
          JSON.stringify({ error: 'Forbidden - target user is not in your company' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )};
      }
      return { ok: true, targetId: target.id };
    };

    console.log(`Admin action by user ${callerId} with roles ${roles.map(r=>r.role).join(',')}`);
    // ============ END AUTHORIZATION CHECK ============

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

      const scope = await assertTargetInCallerCompany(email);
      if (!scope.ok) return scope.response;
      const user = { id: scope.targetId };

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

      // Only platform_admin can mint platform_admin accounts. company_admin can only
      // create users in their own company, and cannot escalate to platform_admin.
      const ALLOWED_ROLES_FOR_COMPANY_ADMIN = new Set(['company_admin', 'employee', 'customer', 'technician']);
      if (!isPlatformAdmin) {
        if (role === 'platform_admin' || !ALLOWED_ROLES_FOR_COMPANY_ADMIN.has(role)) {
          return new Response(
            JSON.stringify({ error: 'Forbidden - cannot assign that role' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        // Force the new user into caller's company
        if (!callerCompanyId) {
          return new Response(
            JSON.stringify({ error: 'Forbidden - caller has no company scope' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        if (companyId && companyId !== callerCompanyId) {
          return new Response(
            JSON.stringify({ error: 'Forbidden - cannot create users in another company' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
      const effectiveCompanyId = isPlatformAdmin ? companyId : callerCompanyId;

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
      if (effectiveCompanyId) {
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update({ company_id: effectiveCompanyId, full_name: fullName || email.split('@')[0] })
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

      const scope = await assertTargetInCallerCompany(oldEmail);
      if (!scope.ok) return scope.response;
      const user = { id: scope.targetId };

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
