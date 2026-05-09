import { createClient } from 'npm:@supabase/supabase-js@2';
import { sendGuardedEmail } from '../_shared/email-guard.ts';

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
          delivery_type,
          meeting_link,
          customer_address,
          companies:company_id (
            id,
            name,
            address
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
    const deliveryType = appointment?.delivery_type || 'in_person_customer';
    const isVirtual = deliveryType === 'virtual';
    const isAtBusiness = deliveryType === 'in_person_business';

    // Resolve industry-specific noun for "Job" (e.g. "Showing", "Reservation",
    // "Repair Order"). Falls back to "Job" so existing copy is unchanged for
    // verticals without a pack.
    let jobNoun = 'Job';
    let apptNoun = 'Appointment';
    try {
      const { data: packRow } = await supabase
        .rpc('get_company_industry_pack', { p_company_id: appointment.company_id });
      const row = Array.isArray(packRow) ? packRow[0] : packRow;
      const term = (row?.terminology || {}) as Record<string, string>;
      if (term.job && typeof term.job === 'string') jobNoun = term.job;
      if (term.appointment && typeof term.appointment === 'string') apptNoun = term.appointment;
    } catch (e) {
      console.warn('[Job Notification] Could not resolve industry terminology:', e);
    }

    // Skip irrelevant notifications for virtual/at-business jobs
    if (isVirtual && (notificationType === 'en_route' || notificationType === 'arrived')) {
      console.log(`[Job Notification] Skipping ${notificationType} for virtual appointment`);
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: 'Not applicable for virtual appointments' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (isAtBusiness && notificationType === 'en_route') {
      console.log(`[Job Notification] Skipping en_route for at-business appointment`);
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: 'Not applicable for at-business appointments' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For virtual jobs: on acceptance, try to generate Google Meet link
    let meetingLink = appointment?.meeting_link || null;
    if (isVirtual && notificationType === 'accepted' && !meetingLink) {
      try {
        console.log('[Job Notification] Generating Google Meet link for virtual appointment');
        const syncResponse = await fetch(`${supabaseUrl}/functions/v1/google-calendar-sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({
            action: 'sync_appointment',
            companyId: appointment.company_id,
            appointmentId: appointment.id,
            requestConference: true,
          }),
        });
        const syncResult = await syncResponse.json();
        if (syncResult.success && syncResult.meetingLink) {
          meetingLink = syncResult.meetingLink;
          // Save meeting link to appointment
          await supabase
            .from('appointments')
            .update({ meeting_link: meetingLink })
            .eq('id', appointment.id);
          console.log('[Job Notification] Google Meet link generated:', meetingLink);
        }
      } catch (meetError) {
        console.error('[Job Notification] Failed to generate Meet link:', meetError);
      }
    }

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

    // Fetch company's SignalWire credentials
    const { data: integrations } = await supabase
      .from('tenant_integrations')
      .select('signalwire_project_id, signalwire_api_token, signalwire_phone_number, signalwire_space_url, resend_api_key')
      .eq('company_id', appointment.company_id)
      .maybeSingle();

    const results: any = { sms: null, email: null };

    // Generate appropriate message based on notification type, recipient, and delivery type
    const messages = generateMessages(
      notificationType,
      recipientType,
      {
        customerName: appointment.customer_name,
        employeeName: employee?.full_name || 'Your specialist',
        serviceType: appointment.service_type,
        companyName,
        dateStr,
        timeStr,
        address: jobAssignment.customer_address || appointment.customer_address || company?.address || 'Address on file',
        estimatedArrival: jobAssignment.estimated_arrival_minutes,
        deliveryType,
        meetingLink,
        customerPhone: appointment.customer_phone,
        jobNoun,
        apptNoun,
      }
    );

    // Send SMS notification
    if (integrations?.signalwire_project_id && integrations?.signalwire_api_token && integrations?.signalwire_phone_number && integrations?.signalwire_space_url) {
      const phoneNumber = recipientType === 'customer' 
        ? appointment.customer_phone 
        : employee?.phone_number;

      if (phoneNumber) {
        const smsEnabled = recipientType === 'customer' || employee?.sms_notifications_enabled !== false;
        
        if (smsEnabled) {
          try {
            const signalwireUrl = `https://${integrations.signalwire_space_url}/api/laml/2010-04-01/Accounts/${integrations.signalwire_project_id}/Messages`;
            const credentials = btoa(`${integrations.signalwire_project_id}:${integrations.signalwire_api_token}`);

            const formData = new URLSearchParams();
            formData.append('To', phoneNumber);
            formData.append('From', integrations.signalwire_phone_number);
            formData.append('Body', messages.sms);

            const signalwireResponse = await fetch(signalwireUrl, {
              method: 'POST',
              headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: formData.toString(),
            });

            const signalwireResult = await signalwireResponse.json();

            if (signalwireResponse.ok) {
              results.sms = { success: true, messageSid: signalwireResult.sid };
              console.log(`[Job Notification] SMS sent successfully to ${recipientType}:`, signalwireResult.sid);
            } else {
              results.sms = { success: false, error: signalwireResult };
              console.error('[Job Notification] SignalWire error:', signalwireResult);
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
            const guarded = await sendGuardedEmail({
              supabase,
              resendApiKey: integrations.resend_api_key,
              companyId: appointment.company_id,
              from: `${companyName} <onboarding@resend.dev>`,
              to: [emailAddress],
              subject: messages.emailSubject,
              html: messages.emailHtml,
              template: `job_${notificationType}_${recipientType}`,
              priority: 'normal',
            });
            if (guarded.sent) {
              results.email = { success: true, id: (guarded.data as { id?: string })?.id };
              console.log(`[Job Notification] Email sent successfully to ${recipientType}`);
            } else {
              results.email = { success: false, error: guarded.reason || guarded.error };
              console.error('[Job Notification] Email blocked/failed:', guarded.reason);
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
    deliveryType?: string;
    meetingLink?: string | null;
    customerPhone?: string | null;
    jobNoun?: string;
    apptNoun?: string;
  }
): { sms: string; emailSubject: string; emailHtml: string } {
  const { customerName, employeeName, serviceType, companyName, dateStr, timeStr, address, estimatedArrival, deliveryType, meetingLink, customerPhone, jobNoun, apptNoun } = data;
  const noun = jobNoun || 'Job';
  const apNoun = apptNoun || 'Appointment';
  const NOUN_UPPER = noun.toUpperCase();

  const isVirtual = deliveryType === 'virtual';
  const isAtBusiness = deliveryType === 'in_person_business';

  // Build virtual session info
  const virtualInfo = meetingLink
    ? `Join your video session here: ${meetingLink}`
    : `We will call you at ${customerPhone || 'your phone number'} on ${dateStr} at ${timeStr}`;

  const virtualHtmlInfo = meetingLink
    ? `<p><strong>Join Your Session:</strong> <a href="${meetingLink}" style="color: #2563eb; text-decoration: underline;">Click here to join your video session</a></p>`
    : `<p><strong>Phone Session:</strong> We will call you at <strong>${customerPhone || 'your phone number'}</strong> on ${dateStr} at ${timeStr}</p>`;

  const locationInfo = isVirtual
    ? (meetingLink ? `Video session link: ${meetingLink}` : `Phone call appointment`)
    : isAtBusiness
    ? `Visit us at: ${address}`
    : `Address: ${address}`;

  const templates: Record<string, Record<string, { sms: string; emailSubject: string; emailHtml: string }>> = {
    assigned: {
      customer: {
        sms: isVirtual
          ? `Hi ${customerName}! ${employeeName} from ${companyName} has been assigned to your ${serviceType} session on ${dateStr} at ${timeStr}. We'll send you session details once confirmed.`
          : isAtBusiness
          ? `Hi ${customerName}! ${employeeName} from ${companyName} has been assigned to your ${serviceType} appointment on ${dateStr} at ${timeStr}. Visit us at ${address}.`
          : `Hi ${customerName}! ${employeeName} from ${companyName} has been assigned to your ${serviceType} service on ${dateStr} at ${timeStr}. We'll notify you when they're on their way.`,
        emailSubject: `${apNoun} Assigned - ${companyName}`,
        emailHtml: `
          <h2>Your ${isVirtual ? 'Session' : 'Appointment'} Has Been Assigned</h2>
          <p>Hi ${customerName},</p>
          <p><strong>${employeeName}</strong> has been assigned to your <strong>${serviceType}</strong> ${isVirtual ? 'session' : 'appointment'}.</p>
          <p><strong>When:</strong> ${dateStr} at ${timeStr}</p>
          ${isVirtual ? '<p>You will receive session details once your appointment is confirmed.</p>' : isAtBusiness ? `<p><strong>Location:</strong> ${address}</p>` : '<p>We\'ll send you updates when your specialist is on their way.</p>'}
          <p>Thanks for choosing ${companyName}!</p>
        `,
      },
      employee: {
        sms: isVirtual
          ? `NEW ${NOUN_UPPER}: ${serviceType} (Virtual) for ${customerName} on ${dateStr} at ${timeStr}. Please accept or decline in your dashboard.`
          : `NEW ${NOUN_UPPER}: ${serviceType} for ${customerName} on ${dateStr} at ${timeStr}. ${locationInfo}. Please accept or decline in your dashboard.`,
        emailSubject: `New ${noun} Assignment - ${serviceType}`,
        emailHtml: `
          <h2>New ${noun} Assignment</h2>
          <p>You have been assigned a new ${isVirtual ? 'virtual ' : ''}${noun.toLowerCase()}:</p>
          <ul>
            <li><strong>Service:</strong> ${serviceType}${isVirtual ? ' (Virtual)' : isAtBusiness ? ' (At Business)' : ''}</li>
            <li><strong>Customer:</strong> ${customerName}</li>
            <li><strong>Date/Time:</strong> ${dateStr} at ${timeStr}</li>
            ${!isVirtual ? `<li><strong>${isAtBusiness ? 'Business Address' : 'Customer Address'}:</strong> ${address}</li>` : ''}
          </ul>
          <p>Please log into your dashboard to accept or decline this job.</p>
        `,
      },
    },
    accepted: {
      customer: {
        sms: isVirtual
          ? `Great news, ${customerName}! ${employeeName} has confirmed your ${serviceType} session on ${dateStr} at ${timeStr}. ${virtualInfo} - ${companyName}`
          : isAtBusiness
          ? `Great news, ${customerName}! ${employeeName} has confirmed your ${serviceType} appointment on ${dateStr} at ${timeStr}. Visit us at ${address}. See you soon! - ${companyName}`
          : `Great news, ${customerName}! ${employeeName} has confirmed your ${serviceType} appointment on ${dateStr} at ${timeStr}.${estimatedArrival ? ` Estimated arrival: ${estimatedArrival} minutes.` : ''} See you soon! - ${companyName}`,
        emailSubject: `${apNoun} Confirmed - ${companyName}`,
        emailHtml: `
          <h2>Your ${isVirtual ? 'Session' : 'Appointment'} is Confirmed</h2>
          <p>Hi ${customerName},</p>
          <p><strong>${employeeName}</strong> has confirmed your ${isVirtual ? 'session' : 'appointment'}.</p>
          <p><strong>Service:</strong> ${serviceType}</p>
          <p><strong>When:</strong> ${dateStr} at ${timeStr}</p>
          ${isVirtual ? virtualHtmlInfo : isAtBusiness ? `<p><strong>Location:</strong> ${address}</p>` : (estimatedArrival ? `<p><strong>Estimated Arrival:</strong> ${estimatedArrival} minutes</p>` : '')}
          <p>We look forward to serving you!</p>
        `,
      },
      employee: {
        sms: isVirtual
          ? `Job accepted. ${customerName} has been notified with ${meetingLink ? 'the video session link' : 'phone call details'}.`
          : `Job accepted. ${customerName} has been notified. ${locationInfo}`,
        emailSubject: `${noun} Confirmed - ${serviceType}`,
        emailHtml: `<p>You have accepted the ${noun.toLowerCase()} for ${customerName}. The customer has been notified${isVirtual && meetingLink ? ` with the video session link: <a href="${meetingLink}">${meetingLink}</a>` : ''}.</p>`,
      },
    },
    en_route: {
      customer: {
        sms: `${employeeName} is on the way! ${estimatedArrival ? `ETA: ${estimatedArrival} minutes.` : ''} - ${companyName}`,
        emailSubject: `Your Specialist is On The Way - ${companyName}`,
        emailHtml: `
          <h2>Your Specialist is On The Way!</h2>
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
        sms: isAtBusiness
          ? `${employeeName} is ready for your ${serviceType} appointment! Please check in when you arrive. - ${companyName}`
          : `${employeeName} has arrived! Please let them in. - ${companyName}`,
        emailSubject: isAtBusiness ? `We're Ready For You - ${companyName}` : `Your Specialist Has Arrived - ${companyName}`,
        emailHtml: isAtBusiness ? `
          <h2>We're Ready For Your Appointment</h2>
          <p>Hi ${customerName},</p>
          <p><strong>${employeeName}</strong> is ready for your <strong>${serviceType}</strong> appointment.</p>
          <p><strong>Location:</strong> ${address}</p>
          <p>Please check in when you arrive!</p>
        ` : `
          <h2>Your Specialist Has Arrived</h2>
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
        sms: `Your ${serviceType} ${isVirtual ? 'session' : 'service'} is complete! Thank you for choosing ${companyName}. We'd love your feedback!`,
        emailSubject: `${isVirtual ? 'Session' : 'Service'} Completed - ${companyName}`,
        emailHtml: `
          <h2>${isVirtual ? 'Session' : 'Service'} Completed</h2>
          <p>Hi ${customerName},</p>
          <p>Your <strong>${serviceType}</strong> ${isVirtual ? 'session' : 'service'} has been completed by <strong>${employeeName}</strong>.</p>
          <p>Thank you for choosing ${companyName}!</p>
          <p>We'd love to hear about your experience. Please take a moment to leave us a review.</p>
        `,
      },
      employee: {
        sms: `Job completed. Great work! Customer has been notified.`,
        emailSubject: `${noun} Completed - ${serviceType}`,
        emailHtml: `<p>${noun} for ${customerName} has been marked as completed. Great work!</p>`,
      },
    },
  };

  return templates[type]?.[recipient] || {
    sms: `Update from ${companyName}: Your ${isVirtual ? 'session' : 'service'} status has changed.`,
    emailSubject: `${isVirtual ? 'Session' : 'Service'} Update - ${companyName}`,
    emailHtml: `<p>Your ${isVirtual ? 'session' : 'service'} status has been updated.</p>`,
  };
}
