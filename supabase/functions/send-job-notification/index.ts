import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  jobAssignmentId: string;
  notificationType: 'assigned' | 'accepted' | 'en_route' | 'arrived' | 'completed';
  recipientType: 'customer' | 'employee';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { jobAssignmentId, notificationType, recipientType }: NotificationRequest = await req.json();

    if (!jobAssignmentId || !notificationType || !recipientType) {
      return new Response(
        JSON.stringify({ error: 'jobAssignmentId, notificationType, and recipientType are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Job Notification] Processing ${notificationType} notification for ${recipientType}`);

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
            name
          )
        ),
        employee:employee_id (
          id,
          full_name,
          email,
          phone_number,
          sms_notifications_enabled,
          email_notifications_enabled
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

    // Format appointment datetime
    const appointmentDate = appointment?.datetime ? new Date(appointment.datetime) : new Date();
    const dateStr = appointmentDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    const timeStr = appointmentDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    // Fetch company's Twilio credentials
    const { data: integrations } = await supabase
      .from('tenant_integrations')
      .select('twilio_account_sid, twilio_auth_token, twilio_phone_number, resend_api_key')
      .eq('company_id', appointment.company_id)
      .maybeSingle();

    const results: any = { sms: null, email: null };

    // Generate appropriate message based on notification type and recipient
    const messages = generateMessages(
      notificationType,
      recipientType,
      {
        customerName: appointment.customer_name,
        employeeName: employee?.full_name || 'Technician',
        serviceType: appointment.service_type,
        companyName,
        dateStr,
        timeStr,
        address: jobAssignment.customer_address || 'Address on file',
        estimatedArrival: jobAssignment.estimated_arrival_minutes,
      }
    );

    // Send SMS notification
    if (integrations?.twilio_account_sid && integrations?.twilio_auth_token && integrations?.twilio_phone_number) {
      const phoneNumber = recipientType === 'customer' 
        ? appointment.customer_phone 
        : employee?.phone_number;

      if (phoneNumber) {
        const smsEnabled = recipientType === 'customer' || employee?.sms_notifications_enabled !== false;
        
        if (smsEnabled) {
          try {
            const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${integrations.twilio_account_sid}/Messages.json`;
            const credentials = btoa(`${integrations.twilio_account_sid}:${integrations.twilio_auth_token}`);

            const formData = new URLSearchParams();
            formData.append('To', phoneNumber);
            formData.append('From', integrations.twilio_phone_number);
            formData.append('Body', messages.sms);

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
              console.log(`[Job Notification] SMS sent successfully to ${recipientType}:`, twilioResult.sid);
            } else {
              results.sms = { success: false, error: twilioResult };
              console.error('[Job Notification] Twilio error:', twilioResult);
            }
          } catch (smsError) {
            console.error('[Job Notification] SMS send error:', smsError);
            results.sms = { success: false, error: smsError };
          }
        }
      }
    }

    // Send Email notification if Resend is configured
    if (integrations?.resend_api_key) {
      const emailAddress = recipientType === 'customer' 
        ? appointment.customer_email 
        : employee?.email;

      if (emailAddress) {
        const emailEnabled = recipientType === 'customer' || employee?.email_notifications_enabled !== false;
        
        if (emailEnabled) {
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
                subject: messages.emailSubject,
                html: messages.emailHtml,
              }),
            });

            const emailResult = await emailResponse.json();

            if (emailResponse.ok) {
              results.email = { success: true, id: emailResult.id };
              console.log(`[Job Notification] Email sent successfully to ${recipientType}:`, emailResult.id);
            } else {
              results.email = { success: false, error: emailResult };
              console.error('[Job Notification] Resend error:', emailResult);
            }
          } catch (emailError) {
            console.error('[Job Notification] Email send error:', emailError);
            results.email = { success: false, error: emailError };
          }
        }
      }
    }

    // Update job assignment notification flags for customer notifications
    if (recipientType === 'customer') {
      const updateField = `customer_notified_${notificationType}`;
      await supabase
        .from('job_assignments')
        .update({ [updateField]: true, updated_at: new Date().toISOString() })
        .eq('id', jobAssignmentId);
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[Job Notification] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to send notification';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateMessages(
  type: string,
  recipient: string,
  data: {
    customerName: string;
    employeeName: string;
    serviceType: string;
    companyName: string;
    dateStr: string;
    timeStr: string;
    address: string;
    estimatedArrival?: number;
  }
): { sms: string; emailSubject: string; emailHtml: string } {
  const { customerName, employeeName, serviceType, companyName, dateStr, timeStr, address, estimatedArrival } = data;

  const templates: Record<string, Record<string, { sms: string; emailSubject: string; emailHtml: string }>> = {
    assigned: {
      customer: {
        sms: `Hi ${customerName}! ${employeeName} from ${companyName} has been assigned to your ${serviceType} service on ${dateStr} at ${timeStr}. We'll notify you when they're on their way.`,
        emailSubject: `Technician Assigned - ${companyName}`,
        emailHtml: `
          <h2>Your Technician Has Been Assigned</h2>
          <p>Hi ${customerName},</p>
          <p><strong>${employeeName}</strong> has been assigned to your <strong>${serviceType}</strong> service.</p>
          <p><strong>When:</strong> ${dateStr} at ${timeStr}</p>
          <p>We'll send you updates when your technician is on their way.</p>
          <p>Thanks for choosing ${companyName}!</p>
        `,
      },
      employee: {
        sms: `NEW JOB: ${serviceType} for ${customerName} on ${dateStr} at ${timeStr}. Address: ${address}. Please accept or decline in your dashboard.`,
        emailSubject: `New Job Assignment - ${serviceType}`,
        emailHtml: `
          <h2>New Job Assignment</h2>
          <p>You have been assigned a new job:</p>
          <ul>
            <li><strong>Service:</strong> ${serviceType}</li>
            <li><strong>Customer:</strong> ${customerName}</li>
            <li><strong>Date/Time:</strong> ${dateStr} at ${timeStr}</li>
            <li><strong>Address:</strong> ${address}</li>
          </ul>
          <p>Please log into your dashboard to accept or decline this job.</p>
        `,
      },
    },
    accepted: {
      customer: {
        sms: `Great news, ${customerName}! ${employeeName} has confirmed your ${serviceType} appointment on ${dateStr} at ${timeStr}.${estimatedArrival ? ` Estimated arrival: ${estimatedArrival} minutes.` : ''} See you soon! - ${companyName}`,
        emailSubject: `Appointment Confirmed - ${companyName}`,
        emailHtml: `
          <h2>Your Appointment is Confirmed</h2>
          <p>Hi ${customerName},</p>
          <p><strong>${employeeName}</strong> has confirmed your appointment.</p>
          <p><strong>Service:</strong> ${serviceType}</p>
          <p><strong>When:</strong> ${dateStr} at ${timeStr}</p>
          ${estimatedArrival ? `<p><strong>Estimated Arrival:</strong> ${estimatedArrival} minutes</p>` : ''}
          <p>We look forward to serving you!</p>
        `,
      },
      employee: {
        sms: `Job accepted. ${customerName} has been notified. Address: ${address}`,
        emailSubject: `Job Confirmed - ${serviceType}`,
        emailHtml: `<p>You have accepted the job for ${customerName}. The customer has been notified.</p>`,
      },
    },
    en_route: {
      customer: {
        sms: `${employeeName} is on the way! ${estimatedArrival ? `ETA: ${estimatedArrival} minutes.` : ''} - ${companyName}`,
        emailSubject: `Your Technician is On The Way - ${companyName}`,
        emailHtml: `
          <h2>Your Technician is On The Way!</h2>
          <p>Hi ${customerName},</p>
          <p><strong>${employeeName}</strong> is heading to your location now.</p>
          ${estimatedArrival ? `<p><strong>Estimated Arrival:</strong> ${estimatedArrival} minutes</p>` : ''}
          <p>Please ensure someone is available to let them in.</p>
        `,
      },
      employee: {
        sms: `Status updated to En Route. Customer notified.`,
        emailSubject: `En Route Status Confirmed`,
        emailHtml: `<p>Your status has been updated to "En Route". ${customerName} has been notified.</p>`,
      },
    },
    arrived: {
      customer: {
        sms: `${employeeName} has arrived! Please let them in. - ${companyName}`,
        emailSubject: `Your Technician Has Arrived - ${companyName}`,
        emailHtml: `
          <h2>Your Technician Has Arrived</h2>
          <p>Hi ${customerName},</p>
          <p><strong>${employeeName}</strong> has arrived at your location.</p>
          <p>Please let them in so they can begin your ${serviceType} service.</p>
        `,
      },
      employee: {
        sms: `Status updated to Arrived. Customer notified.`,
        emailSubject: `Arrival Confirmed`,
        emailHtml: `<p>Your arrival has been logged. ${customerName} has been notified.</p>`,
      },
    },
    completed: {
      customer: {
        sms: `Your ${serviceType} service is complete! Thank you for choosing ${companyName}. We'd love your feedback!`,
        emailSubject: `Service Completed - ${companyName}`,
        emailHtml: `
          <h2>Service Completed</h2>
          <p>Hi ${customerName},</p>
          <p>Your <strong>${serviceType}</strong> service has been completed by <strong>${employeeName}</strong>.</p>
          <p>Thank you for choosing ${companyName}!</p>
          <p>We'd love to hear about your experience. Please take a moment to leave us a review.</p>
        `,
      },
      employee: {
        sms: `Job completed. Great work! Customer has been notified.`,
        emailSubject: `Job Completed - ${serviceType}`,
        emailHtml: `<p>Job for ${customerName} has been marked as completed. Great work!</p>`,
      },
    },
  };

  return templates[type]?.[recipient] || {
    sms: `Update from ${companyName}: Your service status has changed.`,
    emailSubject: `Service Update - ${companyName}`,
    emailHtml: `<p>Your service status has been updated.</p>`,
  };
}
