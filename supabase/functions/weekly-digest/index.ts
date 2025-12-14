import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend@4.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    console.log(`Running weekly digest check at ${now.toISOString()}, day: ${currentDay}`);

    // Get companies with digest enabled for today
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name, weekly_digest_email, weekly_digest_day, last_weekly_digest_at')
      .eq('weekly_digest_enabled', true)
      .eq('weekly_digest_day', currentDay)
      .not('weekly_digest_email', 'is', null);

    if (companiesError) {
      console.error('Failed to fetch companies:', companiesError);
      throw companiesError;
    }

    if (!companies || companies.length === 0) {
      console.log('No companies scheduled for digest today');
      return new Response(
        JSON.stringify({ success: true, message: 'No digests to send', digests_sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${companies.length} companies for weekly digest`);

    // Calculate date range (last 7 days)
    const periodEnd = new Date();
    const periodStart = new Date(periodEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
    let digestsSent = 0;

    for (const company of companies) {
      // Skip if we already sent a digest this week
      if (company.last_weekly_digest_at) {
        const lastDigest = new Date(company.last_weekly_digest_at);
        if (periodEnd.getTime() - lastDigest.getTime() < 6 * 24 * 60 * 60 * 1000) {
          console.log(`Skipping ${company.name}: digest already sent this week`);
          continue;
        }
      }

      // Get company's Resend API key
      const { data: integrations } = await supabase
        .from('tenant_integrations')
        .select('resend_api_key')
        .eq('company_id', company.id)
        .maybeSingle();

      if (!integrations?.resend_api_key) {
        console.log(`No Resend API key for ${company.name}, skipping digest`);
        continue;
      }

      // Fetch reminder stats
      const { data: reminderLogs } = await supabase
        .from('reminder_logs')
        .select('status, channel')
        .eq('company_id', company.id)
        .gte('created_at', periodStart.toISOString())
        .lte('created_at', periodEnd.toISOString());

      const reminderStats = {
        total: reminderLogs?.length || 0,
        sent: reminderLogs?.filter(r => r.status === 'sent').length || 0,
        failed: reminderLogs?.filter(r => r.status === 'failed').length || 0,
        sms: reminderLogs?.filter(r => r.channel === 'sms').length || 0,
        email: reminderLogs?.filter(r => r.channel === 'email').length || 0,
        call: reminderLogs?.filter(r => r.channel === 'call').length || 0
      };

      // Fetch subscription events
      const { data: subscriptionEvents } = await supabase
        .from('subscription_events')
        .select('action, channel')
        .eq('company_id', company.id)
        .gte('created_at', periodStart.toISOString())
        .lte('created_at', periodEnd.toISOString());

      const subscriptionStats = {
        unsubscribes: subscriptionEvents?.filter(e => e.action === 'unsubscribe').length || 0,
        resubscribes: subscriptionEvents?.filter(e => e.action === 'subscribe').length || 0,
        smsSubs: subscriptionEvents?.filter(e => e.channel === 'sms' && e.action === 'unsubscribe').length || 0,
        emailSubs: subscriptionEvents?.filter(e => e.channel === 'email' && e.action === 'unsubscribe').length || 0,
        callSubs: subscriptionEvents?.filter(e => e.channel === 'call' && e.action === 'unsubscribe').length || 0
      };

      // Fetch appointment stats
      const { data: appointments } = await supabase
        .from('appointments')
        .select('status')
        .eq('company_id', company.id)
        .gte('created_at', periodStart.toISOString())
        .lte('created_at', periodEnd.toISOString());

      const appointmentStats = {
        total: appointments?.length || 0,
        scheduled: appointments?.filter(a => a.status === 'scheduled').length || 0,
        completed: appointments?.filter(a => a.status === 'completed').length || 0,
        cancelled: appointments?.filter(a => a.status === 'cancelled').length || 0
      };

      const resend = new Resend(integrations.resend_api_key);
      
      const successRate = reminderStats.total > 0 
        ? Math.round((reminderStats.sent / reminderStats.total) * 100) 
        : 100;

      const formatDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      // Send digest email
      const { error: emailError } = await resend.emails.send({
        from: `${company.name} <onboarding@resend.dev>`,
        to: [company.weekly_digest_email],
        subject: `📊 Weekly Performance Digest - ${formatDate(periodStart)} to ${formatDate(periodEnd)}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">📊 Weekly Digest</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">${company.name}</p>
                <p style="color: rgba(255,255,255,0.7); margin: 4px 0 0 0; font-size: 14px;">${formatDate(periodStart)} - ${formatDate(periodEnd)}</p>
              </div>
              
              <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
                
                <!-- Appointments Summary -->
                <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                  <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #374151;">📅 Appointments</h2>
                  <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
                    <div style="text-align: center; flex: 1; min-width: 80px;">
                      <div style="font-size: 28px; font-weight: bold; color: #3b82f6;">${appointmentStats.total}</div>
                      <div style="font-size: 12px; color: #6b7280;">Total</div>
                    </div>
                    <div style="text-align: center; flex: 1; min-width: 80px;">
                      <div style="font-size: 28px; font-weight: bold; color: #10b981;">${appointmentStats.completed}</div>
                      <div style="font-size: 12px; color: #6b7280;">Completed</div>
                    </div>
                    <div style="text-align: center; flex: 1; min-width: 80px;">
                      <div style="font-size: 28px; font-weight: bold; color: #ef4444;">${appointmentStats.cancelled}</div>
                      <div style="font-size: 12px; color: #6b7280;">Cancelled</div>
                    </div>
                  </div>
                </div>

                <!-- Reminders Summary -->
                <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                  <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #374151;">🔔 Reminders Sent</h2>
                  <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 16px;">
                    <div style="text-align: center; flex: 1; min-width: 80px;">
                      <div style="font-size: 28px; font-weight: bold; color: #3b82f6;">${reminderStats.total}</div>
                      <div style="font-size: 12px; color: #6b7280;">Total</div>
                    </div>
                    <div style="text-align: center; flex: 1; min-width: 80px;">
                      <div style="font-size: 28px; font-weight: bold; color: #10b981;">${successRate}%</div>
                      <div style="font-size: 12px; color: #6b7280;">Success Rate</div>
                    </div>
                  </div>
                  <div style="border-top: 1px solid #e5e7eb; padding-top: 12px;">
                    <p style="margin: 4px 0; font-size: 14px;">📱 SMS: ${reminderStats.sms}</p>
                    <p style="margin: 4px 0; font-size: 14px;">✉️ Email: ${reminderStats.email}</p>
                    <p style="margin: 4px 0; font-size: 14px;">📞 Voice: ${reminderStats.call}</p>
                  </div>
                </div>

                <!-- Subscription Trends -->
                <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                  <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #374151;">📈 Subscription Trends</h2>
                  <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 16px;">
                    <div style="text-align: center; flex: 1; min-width: 100px;">
                      <div style="font-size: 28px; font-weight: bold; color: #ef4444;">${subscriptionStats.unsubscribes}</div>
                      <div style="font-size: 12px; color: #6b7280;">Unsubscribes</div>
                    </div>
                    <div style="text-align: center; flex: 1; min-width: 100px;">
                      <div style="font-size: 28px; font-weight: bold; color: #10b981;">${subscriptionStats.resubscribes}</div>
                      <div style="font-size: 12px; color: #6b7280;">Re-subscribes</div>
                    </div>
                  </div>
                  ${subscriptionStats.unsubscribes > 0 ? `
                  <div style="border-top: 1px solid #e5e7eb; padding-top: 12px;">
                    <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 500;">Unsubscribes by channel:</p>
                    <p style="margin: 4px 0; font-size: 14px;">📱 SMS: ${subscriptionStats.smsSubs}</p>
                    <p style="margin: 4px 0; font-size: 14px;">✉️ Email: ${subscriptionStats.emailSubs}</p>
                    <p style="margin: 4px 0; font-size: 14px;">📞 Voice: ${subscriptionStats.callSubs}</p>
                  </div>
                  ` : ''}
                </div>

                ${subscriptionStats.unsubscribes > 5 ? `
                <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                  <p style="margin: 0; color: #92400e; font-size: 14px;">
                    ⚠️ <strong>Attention:</strong> You had ${subscriptionStats.unsubscribes} unsubscribes this week. 
                    Consider reviewing your reminder frequency or message content.
                  </p>
                </div>
                ` : ''}

                <p style="color: #6b7280; font-size: 12px; text-align: center; margin-top: 24px;">
                  This is an automated weekly digest from ${company.name}.
                </p>
              </div>
            </body>
          </html>
        `,
      });

      if (emailError) {
        console.error(`Failed to send digest for ${company.name}:`, emailError);
        continue;
      }

      // Update last digest timestamp
      await supabase
        .from('companies')
        .update({ last_weekly_digest_at: periodEnd.toISOString() })
        .eq('id', company.id);

      console.log(`Weekly digest sent to ${company.weekly_digest_email} for ${company.name}`);
      digestsSent++;
    }

    console.log(`Completed: ${digestsSent} digests sent`);

    return new Response(
      JSON.stringify({ success: true, digests_sent: digestsSent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Weekly digest error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
