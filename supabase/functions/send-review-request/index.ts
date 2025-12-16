import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReviewRequestPayload {
  jobAssignmentId: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { jobAssignmentId }: ReviewRequestPayload = await req.json();

    if (!jobAssignmentId) {
      return new Response(
        JSON.stringify({ error: 'jobAssignmentId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Review Request] Processing review request for job: ${jobAssignmentId}`);

    // Fetch job assignment with related data
    const { data: jobAssignment, error: jobError } = await supabase
      .from('job_assignments')
      .select(`
        *,
        appointments:appointment_id (
          id,
          customer_name,
          customer_phone,
          customer_email,
          service_type,
          datetime,
          company_id,
          companies:company_id (
            id,
            name,
            slug
          )
        ),
        employee:employee_id (
          id,
          full_name
        )
      `)
      .eq('id', jobAssignmentId)
      .single();

    if (jobError || !jobAssignment) {
      console.error('Job assignment fetch error:', jobError);
      return new Response(
        JSON.stringify({ error: 'Job assignment not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const appointment = jobAssignment.appointments;
    const employee = jobAssignment.employee;
    const company = appointment?.companies;
    const companyName = company?.name || 'Our Business';
    const customerName = appointment?.customer_name || 'Valued Customer';
    const technicianName = employee?.full_name || 'Our Technician';
    const serviceType = appointment?.service_type || 'service';

    // Fetch company's integration credentials
    const { data: integrations } = await supabase
      .from('tenant_integrations')
      .select('twilio_account_sid, twilio_auth_token, twilio_phone_number, resend_api_key')
      .eq('company_id', appointment.company_id)
      .maybeSingle();

    const results: any = { sms: null, email: null };

    // Review request templates
    const smsTemplate = `Hi ${customerName}! Thank you for choosing ${companyName}. We hope ${technicianName} provided excellent ${serviceType} service. Would you take a moment to leave us a 5-star review? It helps our small business grow! ⭐⭐⭐⭐⭐`;

    const emailSubject = `How was your experience? - ${companyName}`;
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; }
          .stars { font-size: 32px; color: #FFD700; text-align: center; margin: 20px 0; }
          .content { padding: 20px; background: #f9f9f9; border-radius: 8px; }
          .cta-button { display: inline-block; padding: 12px 30px; background: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Thank You for Choosing ${companyName}!</h1>
          </div>
          
          <div class="content">
            <p>Hi ${customerName},</p>
            
            <p>We hope <strong>${technicianName}</strong> provided you with excellent <strong>${serviceType}</strong> service today!</p>
            
            <p>Your feedback means the world to us. If you were happy with our service, we'd really appreciate it if you could take a moment to leave us a review.</p>
            
            <div class="stars">⭐⭐⭐⭐⭐</div>
            
            <p style="text-align: center;">
              <a href="https://www.google.com/search?q=${encodeURIComponent(companyName + ' reviews')}" class="cta-button">Leave a Google Review</a>
            </p>
            
            <p>Your 5-star review helps our small business grow and allows us to continue providing great service to customers like you.</p>
            
            <p>Thank you again for your business!</p>
            
            <p>Best regards,<br>The ${companyName} Team</p>
          </div>
          
          <div class="footer">
            <p>If you have any concerns about your service, please reply to this email and we'll make it right.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send SMS notification
    if (integrations?.twilio_account_sid && integrations?.twilio_auth_token && integrations?.twilio_phone_number) {
      const phoneNumber = appointment.customer_phone;

      if (phoneNumber) {
        try {
          const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${integrations.twilio_account_sid}/Messages.json`;
          const credentials = btoa(`${integrations.twilio_account_sid}:${integrations.twilio_auth_token}`);

          const formData = new URLSearchParams();
          formData.append('To', phoneNumber);
          formData.append('From', integrations.twilio_phone_number);
          formData.append('Body', smsTemplate);

          const twilioResponse = await fetch(twilioUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${credentials}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString(),
          });

          const twilioResult = await twilioResponse.json();

          if (twilioResponse.ok) {
            results.sms = { success: true, messageSid: twilioResult.sid };
            console.log(`[Review Request] SMS sent successfully:`, twilioResult.sid);
          } else {
            results.sms = { success: false, error: twilioResult };
            console.error('[Review Request] Twilio error:', twilioResult);
          }
        } catch (smsError) {
          console.error('[Review Request] SMS send error:', smsError);
          results.sms = { success: false, error: smsError };
        }
      } else {
        console.log('[Review Request] No customer phone number available');
      }
    } else {
      console.log('[Review Request] Twilio not configured');
    }

    // Send Email notification if Resend is configured
    if (integrations?.resend_api_key) {
      const emailAddress = appointment.customer_email;

      if (emailAddress) {
        try {
          const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${integrations.resend_api_key}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: `${companyName} <onboarding@resend.dev>`,
              to: [emailAddress],
              subject: emailSubject,
              html: emailHtml,
            }),
          });

          const emailResult = await emailResponse.json();

          if (emailResponse.ok) {
            results.email = { success: true, id: emailResult.id };
            console.log(`[Review Request] Email sent successfully:`, emailResult.id);
          } else {
            results.email = { success: false, error: emailResult };
            console.error('[Review Request] Resend error:', emailResult);
          }
        } catch (emailError) {
          console.error('[Review Request] Email send error:', emailError);
          results.email = { success: false, error: emailError };
        }
      } else {
        console.log('[Review Request] No customer email available');
      }
    } else {
      console.log('[Review Request] Resend not configured');
    }

    // Log the review request
    console.log(`[Review Request] Completed for job ${jobAssignmentId}:`, results);

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[Review Request] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to send review request';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
