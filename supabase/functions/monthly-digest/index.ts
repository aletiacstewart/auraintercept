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
    const currentUTCDay = now.getUTCDate();
    const currentUTCHour = now.getUTCHours();
    
    console.log(`Running monthly digest ${isTestMode ? '(TEST MODE)' : ''} at ${now.toISOString()}, UTC day: ${currentUTCDay}, UTC hour: ${currentUTCHour}`);

    // Helper to get current day and hour in a specific timezone
    const getLocalTime = (timezone: string) => {
      try {
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: timezone,
          day: 'numeric',
          hour: 'numeric',
          hour12: false,
        });
        const parts = formatter.formatToParts(now);
        const dayPart = parts.find(p => p.type === 'day')?.value;
        const hourPart = parts.find(p => p.type === 'hour')?.value;
        
        return {
          day: parseInt(dayPart || '1', 10),
          hour: parseInt(hourPart || '0', 10)
        };
      } catch {
        return { day: currentUTCDay, hour: currentUTCHour };
      }
    };

    let companies;
    
    if (isTestMode && testCompanyId) {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, monthly_digest_email, monthly_digest_day, monthly_digest_time, monthly_digest_timezone, monthly_digest_include_appointments, monthly_digest_include_reminders, monthly_digest_include_subscriptions, last_monthly_digest_at')
        .eq('id', testCompanyId)
        .not('monthly_digest_email', 'is', null);
      
      if (error) throw error;
      companies = data;
      
      if (!companies || companies.length === 0) {
        return new Response(
          JSON.stringify({ success: false, error: 'Please save a recipient email first' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, monthly_digest_email, monthly_digest_day, monthly_digest_time, monthly_digest_timezone, monthly_digest_include_appointments, monthly_digest_include_reminders, monthly_digest_include_subscriptions, last_monthly_digest_at')
        .eq('monthly_digest_enabled', true)
        .not('monthly_digest_email', 'is', null);
      
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

    console.log(`Processing ${companies.length} companies for monthly digest`);

    // Calculate date ranges (this month and last month)
    const periodEnd = new Date();
    const periodStart = new Date(periodEnd.getFullYear(), periodEnd.getMonth() - 1, 1);
    const prevPeriodEnd = new Date(periodStart.getTime());
    const prevPeriodStart = new Date(prevPeriodEnd.getFullYear(), prevPeriodEnd.getMonth() - 1, 1);
    let digestsSent = 0;

    const calcChange = (current: number, previous: number): { value: number; direction: 'up' | 'down' | 'same' } => {
      if (previous === 0) return { value: current > 0 ? 100 : 0, direction: current > 0 ? 'up' : 'same' };
      const change = Math.round(((current - previous) / previous) * 100);
      return { value: Math.abs(change), direction: change > 0 ? 'up' : change < 0 ? 'down' : 'same' };
    };

    const renderChange = (change: { value: number; direction: 'up' | 'down' | 'same' }, positiveIsGood = true) => {
      if (change.direction === 'same' || change.value === 0) return '';
      const isGood = (change.direction === 'up') === positiveIsGood;
      const color = isGood ? '#10b981' : '#ef4444';
      const arrow = change.direction === 'up' ? '↑' : '↓';
      return `<span style="font-size: 12px; color: ${color}; margin-left: 4px;">${arrow}${change.value}%</span>`;
    };

    for (const company of companies) {
      if (!isTestMode) {
        const companyTimezone = company.monthly_digest_timezone || 'America/New_York';
        const localTime = getLocalTime(companyTimezone);
        
        if (localTime.day !== company.monthly_digest_day) {
          console.log(`Skipping ${company.name}: not scheduled for this day (scheduled: ${company.monthly_digest_day}, local day: ${localTime.day})`);
          continue;
        }
        
        if (company.monthly_digest_time) {
          const scheduledHour = parseInt(company.monthly_digest_time.split(':')[0], 10);
          if (Math.abs(localTime.hour - scheduledHour) > 1) {
            console.log(`Skipping ${company.name}: not scheduled for this hour (scheduled: ${scheduledHour}, local hour: ${localTime.hour})`);
            continue;
          }
        }
      }

      if (!isTestMode && company.last_monthly_digest_at) {
        const lastDigest = new Date(company.last_monthly_digest_at);
        if (periodEnd.getTime() - lastDigest.getTime() < 25 * 24 * 60 * 60 * 1000) {
          console.log(`Skipping ${company.name}: digest already sent this month`);
          continue;
        }
      }

      const { data: integrations } = await supabase
        .from('tenant_integrations')
        .select('resend_api_key')
        .eq('company_id', company.id)
        .maybeSingle();

      if (!integrations?.resend_api_key) {
        console.log(`No Resend API key for ${company.name}, skipping digest`);
        continue;
      }

      // Fetch THIS MONTH data
      const { data: reminderLogs } = await supabase
        .from('reminder_logs')
        .select('status, channel')
        .eq('company_id', company.id)
        .gte('created_at', periodStart.toISOString())
        .lte('created_at', periodEnd.toISOString());

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

      const { data: subscriptionEvents } = await supabase
        .from('subscription_events')
        .select('action, channel')
        .eq('company_id', company.id)
        .gte('created_at', periodStart.toISOString())
        .lte('created_at', periodEnd.toISOString());

      const { data: prevSubscriptionEvents } = await supabase
        .from('subscription_events')
        .select('action, channel')
        .eq('company_id', company.id)
        .gte('created_at', prevPeriodStart.toISOString())
        .lte('created_at', prevPeriodEnd.toISOString());

      const subscriptionStats = {
        unsubscribes: subscriptionEvents?.filter(e => e.action === 'unsubscribe').length || 0,
        resubscribes: subscriptionEvents?.filter(e => e.action === 'subscribe').length || 0,
      };
      const netChange = subscriptionStats.resubscribes - subscriptionStats.unsubscribes;

      const prevSubscriptionStats = {
        unsubscribes: prevSubscriptionEvents?.filter(e => e.action === 'unsubscribe').length || 0,
        resubscribes: prevSubscriptionEvents?.filter(e => e.action === 'subscribe').length || 0
      };

      const { data: appointments } = await supabase
        .from('appointments')
        .select('status')
        .eq('company_id', company.id)
        .gte('created_at', periodStart.toISOString())
        .lte('created_at', periodEnd.toISOString());

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
        cancelled: appointments?.filter(a => a.status === 'cancelled').length || 0,
        noShow: appointments?.filter(a => a.status === 'no_show').length || 0
      };

      const prevAppointmentStats = {
        total: prevAppointments?.length || 0,
        completed: prevAppointments?.filter(a => a.status === 'completed').length || 0,
      };

      const changes = {
        appointments: calcChange(appointmentStats.total, prevAppointmentStats.total),
        completed: calcChange(appointmentStats.completed, prevAppointmentStats.completed),
        reminders: calcChange(reminderStats.total, prevReminderStats.total),
        unsubscribes: calcChange(subscriptionStats.unsubscribes, prevSubscriptionStats.unsubscribes),
      };

      const resend = new Resend(integrations.resend_api_key);
      
      const successRate = reminderStats.total > 0 
        ? Math.round((reminderStats.sent / reminderStats.total) * 100) 
        : 100;

      const prevSuccessRate = prevReminderStats.total > 0 
        ? Math.round((prevReminderStats.sent / prevReminderStats.total) * 100) 
        : 100;

      const successRateChange = calcChange(successRate, prevSuccessRate);
      const completionRate = appointmentStats.total > 0 
        ? Math.round((appointmentStats.completed / appointmentStats.total) * 100) 
        : 0;

      const formatMonth = (d: Date) => d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      const { error: emailError } = await resend.emails.send({
        from: `${company.name} <onboarding@resend.dev>`,
        to: [company.monthly_digest_email],
        subject: `📈 Monthly Performance Report - ${formatMonth(periodStart)}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #3b82f6, #10b981); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">📈 Monthly Report</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">${company.name}</p>
                <p style="color: rgba(255,255,255,0.7); margin: 4px 0 0 0; font-size: 14px;">${formatMonth(periodStart)}</p>
              </div>
              
              <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
                
                <!-- Summary Stats -->
                <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                  <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #374151;">📊 Monthly Summary</h2>
                  <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
                    <div style="text-align: center; flex: 1; min-width: 70px;">
                      <div style="font-size: 24px; font-weight: bold; color: #3b82f6;">${appointmentStats.total}${renderChange(changes.appointments)}</div>
                      <div style="font-size: 11px; color: #6b7280;">Appointments</div>
                    </div>
                    <div style="text-align: center; flex: 1; min-width: 70px;">
                      <div style="font-size: 24px; font-weight: bold; color: #10b981;">${appointmentStats.completed}${renderChange(changes.completed)}</div>
                      <div style="font-size: 11px; color: #6b7280;">Completed</div>
                    </div>
                    <div style="text-align: center; flex: 1; min-width: 70px;">
                      <div style="font-size: 24px; font-weight: bold; color: #3b82f6;">${reminderStats.total}${renderChange(changes.reminders)}</div>
                      <div style="font-size: 11px; color: #6b7280;">Reminders</div>
                    </div>
                    <div style="text-align: center; flex: 1; min-width: 70px;">
                      <div style="font-size: 24px; font-weight: bold; color: #10b981;">${successRate}%${renderChange(successRateChange)}</div>
                      <div style="font-size: 11px; color: #6b7280;">Success Rate</div>
                    </div>
                  </div>
                </div>

                <!-- Appointment Breakdown -->
                <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                  <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #374151;">📅 Appointment Breakdown</h2>
                  <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
                    <div style="text-align: center; flex: 1; min-width: 80px;">
                      <div style="font-size: 20px; font-weight: bold; color: #10b981;">${appointmentStats.completed}</div>
                      <div style="font-size: 11px; color: #6b7280;">Completed</div>
                    </div>
                    <div style="text-align: center; flex: 1; min-width: 80px;">
                      <div style="font-size: 20px; font-weight: bold; color: #ef4444;">${appointmentStats.cancelled}</div>
                      <div style="font-size: 11px; color: #6b7280;">Cancelled</div>
                    </div>
                    <div style="text-align: center; flex: 1; min-width: 80px;">
                      <div style="font-size: 20px; font-weight: bold; color: #f59e0b;">${appointmentStats.noShow}</div>
                      <div style="font-size: 11px; color: #6b7280;">No-Show</div>
                    </div>
                  </div>
                  <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0; font-size: 14px;"><strong>Completion Rate:</strong> ${completionRate}%</p>
                  </div>
                </div>

                <!-- Reminder Performance -->
                <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                  <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #374151;">🔔 Reminder Performance</h2>
                  <p style="margin: 4px 0; font-size: 14px;">📱 SMS Reminders: <strong>${reminderStats.sms}</strong></p>
                  <p style="margin: 4px 0; font-size: 14px;">✉️ Email Reminders: <strong>${reminderStats.email}</strong></p>
                  <p style="margin: 4px 0; font-size: 14px;">📞 Voice Reminders: <strong>${reminderStats.call}</strong></p>
                  <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0; font-size: 12px; color: #6b7280;">vs previous month: ${prevReminderStats.total} reminders, ${prevSuccessRate}% success</p>
                  </div>
                </div>

                <!-- Subscription Health -->
                <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                  <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #374151;">📈 Subscription Health</h2>
                  <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
                    <div style="text-align: center; flex: 1; min-width: 80px;">
                      <div style="font-size: 20px; font-weight: bold; color: #ef4444;">${subscriptionStats.unsubscribes}${renderChange(changes.unsubscribes, false)}</div>
                      <div style="font-size: 11px; color: #6b7280;">Unsubscribes</div>
                    </div>
                    <div style="text-align: center; flex: 1; min-width: 80px;">
                      <div style="font-size: 20px; font-weight: bold; color: #10b981;">${subscriptionStats.resubscribes}</div>
                      <div style="font-size: 11px; color: #6b7280;">Re-subscribes</div>
                    </div>
                    <div style="text-align: center; flex: 1; min-width: 80px;">
                      <div style="font-size: 20px; font-weight: bold; color: ${netChange >= 0 ? '#10b981' : '#ef4444'};">${netChange >= 0 ? '+' : ''}${netChange}</div>
                      <div style="font-size: 11px; color: #6b7280;">Net Change</div>
                    </div>
                  </div>
                </div>

                ${changes.appointments.direction === 'up' && changes.appointments.value >= 10 ? `
                <div style="background: #d1fae5; border: 1px solid #10b981; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                  <p style="margin: 0; color: #065f46; font-size: 14px;">
                    🎉 <strong>Great month!</strong> Appointments increased by ${changes.appointments.value}% compared to last month!
                  </p>
                </div>
                ` : ''}

                ${subscriptionStats.unsubscribes > 10 ? `
                <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                  <p style="margin: 0; color: #92400e; font-size: 14px;">
                    ⚠️ <strong>Attention:</strong> You had ${subscriptionStats.unsubscribes} unsubscribes this month. Consider reviewing your communication frequency.
                  </p>
                </div>
                ` : ''}

                <p style="text-align: center; font-size: 12px; color: #6b7280; margin-top: 24px;">
                  This is an automated monthly report from ${company.name}.
                </p>
              </div>
            </body>
          </html>
        `,
      });

      if (emailError) {
        console.error(`Failed to send digest to ${company.name}:`, emailError);
        continue;
      }

      if (!isTestMode) {
        await supabase
          .from('companies')
          .update({ last_monthly_digest_at: now.toISOString() })
          .eq('id', company.id);
      }

      digestsSent++;
      console.log(`Monthly digest sent to ${company.name} at ${company.monthly_digest_email}`);
    }

    return new Response(
      JSON.stringify({ success: true, digests_sent: digestsSent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in monthly-digest function:', message);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});