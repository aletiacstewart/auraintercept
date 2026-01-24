import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  companyId: string;
  notificationType: 'new_booking' | 'missed_call' | 'new_sms' | 'new_email' | 'job_update';
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
  recipientId?: string;
  recipientRole?: string;
}

interface StaffMember {
  id: string;
  email: string;
  full_name: string;
  job_type: string;
  staff_notification_preferences: NotificationPrefs[];
}

interface NotificationPrefs {
  browser_push_enabled: boolean;
  email_alerts_enabled: boolean;
  sms_alerts_enabled: boolean;
  sms_phone_number: string | null;
  notify_new_bookings: boolean;
  notify_missed_calls: boolean;
  notify_new_sms: boolean;
  notify_new_email: boolean;
  notify_job_updates: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { 
      companyId, 
      notificationType, 
      title, 
      message, 
      metadata = {},
      recipientId,
      recipientRole = 'all'
    }: NotificationRequest = await req.json();

    console.log(`Processing ${notificationType} notification for company ${companyId}`);

    // 1. Create in-app notification
    const { data: notification, error: notifError } = await supabase
      .from('staff_notifications')
      .insert({
        company_id: companyId,
        recipient_id: recipientId || null,
        recipient_role: recipientId ? null : recipientRole,
        notification_type: notificationType,
        title,
        message,
        metadata,
      })
      .select()
      .single();

    if (notifError) {
      console.error('Error creating notification:', notifError);
      throw notifError;
    }

    console.log('In-app notification created:', notification.id);

    // 2. Get staff members with their notification preferences
    let staffQuery = supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        job_type,
        staff_notification_preferences(
          browser_push_enabled,
          email_alerts_enabled,
          sms_alerts_enabled,
          sms_phone_number,
          notify_new_bookings,
          notify_missed_calls,
          notify_new_sms,
          notify_new_email,
          notify_job_updates
        )
      `)
      .eq('company_id', companyId);

    if (recipientId) {
      staffQuery = staffQuery.eq('id', recipientId);
    } else if (recipientRole !== 'all') {
      staffQuery = staffQuery.eq('job_type', recipientRole);
    }

    const { data: staffMembers, error: staffError } = await staffQuery;

    if (staffError) {
      console.error('Error fetching staff:', staffError);
    }

    // Map notification type to preference key
    const eventPreferenceMap: Record<string, keyof NotificationPrefs> = {
      new_booking: 'notify_new_bookings',
      missed_call: 'notify_missed_calls',
      new_sms: 'notify_new_sms',
      new_email: 'notify_new_email',
      job_update: 'notify_job_updates',
    };

    const eventPreferenceKey = eventPreferenceMap[notificationType];

    const emailRecipients: string[] = [];
    const smsRecipients: { phone: string; name: string }[] = [];
    const pushSubscriptionUserIds: string[] = [];

    // Filter staff based on their preferences
    if (staffMembers) {
      for (const staff of staffMembers as StaffMember[]) {
        const prefs = staff.staff_notification_preferences?.[0];
        if (!prefs) continue;

        // Check if this event type is enabled for this user
        if (!prefs[eventPreferenceKey]) continue;

        if (prefs.email_alerts_enabled && staff.email) {
          emailRecipients.push(staff.email);
        }

        if (prefs.sms_alerts_enabled && prefs.sms_phone_number) {
          smsRecipients.push({ phone: prefs.sms_phone_number, name: staff.full_name || 'Team Member' });
        }

        if (prefs.browser_push_enabled) {
          pushSubscriptionUserIds.push(staff.id);
        }
      }
    }

    // 3. Send email notifications
    if (resendApiKey && emailRecipients.length > 0) {
      // Get company info for branding
      const { data: company } = await supabase
        .from('companies')
        .select('name')
        .eq('id', companyId)
        .single();

      const companyName = company?.name || 'Your Company';

      try {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: `${companyName} Alerts <onboarding@resend.dev>`,
            to: emailRecipients,
            subject: `[Alert] ${title}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1a1a1a;">${title}</h2>
                <p style="color: #4a4a4a; line-height: 1.6;">${message}</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="color: #888; font-size: 12px;">
                  This is an automated alert from ${companyName}. 
                  You can manage your notification preferences in the dashboard.
                </p>
              </div>
            `,
          }),
        });
        
        if (emailResponse.ok) {
          console.log(`Email sent to ${emailRecipients.length} recipients`);
        } else {
          console.error('Email send failed:', await emailResponse.text());
        }
      } catch (emailError) {
        console.error('Error sending email:', emailError);
      }
    }

    // 4. Send SMS notifications via Twilio
    if (smsRecipients.length > 0) {
      const { data: integration } = await supabase
        .from('twilio_integrations')
        .select('twilio_account_sid, twilio_auth_token, twilio_phone_number')
        .eq('company_id', companyId)
        .single();

      if (integration?.twilio_account_sid && integration?.twilio_auth_token && integration?.twilio_phone_number) {
        for (const recipient of smsRecipients) {
          try {
            const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${integration.twilio_account_sid}/Messages.json`;
            const smsBody = `${title}\n\n${message}`;

            await fetch(twilioUrl, {
              method: 'POST',
              headers: {
                'Authorization': 'Basic ' + btoa(`${integration.twilio_account_sid}:${integration.twilio_auth_token}`),
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({
                To: recipient.phone,
                From: integration.twilio_phone_number,
                Body: smsBody.substring(0, 1600),
              }),
            });
            console.log(`SMS sent to ${recipient.phone}`);
          } catch (smsError) {
            console.error(`Error sending SMS to ${recipient.phone}:`, smsError);
          }
        }
      }
    }

    // 5. Send browser push notifications
    if (pushSubscriptionUserIds.length > 0) {
      const { data: subscriptions } = await supabase
        .from('push_subscriptions')
        .select('*')
        .in('user_id', pushSubscriptionUserIds);

      if (subscriptions && subscriptions.length > 0) {
        console.log(`Would send push to ${subscriptions.length} subscriptions`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        notificationId: notification.id,
        emailsSent: emailRecipients.length,
        smsSent: smsRecipients.length,
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error: unknown) {
    console.error('Error in send-staff-notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
