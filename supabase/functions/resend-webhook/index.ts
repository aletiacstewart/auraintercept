import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Webhook } from 'https://esm.sh/svix@1.15.0';
import { Resend } from 'https://esm.sh/resend@4.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature',
};

// Resend webhook event types we care about
type ResendEventType = 
  | 'email.sent'
  | 'email.delivered'
  | 'email.delivery_delayed'
  | 'email.complained'
  | 'email.bounced'
  | 'email.opened'
  | 'email.clicked';

interface ResendWebhookPayload {
  type: ResendEventType;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    created_at: string;
    bounce?: {
      message: string;
    };
    complaint?: {
      feedback_type: string;
    };
  };
}

// Check bounce rate and send alert if threshold exceeded
async function checkBounceRateAlert(
  supabase: any,
  companyId: string
) {
  try {
    // Get company settings
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('name, bounce_alert_enabled, bounce_alert_threshold, bounce_alert_email, last_bounce_alert_at')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      console.log('Could not fetch company for bounce alert check:', companyError);
      return;
    }

    if (!company.bounce_alert_enabled || !company.bounce_alert_email) {
      console.log('Bounce alerts not enabled for this company');
      return;
    }

    // Check if we already sent an alert in the last 24 hours
    if (company.last_bounce_alert_at) {
      const lastAlert = new Date(company.last_bounce_alert_at);
      const hoursSinceLastAlert = (Date.now() - lastAlert.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastAlert < 24) {
        console.log(`Skipping bounce alert - last sent ${hoursSinceLastAlert.toFixed(1)} hours ago`);
        return;
      }
    }

    // Count bounces/complaints in the last 24 hours
    const lookbackTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const { data: recentIssues, error: countError } = await supabase
      .from('digest_delivery_logs')
      .select('id, status')
      .eq('company_id', companyId)
      .in('status', ['bounced', 'complained'])
      .gte('sent_at', lookbackTime.toISOString());

    if (countError) {
      console.error('Error counting bounce rate:', countError);
      return;
    }

    const issueList = recentIssues || [];
    const issueCount = issueList.length;
    const threshold = company.bounce_alert_threshold || 10;

    console.log(`Bounce/complaint count for company ${companyId}: ${issueCount}/${threshold}`);

    if (issueCount < threshold) {
      return;
    }

    // Get company's Resend API key
    const { data: integrations } = await supabase
      .from('tenant_integrations')
      .select('resend_api_key')
      .eq('company_id', companyId)
      .maybeSingle();

    if (!integrations?.resend_api_key) {
      console.log('No Resend API key for bounce alert email');
      return;
    }

    // Count breakdown
    const bounceCount = issueList.filter((i: any) => i.status === 'bounced').length;
    const complaintCount = issueList.filter((i: any) => i.status === 'complained').length;

    // Send alert email
    const resend = new Resend(integrations.resend_api_key);
    
    const { error: sendError } = await resend.emails.send({
      from: `${company.name} <ai@auraintercept.ai>`,
      to: [company.bounce_alert_email],
      subject: `⚠️ Email Deliverability Alert - ${issueCount} issues in 24h`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h1 style="color: #dc2626; margin: 0 0 12px 0; font-size: 20px;">⚠️ Email Deliverability Alert</h1>
            <p style="margin: 0; color: #7f1d1d;">
              Your digest emails have experienced <strong>${issueCount} delivery issues</strong> in the past 24 hours, 
              exceeding your threshold of ${threshold}.
            </p>
          </div>
          
          <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h2 style="margin: 0 0 16px 0; font-size: 16px; color: #374151;">Issue Breakdown</h2>
            <div style="display: flex; gap: 20px;">
              <div style="text-align: center; flex: 1;">
                <div style="font-size: 28px; font-weight: bold; color: #dc2626;">${bounceCount}</div>
                <div style="font-size: 12px; color: #6b7280;">Bounced</div>
              </div>
              <div style="text-align: center; flex: 1;">
                <div style="font-size: 28px; font-weight: bold; color: #f59e0b;">${complaintCount}</div>
                <div style="font-size: 12px; color: #6b7280;">Complaints</div>
              </div>
            </div>
          </div>
          
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;">
            <h2 style="margin: 0 0 12px 0; font-size: 16px; color: #374151;">Recommended Actions</h2>
            <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
              <li style="margin-bottom: 8px;">Review your suppressed emails list in the Reports dashboard</li>
              <li style="margin-bottom: 8px;">Verify recipient email addresses are valid and up-to-date</li>
              <li style="margin-bottom: 8px;">Check your email content for spam triggers</li>
              <li style="margin-bottom: 8px;">Consider reducing email frequency if complaints are high</li>
            </ul>
          </div>
          
          <p style="margin-top: 20px; font-size: 12px; color: #9ca3af; text-align: center;">
            This alert was sent because your bounce rate exceeded the configured threshold.
            You won't receive another alert for 24 hours.
          </p>
        </div>
      `,
    });

    if (sendError) {
      console.error('Failed to send bounce alert email:', sendError);
      return;
    }

    // Update last alert timestamp
    await supabase
      .from('companies')
      .update({ last_bounce_alert_at: new Date().toISOString() })
      .eq('id', companyId);

    console.log(`Bounce alert sent to ${company.bounce_alert_email}`);
  } catch (err) {
    console.error('Error in checkBounceRateAlert:', err);
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Webhook signing secret is REQUIRED for security
    const webhookSecret = Deno.env.get('RESEND_WEBHOOK_SECRET');
    
    if (!webhookSecret) {
      console.error('RESEND_WEBHOOK_SECRET not configured - webhook endpoint disabled for security');
      return new Response(
        JSON.stringify({ error: 'Webhook not configured. Please set RESEND_WEBHOOK_SECRET.' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const payload = await req.text();
    let event: ResendWebhookPayload;

    // Verify webhook signature (REQUIRED)
    const svixId = req.headers.get('svix-id');
    const svixTimestamp = req.headers.get('svix-timestamp');
    const svixSignature = req.headers.get('svix-signature');

    if (!svixId || !svixTimestamp || !svixSignature) {
      console.error('Missing Svix headers for webhook verification');
      return new Response('Missing signature headers', { status: 401, headers: corsHeaders });
    }

    try {
      const wh = new Webhook(webhookSecret);
      event = wh.verify(payload, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as ResendWebhookPayload;
      console.log('Webhook signature verified successfully');
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return new Response('Invalid signature', { status: 401, headers: corsHeaders });
    }

    console.log(`Received Resend webhook: ${event.type}`, {
      email_id: event.data.email_id,
      to: event.data.to,
      subject: event.data.subject,
    });

    // Only process bounce and complaint events
    if (event.type !== 'email.bounced' && event.type !== 'email.complained') {
      console.log(`Ignoring event type: ${event.type}`);
      return new Response(JSON.stringify({ received: true, processed: false }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const recipientEmail = event.data.to[0];
    const eventTime = new Date(event.created_at);
    
    // Determine error message based on event type
    let errorMessage: string;
    let newStatus: string;
    
    if (event.type === 'email.bounced') {
      errorMessage = `Email bounced: ${event.data.bounce?.message || 'Unknown bounce reason'}`;
      newStatus = 'bounced';
    } else {
      errorMessage = `Spam complaint received: ${event.data.complaint?.feedback_type || 'Unknown complaint type'}`;
      newStatus = 'complained';
    }

    // Find and update recent delivery logs for this recipient
    // Look for logs sent within the last 24 hours to this email
    const lookbackTime = new Date(eventTime.getTime() - 24 * 60 * 60 * 1000);

    const { data: matchingLogs, error: fetchError } = await supabase
      .from('digest_delivery_logs')
      .select('id, company_id, digest_type, status')
      .eq('recipient_email', recipientEmail)
      .eq('status', 'sent')
      .gte('sent_at', lookbackTime.toISOString())
      .order('sent_at', { ascending: false })
      .limit(5);

    if (fetchError) {
      console.error('Error fetching delivery logs:', fetchError);
      return new Response(JSON.stringify({ error: 'Database error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!matchingLogs || matchingLogs.length === 0) {
      console.log(`No matching delivery logs found for ${recipientEmail}`);
      return new Response(JSON.stringify({ received: true, processed: false, reason: 'No matching logs' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${matchingLogs.length} matching logs for ${recipientEmail}`);

    // Update the most recent matching log
    const logToUpdate = matchingLogs[0];
    const { error: updateError } = await supabase
      .from('digest_delivery_logs')
      .update({
        status: newStatus,
        error_message: errorMessage,
      })
      .eq('id', logToUpdate.id);

    if (updateError) {
      console.error('Error updating delivery log:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update log' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Updated log ${logToUpdate.id} to status: ${newStatus}`);

    // Add email to suppression list for this company
    const suppressionReason = event.type === 'email.bounced' ? 'bounce' : 'complaint';
    
    const { error: suppressionError } = await supabase
      .from('suppressed_emails')
      .upsert({
        company_id: logToUpdate.company_id,
        email: recipientEmail,
        reason: suppressionReason,
        source_event_id: event.data.email_id,
        suppressed_at: new Date().toISOString(),
      }, {
        onConflict: 'company_id,email'
      });

    if (suppressionError) {
      console.error('Error adding to suppression list:', suppressionError);
    } else {
      console.log(`Added ${recipientEmail} to suppression list for company ${logToUpdate.company_id} (reason: ${suppressionReason})`);
    }

    // Check if we need to send a bounce rate alert
    await checkBounceRateAlert(supabase, logToUpdate.company_id);

    return new Response(
      JSON.stringify({
        received: true,
        processed: true,
        updated_log_id: logToUpdate.id,
        new_status: newStatus,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
