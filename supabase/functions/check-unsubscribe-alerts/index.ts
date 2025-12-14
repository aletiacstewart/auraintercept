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

    console.log('Checking unsubscribe rates at', new Date().toISOString());

    // Get companies with alerts enabled
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name, unsubscribe_alert_threshold, unsubscribe_alert_email, last_unsubscribe_alert_at')
      .eq('unsubscribe_alert_enabled', true)
      .not('unsubscribe_alert_email', 'is', null);

    if (companiesError) {
      console.error('Failed to fetch companies:', companiesError);
      throw companiesError;
    }

    if (!companies || companies.length === 0) {
      console.log('No companies with unsubscribe alerts enabled');
      return new Response(
        JSON.stringify({ success: true, message: 'No companies to check', alerts_sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Checking ${companies.length} companies for unsubscribe alerts`);

    // Check last 24 hours
    const periodEnd = new Date();
    const periodStart = new Date(periodEnd.getTime() - 24 * 60 * 60 * 1000);
    let alertsSent = 0;

    for (const company of companies) {
      // Skip if we already sent an alert in the last 24 hours
      if (company.last_unsubscribe_alert_at) {
        const lastAlert = new Date(company.last_unsubscribe_alert_at);
        if (periodEnd.getTime() - lastAlert.getTime() < 24 * 60 * 60 * 1000) {
          console.log(`Skipping ${company.name}: alert already sent within 24 hours`);
          continue;
        }
      }

      // Count unsubscribes in the last 24 hours
      const { count, error: countError } = await supabase
        .from('subscription_events')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', company.id)
        .eq('action', 'unsubscribe')
        .gte('created_at', periodStart.toISOString())
        .lte('created_at', periodEnd.toISOString());

      if (countError) {
        console.error(`Failed to count unsubscribes for ${company.name}:`, countError);
        continue;
      }

      const unsubscribeCount = count || 0;
      const threshold = company.unsubscribe_alert_threshold || 10;

      console.log(`${company.name}: ${unsubscribeCount} unsubscribes (threshold: ${threshold})`);

      if (unsubscribeCount >= threshold) {
        // Get company's Resend API key
        const { data: integrations } = await supabase
          .from('tenant_integrations')
          .select('resend_api_key')
          .eq('company_id', company.id)
          .maybeSingle();

        if (!integrations?.resend_api_key) {
          console.log(`No Resend API key for ${company.name}, skipping alert`);
          continue;
        }

        const resend = new Resend(integrations.resend_api_key);

        // Get breakdown by channel
        const { data: channelBreakdown } = await supabase
          .from('subscription_events')
          .select('channel')
          .eq('company_id', company.id)
          .eq('action', 'unsubscribe')
          .gte('created_at', periodStart.toISOString())
          .lte('created_at', periodEnd.toISOString());

        const smsCount = channelBreakdown?.filter(e => e.channel === 'sms').length || 0;
        const emailCount = channelBreakdown?.filter(e => e.channel === 'email').length || 0;
        const callCount = channelBreakdown?.filter(e => e.channel === 'call').length || 0;

        // Send alert email
        const { error: emailError } = await resend.emails.send({
          from: `${company.name} Alerts <onboarding@resend.dev>`,
          to: [company.unsubscribe_alert_email],
          subject: `⚠️ High Unsubscribe Rate Alert - ${unsubscribeCount} opt-outs in 24 hours`,
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: #ef4444; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                  <h1 style="color: white; margin: 0; font-size: 20px;">⚠️ Unsubscribe Alert</h1>
                </div>
                <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
                  <p>Hi,</p>
                  <p>This is an automated alert to let you know that <strong>${company.name}</strong> has exceeded the unsubscribe threshold.</p>
                  
                  <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #374151;">Last 24 Hours Summary</h3>
                    <p style="margin: 8px 0; font-size: 24px; font-weight: bold; color: #ef4444;">${unsubscribeCount} Unsubscribes</p>
                    <p style="margin: 8px 0; color: #6b7280;">Threshold: ${threshold}</p>
                    
                    <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 4px 0;"><strong>By Channel:</strong></p>
                      <p style="margin: 4px 0;">📱 SMS: ${smsCount}</p>
                      <p style="margin: 4px 0;">✉️ Email: ${emailCount}</p>
                      <p style="margin: 4px 0;">📞 Voice: ${callCount}</p>
                    </div>
                  </div>
                  
                  <p>Consider reviewing your reminder frequency, messaging content, or timing to improve engagement.</p>
                  
                  <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
                    This alert is sent once every 24 hours when the threshold is exceeded.
                  </p>
                </div>
              </body>
            </html>
          `,
        });

        if (emailError) {
          console.error(`Failed to send alert email for ${company.name}:`, emailError);
          continue;
        }

        // Log the alert
        await supabase.from('unsubscribe_alerts').insert({
          company_id: company.id,
          period_start: periodStart.toISOString(),
          period_end: periodEnd.toISOString(),
          unsubscribe_count: unsubscribeCount,
          threshold: threshold
        });

        // Update last alert timestamp
        await supabase
          .from('companies')
          .update({ last_unsubscribe_alert_at: periodEnd.toISOString() })
          .eq('id', company.id);

        console.log(`Alert sent to ${company.unsubscribe_alert_email} for ${company.name}`);
        alertsSent++;
      }
    }

    console.log(`Completed: ${alertsSent} alerts sent`);

    return new Response(
      JSON.stringify({ success: true, alerts_sent: alertsSent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Unsubscribe alert check error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
