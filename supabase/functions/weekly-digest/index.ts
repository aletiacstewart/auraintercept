import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend@4.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 1000; // 1 second

// Helper function to send email with exponential backoff retry
async function sendWithRetry(
  resend: Resend,
  emailOptions: { from: string; to: string[]; subject: string; html: string },
  maxRetries = MAX_RETRIES
): Promise<{ success: boolean; error?: string; attempts: number }> {
  let lastError: string | undefined;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { error } = await resend.emails.send(emailOptions);
      
      if (!error) {
        console.log(`Email sent successfully on attempt ${attempt}`);
        return { success: true, attempts: attempt };
      }
      
      lastError = error.message || 'Unknown error';
      console.log(`Email attempt ${attempt}/${maxRetries} failed: ${lastError}`);
      
      // Don't retry on permanent errors (invalid email, etc.)
      if (error.message?.includes('Invalid') || error.message?.includes('not allowed')) {
        return { success: false, error: lastError, attempts: attempt };
      }
      
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'Network error';
      console.log(`Email attempt ${attempt}/${maxRetries} threw error: ${lastError}`);
    }
    
    // Calculate exponential backoff delay
    if (attempt < maxRetries) {
      const delay = INITIAL_DELAY_MS * Math.pow(2, attempt - 1);
      console.log(`Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return { success: false, error: lastError, attempts: maxRetries };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Check if this is a test request
    let isTestMode = false;
    let testCompanyId: string | null = null;
    
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        isTestMode = body.test === true;
        testCompanyId = body.company_id || null;
      } catch {
        // Not JSON body, continue as normal cron
      }
    }

    const now = new Date();
    const currentUTCDay = now.getUTCDay();
    const currentUTCHour = now.getUTCHours();
    
    console.log(`Running weekly digest ${isTestMode ? '(TEST MODE)' : ''} at ${now.toISOString()}, UTC day: ${currentUTCDay}, UTC hour: ${currentUTCHour}`);

    // Helper to get current day and hour in a specific timezone
    const getLocalTime = (timezone: string) => {
      try {
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: timezone,
          weekday: 'short',
          hour: 'numeric',
          hour12: false,
        });
        const parts = formatter.formatToParts(now);
        const dayPart = parts.find(p => p.type === 'weekday')?.value;
        const hourPart = parts.find(p => p.type === 'hour')?.value;
        
        const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
        return {
          day: dayMap[dayPart || 'Mon'] ?? currentUTCDay,
          hour: parseInt(hourPart || '0', 10)
        };
      } catch {
        // Fallback to UTC if timezone is invalid
        return { day: currentUTCDay, hour: currentUTCHour };
      }
    };

    let companies;
    
    if (isTestMode && testCompanyId) {
      // Test mode: get specific company regardless of day
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, weekly_digest_email, weekly_digest_day, weekly_digest_time, weekly_digest_timezone, weekly_digest_include_appointments, weekly_digest_include_reminders, weekly_digest_include_subscriptions, last_weekly_digest_at')
        .eq('id', testCompanyId)
        .not('weekly_digest_email', 'is', null);
      
      if (error) throw error;
      companies = data;
      
      if (!companies || companies.length === 0) {
        return new Response(
          JSON.stringify({ success: false, error: 'Please save a recipient email first' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // Normal cron mode: get all enabled companies (we'll filter by timezone below)
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, weekly_digest_email, weekly_digest_day, weekly_digest_time, weekly_digest_timezone, weekly_digest_include_appointments, weekly_digest_include_reminders, weekly_digest_include_subscriptions, last_weekly_digest_at')
        .eq('weekly_digest_enabled', true)
        .not('weekly_digest_email', 'is', null);
      
      if (error) throw error;
      companies = data;
    }

    if (!companies || companies.length === 0) {
      console.log('No companies to process');
      return new Response(
        JSON.stringify({ success: true, message: 'No digests to send', digests_sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${companies.length} companies for weekly digest`);

    // Calculate date ranges (this week and last week for comparison)
    const periodEnd = new Date();
    const periodStart = new Date(periodEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
    const prevPeriodEnd = new Date(periodStart.getTime());
    const prevPeriodStart = new Date(prevPeriodEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
    let digestsSent = 0;

    // Helper to calculate percentage change
    const calcChange = (current: number, previous: number): { value: number; direction: 'up' | 'down' | 'same' } => {
      if (previous === 0) return { value: current > 0 ? 100 : 0, direction: current > 0 ? 'up' : 'same' };
      const change = Math.round(((current - previous) / previous) * 100);
      return { value: Math.abs(change), direction: change > 0 ? 'up' : change < 0 ? 'down' : 'same' };
    };

    // Helper to render change badge
    const renderChange = (change: { value: number; direction: 'up' | 'down' | 'same' }, positiveIsGood = true) => {
      if (change.direction === 'same' || change.value === 0) return '';
      const isGood = (change.direction === 'up') === positiveIsGood;
      const color = isGood ? '#10b981' : '#ef4444';
      const arrow = change.direction === 'up' ? '↑' : '↓';
      return `<span style="font-size: 12px; color: ${color}; margin-left: 4px;">${arrow}${change.value}%</span>`;
    };

    for (const company of companies) {
      // Check if it's the right day and time for this company based on their timezone (skip in test mode)
      if (!isTestMode) {
        const companyTimezone = company.weekly_digest_timezone || 'America/New_York';
        const localTime = getLocalTime(companyTimezone);
        
        // Check if it's the scheduled day in the company's timezone
        if (localTime.day !== company.weekly_digest_day) {
          console.log(`Skipping ${company.name}: not scheduled for this day in ${companyTimezone} (scheduled: ${company.weekly_digest_day}, local day: ${localTime.day})`);
          continue;
        }
        
        // Check if it's the scheduled hour in the company's timezone
        if (company.weekly_digest_time) {
          const scheduledHour = parseInt(company.weekly_digest_time.split(':')[0], 10);
          // Allow a 1-hour window for cron scheduling flexibility
          if (Math.abs(localTime.hour - scheduledHour) > 1) {
            console.log(`Skipping ${company.name}: not scheduled for this hour in ${companyTimezone} (scheduled: ${scheduledHour}, local hour: ${localTime.hour})`);
            continue;
          }
        }
      }

      // Skip duplicate check in test mode
      if (!isTestMode && company.last_weekly_digest_at) {
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

      // Check if recipient email is suppressed
      const { data: suppression } = await supabase
        .from('suppressed_emails')
        .select('id, reason, suppressed_at')
        .eq('company_id', company.id)
        .eq('email', company.weekly_digest_email)
        .maybeSingle();

      if (suppression) {
        console.log(`Skipping ${company.name}: recipient ${company.weekly_digest_email} is suppressed (${suppression.reason} on ${suppression.suppressed_at})`);
        continue;
      }

      // Fetch THIS WEEK reminder stats
      const { data: reminderLogs } = await supabase
        .from('reminder_logs')
        .select('status, channel')
        .eq('company_id', company.id)
        .gte('created_at', periodStart.toISOString())
        .lte('created_at', periodEnd.toISOString());

      // Fetch LAST WEEK reminder stats
      const { data: prevReminderLogs } = await supabase
        .from('reminder_logs')
        .select('status, channel')
        .eq('company_id', company.id)
        .gte('created_at', prevPeriodStart.toISOString())
        .lte('created_at', prevPeriodEnd.toISOString());

      const reminderStats = {
        total: reminderLogs?.length || 0,
        sent: reminderLogs?.filter(r => r.status === 'sent').length || 0,
        failed: reminderLogs?.filter(r => r.status === 'failed').length || 0,
        sms: reminderLogs?.filter(r => r.channel === 'sms').length || 0,
        email: reminderLogs?.filter(r => r.channel === 'email').length || 0,
        call: reminderLogs?.filter(r => r.channel === 'call').length || 0
      };

      const prevReminderStats = {
        total: prevReminderLogs?.length || 0,
        sent: prevReminderLogs?.filter(r => r.status === 'sent').length || 0
      };

      // Fetch THIS WEEK subscription events
      const { data: subscriptionEvents } = await supabase
        .from('subscription_events')
        .select('action, channel')
        .eq('company_id', company.id)
        .gte('created_at', periodStart.toISOString())
        .lte('created_at', periodEnd.toISOString());

      // Fetch LAST WEEK subscription events
      const { data: prevSubscriptionEvents } = await supabase
        .from('subscription_events')
        .select('action, channel')
        .eq('company_id', company.id)
        .gte('created_at', prevPeriodStart.toISOString())
        .lte('created_at', prevPeriodEnd.toISOString());

      const subscriptionStats = {
        unsubscribes: subscriptionEvents?.filter(e => e.action === 'unsubscribe').length || 0,
        resubscribes: subscriptionEvents?.filter(e => e.action === 'subscribe').length || 0,
        smsSubs: subscriptionEvents?.filter(e => e.channel === 'sms' && e.action === 'unsubscribe').length || 0,
        emailSubs: subscriptionEvents?.filter(e => e.channel === 'email' && e.action === 'unsubscribe').length || 0,
        callSubs: subscriptionEvents?.filter(e => e.channel === 'call' && e.action === 'unsubscribe').length || 0
      };

      const prevSubscriptionStats = {
        unsubscribes: prevSubscriptionEvents?.filter(e => e.action === 'unsubscribe').length || 0,
        resubscribes: prevSubscriptionEvents?.filter(e => e.action === 'subscribe').length || 0
      };

      // Fetch THIS WEEK appointment stats
      const { data: appointments } = await supabase
        .from('appointments')
        .select('status')
        .eq('company_id', company.id)
        .gte('created_at', periodStart.toISOString())
        .lte('created_at', periodEnd.toISOString());

      // Fetch LAST WEEK appointment stats
      const { data: prevAppointments } = await supabase
        .from('appointments')
        .select('status')
        .eq('company_id', company.id)
        .gte('created_at', prevPeriodStart.toISOString())
        .lte('created_at', prevPeriodEnd.toISOString());

      const appointmentStats = {
        total: appointments?.length || 0,
        scheduled: appointments?.filter(a => a.status === 'scheduled').length || 0,
        completed: appointments?.filter(a => a.status === 'completed').length || 0,
        cancelled: appointments?.filter(a => a.status === 'cancelled').length || 0
      };

      const prevAppointmentStats = {
        total: prevAppointments?.length || 0,
        completed: prevAppointments?.filter(a => a.status === 'completed').length || 0,
        cancelled: prevAppointments?.filter(a => a.status === 'cancelled').length || 0
      };

      // Calculate week-over-week changes
      const changes = {
        appointments: calcChange(appointmentStats.total, prevAppointmentStats.total),
        completed: calcChange(appointmentStats.completed, prevAppointmentStats.completed),
        cancelled: calcChange(appointmentStats.cancelled, prevAppointmentStats.cancelled),
        reminders: calcChange(reminderStats.total, prevReminderStats.total),
        unsubscribes: calcChange(subscriptionStats.unsubscribes, prevSubscriptionStats.unsubscribes),
        resubscribes: calcChange(subscriptionStats.resubscribes, prevSubscriptionStats.resubscribes)
      };

      const resend = new Resend(integrations.resend_api_key);
      
      const successRate = reminderStats.total > 0 
        ? Math.round((reminderStats.sent / reminderStats.total) * 100) 
        : 100;

      const prevSuccessRate = prevReminderStats.total > 0 
        ? Math.round((prevReminderStats.sent / prevReminderStats.total) * 100) 
        : 100;

      const successRateChange = calcChange(successRate, prevSuccessRate);

      const formatDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      // Determine which sections to include
      const includeAppointments = company.weekly_digest_include_appointments ?? true;
      const includeReminders = company.weekly_digest_include_reminders ?? true;
      const includeSubscriptions = company.weekly_digest_include_subscriptions ?? true;

      // Build HTML sections conditionally
      const appointmentsSection = includeAppointments ? `
        <!-- Appointments Summary -->
        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #374151;">📅 Appointments</h2>
          <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
            <div style="text-align: center; flex: 1; min-width: 80px;">
              <div style="font-size: 28px; font-weight: bold; color: #3b82f6;">${appointmentStats.total}${renderChange(changes.appointments)}</div>
              <div style="font-size: 12px; color: #6b7280;">Total</div>
            </div>
            <div style="text-align: center; flex: 1; min-width: 80px;">
              <div style="font-size: 28px; font-weight: bold; color: #10b981;">${appointmentStats.completed}${renderChange(changes.completed)}</div>
              <div style="font-size: 12px; color: #6b7280;">Completed</div>
            </div>
            <div style="text-align: center; flex: 1; min-width: 80px;">
              <div style="font-size: 28px; font-weight: bold; color: #ef4444;">${appointmentStats.cancelled}${renderChange(changes.cancelled, false)}</div>
              <div style="font-size: 12px; color: #6b7280;">Cancelled</div>
            </div>
          </div>
          <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; font-size: 12px; color: #6b7280;">vs previous week: ${prevAppointmentStats.total} total, ${prevAppointmentStats.completed} completed</p>
          </div>
        </div>
      ` : '';

      const remindersSection = includeReminders ? `
        <!-- Reminders Summary -->
        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #374151;">🔔 Reminders Sent</h2>
          <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 16px;">
            <div style="text-align: center; flex: 1; min-width: 80px;">
              <div style="font-size: 28px; font-weight: bold; color: #3b82f6;">${reminderStats.total}${renderChange(changes.reminders)}</div>
              <div style="font-size: 12px; color: #6b7280;">Total</div>
            </div>
            <div style="text-align: center; flex: 1; min-width: 80px;">
              <div style="font-size: 28px; font-weight: bold; color: #10b981;">${successRate}%${renderChange(successRateChange)}</div>
              <div style="font-size: 12px; color: #6b7280;">Success Rate</div>
            </div>
          </div>
          <div style="border-top: 1px solid #e5e7eb; padding-top: 12px;">
            <p style="margin: 4px 0; font-size: 14px;">📱 SMS: ${reminderStats.sms}</p>
            <p style="margin: 4px 0; font-size: 14px;">✉️ Email: ${reminderStats.email}</p>
            <p style="margin: 4px 0; font-size: 14px;">📞 Voice: ${reminderStats.call}</p>
          </div>
          <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; font-size: 12px; color: #6b7280;">vs previous week: ${prevReminderStats.total} reminders, ${prevSuccessRate}% success</p>
          </div>
        </div>
      ` : '';

      const subscriptionsSection = includeSubscriptions ? `
        <!-- Subscription Trends -->
        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #374151;">📈 Subscription Trends</h2>
          <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 16px;">
            <div style="text-align: center; flex: 1; min-width: 100px;">
              <div style="font-size: 28px; font-weight: bold; color: #ef4444;">${subscriptionStats.unsubscribes}${renderChange(changes.unsubscribes, false)}</div>
              <div style="font-size: 12px; color: #6b7280;">Unsubscribes</div>
            </div>
            <div style="text-align: center; flex: 1; min-width: 100px;">
              <div style="font-size: 28px; font-weight: bold; color: #10b981;">${subscriptionStats.resubscribes}${renderChange(changes.resubscribes)}</div>
              <div style="font-size: 12px; color: #6b7280;">Re-subscribes</div>
            </div>
          </div>
          ${subscriptionStats.unsubscribes > 0 ? `
          <div style="border-top: 1px solid #e5e7eb; padding-top: 12px;">
            <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 500;">Unsubscribes by Channel:</p>
            <p style="margin: 4px 0; font-size: 14px;">📱 SMS: ${subscriptionStats.smsSubs}</p>
            <p style="margin: 4px 0; font-size: 14px;">✉️ Email: ${subscriptionStats.emailSubs}</p>
            <p style="margin: 4px 0; font-size: 14px;">📞 Voice: ${subscriptionStats.callSubs}</p>
          </div>
          ` : ''}
          <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; font-size: 12px; color: #6b7280;">vs previous week: ${prevSubscriptionStats.unsubscribes} unsubscribes, ${prevSubscriptionStats.resubscribes} re-subscribes</p>
          </div>
        </div>
      ` : '';

      // Build alerts section
      const alertsSections = [];
      if (includeAppointments && changes.appointments.direction === 'up' && changes.appointments.value >= 20) {
        alertsSections.push(`
          <div style="background: #d1fae5; border: 1px solid #10b981; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
            <p style="margin: 0; color: #065f46;">🎉 <strong>Great news!</strong> Appointments are up ${changes.appointments.value}% this week!</p>
          </div>
        `);
      }
      if (includeSubscriptions && subscriptionStats.unsubscribes > prevSubscriptionStats.unsubscribes * 1.5 && subscriptionStats.unsubscribes >= 5) {
        alertsSections.push(`
          <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
            <p style="margin: 0; color: #92400e;">⚠️ <strong>Heads up:</strong> Unsubscribes increased significantly this week. Consider reviewing your reminder frequency.</p>
          </div>
        `);
      }

      // Send digest email with week-over-week comparisons and retry logic
      const emailHtml = `
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
                
                ${appointmentsSection}

                ${remindersSection}

                ${subscriptionsSection}

                ${alertsSections.join('')}

                <p style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px;">
                  This is an automated weekly digest. Manage your preferences in your dashboard.
                </p>
              </div>
            </body>
          </html>
        `;

      const emailResult = await sendWithRetry(resend, {
        from: `${company.name} <onboarding@resend.dev>`,
        to: [company.weekly_digest_email],
        subject: `📊 Weekly Performance Digest - ${formatDate(periodStart)} to ${formatDate(periodEnd)}`,
        html: emailHtml,
      });

      if (!emailResult.success) {
        console.error(`Failed to send digest for ${company.name} after ${emailResult.attempts} attempts:`, emailResult.error);
        // Log failed delivery with retry info
        await supabase.from('digest_delivery_logs').insert({
          company_id: company.id,
          digest_type: 'weekly',
          recipient_email: company.weekly_digest_email,
          status: 'failed',
          error_message: `Failed after ${emailResult.attempts} attempts: ${emailResult.error}`,
        });
        if (isTestMode) {
          return new Response(
            JSON.stringify({ success: false, error: `Email failed after ${emailResult.attempts} attempts: ${emailResult.error}` }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        continue;
      }

      // Log successful delivery with retry info
      await supabase.from('digest_delivery_logs').insert({
        company_id: company.id,
        digest_type: 'weekly',
        recipient_email: company.weekly_digest_email,
        status: 'sent',
        error_message: emailResult.attempts > 1 ? `Succeeded after ${emailResult.attempts} attempts` : null,
      });

      // Only update timestamp in non-test mode
      if (!isTestMode) {
        await supabase
          .from('companies')
          .update({ last_weekly_digest_at: periodEnd.toISOString() })
          .eq('id', company.id);
      }

      console.log(`Weekly digest ${isTestMode ? '(TEST)' : ''} sent to ${company.weekly_digest_email} for ${company.name}`);
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
