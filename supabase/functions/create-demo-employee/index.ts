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

    const { email, password, fullName, companyId, jobType, mustChangePassword, sendWelcomeEmail } = await req.json();

    if (!email || !password || !companyId) {
      return new Response(
        JSON.stringify({ error: 'Email, password, and companyId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Creating employee account for ${email} in company ${companyId}`);

    // Create user
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName || 'Employee' }
    });

    if (createError) {
      console.error('Error creating user:', createError);
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = userData.user.id;

    // Update profile with company_id and must_change_password flag
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        company_id: companyId, 
        full_name: fullName || 'Employee',
        must_change_password: mustChangePassword || false,
        email: email
      })
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

    // Assign job type if provided
    if (jobType) {
      const { error: jobTypeError } = await supabaseAdmin
        .from('employee_job_assignments')
        .insert({ 
          employee_id: userId, 
          company_id: companyId,
          job_type: jobType 
        });

      if (jobTypeError) {
        console.error('Error assigning job type:', jobTypeError);
      }
    }

    // Get company name for email
    const { data: companyData } = await supabaseAdmin
      .from('companies')
      .select('name')
      .eq('id', companyId)
      .single();

    // Send welcome email with temporary password if requested
    if (sendWelcomeEmail) {
      const resendApiKey = Deno.env.get('RESEND_API_KEY');
      if (resendApiKey) {
        try {
          const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'Aura <noreply@updates.bframetech.com>',
              to: [email],
              subject: `Welcome to ${companyData?.name || 'the team'} - Your Account Details`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h1 style="color: #0EA5E9;">Welcome to ${companyData?.name || 'the team'}!</h1>
                  <p>Hi ${fullName || 'there'},</p>
                  <p>Your employee account has been created. Here are your login details:</p>
                  <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0;"><strong>Email:</strong> ${email}</p>
                    <p style="margin: 10px 0 0;"><strong>Temporary Password:</strong> <code style="background: #e5e7eb; padding: 2px 8px; border-radius: 4px;">${password}</code></p>
                  </div>
                  <p style="color: #dc2626;"><strong>Important:</strong> You will be required to change your password when you first log in.</p>
                  <p>You can access your dashboard at:</p>
                  <ul>
                    <li><strong>Employee Dashboard:</strong> For managing your schedule and tasks</li>
                    <li><strong>Field Ops App:</strong> For technicians in the field</li>
                  </ul>
                  <p>If you have any questions, please contact your company administrator.</p>
                  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
                  <p style="color: #6b7280; font-size: 12px;">This is an automated message from Aura. Please do not reply to this email.</p>
                </div>
              `,
            }),
          });

          if (!emailResponse.ok) {
            console.error('Failed to send welcome email:', await emailResponse.text());
          } else {
            console.log('Welcome email sent successfully to', email);
          }
        } catch (emailError) {
          console.error('Error sending welcome email:', emailError);
        }
      } else {
        console.log('RESEND_API_KEY not configured, skipping welcome email');
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        userId, 
        email,
        jobType: jobType || null,
        mustChangePassword: mustChangePassword || false,
        message: 'Employee account created successfully' 
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
