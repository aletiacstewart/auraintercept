import { createClient } from 'npm:@supabase/supabase-js@2';
import { getCompanyTerminology } from '../_shared/terminology.ts';
import { sendGuardedEmail } from '../_shared/email-guard.ts';
import { sendGuardedSms } from '../_shared/sms-guard.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReviewRequestPayload {
  jobAssignmentId: string;
}

function replaceTemplateVariables(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  return result;
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

    // Idempotency guard: atomically claim the job by stamping
    // review_request_sent_at. If another caller already claimed it, bail with
    // a 200 and skip sending — prevents duplicate SMS/email when both the
    // completion trigger and a follow-up call try to send.
    const nowIso = new Date().toISOString();
    const { data: claimed, error: claimErr } = await supabase
      .from('job_assignments')
      .update({ review_request_sent_at: nowIso })
      .eq('id', jobAssignmentId)
      .is('review_request_sent_at', null)
      .select('id')
      .maybeSingle();

    if (claimErr) {
      console.error('[Review Request] Idempotency claim failed:', claimErr);
    } else if (!claimed) {
      console.log(`[Review Request] Already sent for job ${jobAssignmentId}; skipping.`);
      return new Response(
        JSON.stringify({ success: true, skipped: 'already_sent', results: { sms: null, email: null } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch job assignment with related data including company review settings
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
            slug,
            review_request_enabled,
            review_request_delay_hours,
            review_google_url,
            review_yelp_url,
            review_facebook_url,
            review_sms_template,
            review_email_subject,
            review_email_template
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

    // Check if review requests are enabled
    if (company?.review_request_enabled === false) {
      console.log('[Review Request] Review requests are disabled for this company');
      return new Response(
        JSON.stringify({ success: true, message: 'Review requests disabled', results: { sms: null, email: null } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const companyName = company?.name || 'Our Business';
    const customerName = appointment?.customer_name || 'Valued Customer';
    const technicianName = employee?.full_name || 'Our Technician';
    const term = await getCompanyTerminology(supabase, appointment.company_id);
    const serviceType = appointment?.service_type || term.serviceType.toLowerCase();

    // Template variables
    const templateVars = {
      customer_name: customerName,
      company_name: companyName,
      technician_name: technicianName,
      service_type: serviceType,
      job_noun: term.job,
      appointment_noun: term.appointment,
    };

    // Fetch company's integration credentials
    const { data: integrations } = await supabase
      .from('tenant_integrations')
      .select('signalwire_project_id, signalwire_api_token, signalwire_phone_number, signalwire_space_url, resend_api_key')
      .eq('company_id', appointment.company_id)
      .maybeSingle();

    const results: any = { sms: null, email: null };

    // Default templates
    const defaultSms = 'Hi {customer_name}! Thank you for choosing {company_name}. We hope {technician_name} provided excellent {service_type} service. Would you take a moment to leave us a 5-star review? It helps our small business grow! ⭐⭐⭐⭐⭐';
    const defaultEmailSubject = 'How was your experience? - {company_name}';

    // Get templates (use company custom or defaults)
    const smsTemplate = replaceTemplateVariables(
      company?.review_sms_template || defaultSms,
      templateVars
    );

    const emailSubject = replaceTemplateVariables(
      company?.review_email_subject || defaultEmailSubject,
      templateVars
    );

    // Build review links for email
    const reviewLinks: string[] = [];
    if (company?.review_google_url) {
      reviewLinks.push(`<a href="${company.review_google_url}" style="display:inline-block;padding:12px 30px;background:#4285F4;color:white;text-decoration:none;border-radius:6px;margin:10px 5px;">Leave a Google Review</a>`);
    }
    if (company?.review_yelp_url) {
      reviewLinks.push(`<a href="${company.review_yelp_url}" style="display:inline-block;padding:12px 30px;background:#D32323;color:white;text-decoration:none;border-radius:6px;margin:10px 5px;">Leave a Yelp Review</a>`);
    }
    if (company?.review_facebook_url) {
      reviewLinks.push(`<a href="${company.review_facebook_url}" style="display:inline-block;padding:12px 30px;background:#1877F2;color:white;text-decoration:none;border-radius:6px;margin:10px 5px;">Leave a Facebook Review</a>`);
    }
    
    // Fallback to Google search if no custom links
    if (reviewLinks.length === 0) {
      reviewLinks.push(`<a href="https://www.google.com/search?q=${encodeURIComponent(companyName + ' reviews')}" style="display:inline-block;padding:12px 30px;background:#4F46E5;color:white;text-decoration:none;border-radius:6px;margin:10px 5px;">Leave a Google Review</a>`);
    }

    // Build email HTML
    const emailBody = company?.review_email_template 
      ? replaceTemplateVariables(company.review_email_template, templateVars)
      : `Hi ${customerName},

We hope ${technicianName} provided you with excellent ${serviceType} service today!

Your feedback means the world to us. If you were happy with our service, we'd really appreciate it if you could take a moment to leave us a review.

⭐⭐⭐⭐⭐

Your 5-star review helps our small business grow and allows us to continue providing great service to customers like you.

Thank you again for your business!

Best regards,
The ${companyName} Team`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; }
          .stars { font-size: 32px; color: #FFD700; text-align: center; margin: 20px 0; }
          .content { padding: 20px; background: #f9f9f9; border-radius: 8px; white-space: pre-line; }
          .buttons { text-align: center; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Thank You for Choosing ${companyName}!</h1>
          </div>
          
          <div class="content">
            ${emailBody.replace(/\n/g, '<br>')}
          </div>
          
          <div class="stars">⭐⭐⭐⭐⭐</div>
          
          <div class="buttons">
            ${reviewLinks.join('\n')}
          </div>
          
          <div class="footer">
            <p>If you have any concerns about your service, please reply to this email and we'll make it right.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send SMS notification
    if (integrations?.signalwire_project_id && integrations?.signalwire_api_token && integrations?.signalwire_phone_number && integrations?.signalwire_space_url) {
      const phoneNumber = appointment.customer_phone;

      if (phoneNumber) {
        try {
          const smsResult = await sendGuardedSms({
            supabase,
            companyId: appointment.company_id,
            from: integrations.signalwire_phone_number,
            to: phoneNumber,
            body: smsTemplate,
            source: 'aura',
            customerName: appointment.customer_name,
          });
          if (smsResult.ok) {
            results.sms = { success: true, messageSid: smsResult.providerMessageId };
            console.log(`[Review Request] SMS sent successfully:`, smsResult.providerMessageId);
          } else {
            results.sms = { success: false, error: smsResult.error };
            console.error('[Review Request] SMS failed:', smsResult.error);
          }
        } catch (smsError) {
          console.error('[Review Request] SMS send error:', smsError);
          results.sms = { success: false, error: smsError };
        }
      } else {
        console.log('[Review Request] No customer phone number available');
      }
    } else {
      console.log('[Review Request] SignalWire not configured');
    }

    // Send Email notification if Resend is configured
    if (integrations?.resend_api_key) {
      const emailAddress = appointment.customer_email;

      if (emailAddress) {
        try {
          const guarded = await sendGuardedEmail({
            supabase,
            resendApiKey: integrations.resend_api_key,
            companyId: appointment.company_id,
            from: `${companyName} <ai@auraintercept.ai>`,
            to: [emailAddress],
            subject: emailSubject,
            html: emailHtml,
            template: 'review_request',
            priority: 'normal',
          });
          if (guarded.sent) {
            results.email = { success: true, id: (guarded.data as { id?: string })?.id };
            console.log('[Review Request] Email sent successfully');
          } else {
            results.email = { success: false, error: guarded.reason || guarded.error };
            console.error('[Review Request] Email blocked/failed:', guarded.reason);
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
