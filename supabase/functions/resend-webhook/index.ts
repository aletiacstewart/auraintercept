import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Webhook } from 'https://esm.sh/svix@1.15.0';

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

    // Get the webhook signing secret (optional but recommended)
    const webhookSecret = Deno.env.get('RESEND_WEBHOOK_SECRET');
    
    const payload = await req.text();
    let event: ResendWebhookPayload;

    // Verify webhook signature if secret is configured
    if (webhookSecret) {
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
    } else {
      // No secret configured, parse payload directly (less secure)
      console.warn('RESEND_WEBHOOK_SECRET not configured - webhook signature not verified');
      event = JSON.parse(payload);
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

    // If this is a bounce or complaint, we might want to disable future emails
    // For now, just log it - companies can decide on their policy
    if (event.type === 'email.bounced' || event.type === 'email.complained') {
      console.log(`Action required: ${recipientEmail} ${event.type} for company ${logToUpdate.company_id}`);
    }

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
