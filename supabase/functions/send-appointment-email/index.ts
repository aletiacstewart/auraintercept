import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend@4.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  appointmentId: string;
  type: 'confirmation' | 'cancellation' | 'reminder';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { appointmentId, type }: EmailRequest = await req.json();

    if (!appointmentId || !type) {
      return new Response(
        JSON.stringify({ error: 'appointmentId and type are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${type} email for appointment ${appointmentId}`);

    // Fetch appointment with company details
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        *,
        companies:company_id (
          id,
          name,
          primary_color
        )
      `)
      .eq('id', appointmentId)
      .single();

    if (appointmentError || !appointment) {
      console.error('Appointment fetch error:', appointmentError);
      return new Response(
        JSON.stringify({ error: 'Appointment not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!appointment.customer_email) {
      console.log('No customer email provided, skipping email notification');
      return new Response(
        JSON.stringify({ success: true, message: 'No customer email, skipped' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch company's Resend API key from tenant_integrations
    const { data: integrations, error: integrationsError } = await supabase
      .from('tenant_integrations')
      .select('resend_api_key')
      .eq('company_id', appointment.company_id)
      .maybeSingle();

    if (integrationsError) {
      console.error('Integration fetch error:', integrationsError);
    }

    if (!integrations?.resend_api_key) {
      console.log('No Resend API key configured for this company, skipping email');
      return new Response(
        JSON.stringify({ success: true, message: 'Resend not configured, skipped' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Resend with company's API key
    const resend = new Resend(integrations.resend_api_key);
    const company = appointment.companies;
    const companyName = company?.name || 'Our Business';
    const primaryColor = company?.primary_color || '#0EA5E9';

    // Format appointment datetime
    const appointmentDate = new Date(appointment.datetime);
    const dateStr = appointmentDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const timeStr = appointmentDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    // Fetch custom email template if exists
    const { data: customTemplate } = await supabase
      .from('email_templates')
      .select('*')
      .eq('company_id', appointment.company_id)
      .eq('template_type', type)
      .maybeSingle();

    // Default templates
    const defaultTemplates: Record<string, { subject: string; heading: string; message: string; show_portal_link: boolean }> = {
      confirmation: {
        subject: `Appointment Confirmed - ${companyName}`,
        heading: 'Your Appointment is Confirmed!',
        message: `Thank you for booking with ${companyName}. We look forward to seeing you.`,
        show_portal_link: true,
      },
      cancellation: {
        subject: `Appointment Cancelled - ${companyName}`,
        heading: 'Your Appointment Has Been Cancelled',
        message: `Your appointment with ${companyName} has been cancelled. If you did not request this cancellation, please contact us.`,
        show_portal_link: false,
      },
      reminder: {
        subject: `Appointment Reminder - ${companyName}`,
        heading: 'Appointment Reminder',
        message: `This is a friendly reminder about your upcoming appointment with ${companyName}.`,
        show_portal_link: true,
      },
    };

    // Use custom template or default
    const template = customTemplate || defaultTemplates[type];
    
    // Replace placeholders in template
    const replacePlaceholders = (text: string) => {
      return text
        .replace(/\{\{company_name\}\}/g, companyName)
        .replace(/\{\{customer_name\}\}/g, appointment.customer_name)
        .replace(/\{\{service_type\}\}/g, appointment.service_type)
        .replace(/\{\{date\}\}/g, dateStr)
        .replace(/\{\{time\}\}/g, timeStr)
        .replace(/\{\{duration\}\}/g, String(appointment.duration_minutes));
    };

    const subject = replacePlaceholders(template.subject);
    const heading = replacePlaceholders(template.heading);
    const message = replacePlaceholders(template.message);
    const showPortalLink = template.show_portal_link;

    // Generate portal link
    const portalUrl = `https://zwlcwtgjvesbevheknbk.lovable.app/appointment?token=${appointment.customer_token}`;
    const portalSection = showPortalLink ? `
      <div style="text-align: center; margin: 24px 0;">
        <a href="${portalUrl}" style="display: inline-block; background: ${primaryColor}; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
          Manage Your Appointment
        </a>
        <p style="color: #6b7280; font-size: 12px; margin-top: 12px;">
          Reschedule or cancel your appointment online
        </p>
      </div>
    ` : '';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: ${primaryColor}; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">${companyName}</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
            <h2 style="color: ${primaryColor}; margin-top: 0;">${heading}</h2>
            <p>${message}</p>
            
            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #374151;">Appointment Details</h3>
              <p style="margin: 8px 0;"><strong>Service:</strong> ${appointment.service_type}</p>
              <p style="margin: 8px 0;"><strong>Date:</strong> ${dateStr}</p>
              <p style="margin: 8px 0;"><strong>Time:</strong> ${timeStr}</p>
              <p style="margin: 8px 0;"><strong>Duration:</strong> ${appointment.duration_minutes} minutes</p>
              ${appointment.notes ? `<p style="margin: 8px 0;"><strong>Notes:</strong> ${appointment.notes}</p>` : ''}
            </div>
            
            <div style="background: #f3f4f6; border-radius: 6px; padding: 16px; margin: 20px 0;">
              <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #374151;">Reminder Preferences</p>
              <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                ${appointment.customer_phone ? `
                  <span style="display: inline-block; padding: 4px 10px; border-radius: 4px; font-size: 12px; ${!appointment.sms_opt_out ? 'background: #dcfce7; color: #166534;' : 'background: #f3f4f6; color: #6b7280; text-decoration: line-through;'}">
                    📱 SMS ${!appointment.sms_opt_out ? 'On' : 'Off'}
                  </span>
                  <span style="display: inline-block; padding: 4px 10px; border-radius: 4px; font-size: 12px; ${!appointment.call_opt_out ? 'background: #dcfce7; color: #166534;' : 'background: #f3f4f6; color: #6b7280; text-decoration: line-through;'}">
                    📞 Call ${!appointment.call_opt_out ? 'On' : 'Off'}
                  </span>
                ` : ''}
                ${appointment.customer_email ? `
                  <span style="display: inline-block; padding: 4px 10px; border-radius: 4px; font-size: 12px; ${!appointment.email_opt_out ? 'background: #dcfce7; color: #166534;' : 'background: #f3f4f6; color: #6b7280; text-decoration: line-through;'}">
                    ✉️ Email ${!appointment.email_opt_out ? 'On' : 'Off'}
                  </span>
                ` : ''}
              </div>
              <p style="margin: 8px 0 0 0; font-size: 11px; color: #6b7280;">
                You can update your reminder preferences anytime using the link below.
              </p>
            </div>
            
            ${portalSection}
            
            <p style="color: #6b7280; font-size: 14px;">
              If you have any questions, please don't hesitate to contact us.
            </p>
            
            <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">
              This email was sent by ${companyName}. Please do not reply to this email.
            </p>
          </div>
        </body>
      </html>
    `;

    // Send email
    const { data: emailResult, error: emailError } = await resend.emails.send({
      from: `${companyName} <onboarding@resend.dev>`,
      to: [appointment.customer_email],
      subject,
      html,
    });

    if (emailError) {
      console.error('Email send error:', emailError);
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: emailError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Email sent successfully:', emailResult);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResult?.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error sending appointment email:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to send email';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
