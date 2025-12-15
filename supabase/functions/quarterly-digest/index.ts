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
    const currentMonth = now.getMonth();
    const currentQuarterMonth = (currentMonth % 3) + 1; // 1, 2, or 3
    const currentDay = now.getDate();
    const currentHour = now.getUTCHours();
    
    console.log(`Running quarterly digest ${isTestMode ? '(TEST MODE)' : ''} at ${now.toISOString()}, quarter month: ${currentQuarterMonth}, day: ${currentDay}`);

    const getLocalTime = (timezone: string) => {
      try {
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: timezone,
          day: 'numeric',
          month: 'numeric',
          hour: 'numeric',
          hour12: false,
        });
        const parts = formatter.formatToParts(now);
        const dayPart = parts.find(p => p.type === 'day')?.value;
        const monthPart = parts.find(p => p.type === 'month')?.value;
        const hourPart = parts.find(p => p.type === 'hour')?.value;
        
        const localMonth = parseInt(monthPart || '1', 10) - 1;
        const localQuarterMonth = (localMonth % 3) + 1;
        
        return {
          quarterMonth: localQuarterMonth,
          day: parseInt(dayPart || '1', 10),
          hour: parseInt(hourPart || '0', 10)
        };
      } catch {
        return { quarterMonth: currentQuarterMonth, day: currentDay, hour: currentHour };
      }
    };

    let companies;
    
    if (isTestMode && testCompanyId) {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, quarterly_digest_email, quarterly_digest_month, quarterly_digest_day, quarterly_digest_time, quarterly_digest_timezone, last_quarterly_digest_at')
        .eq('id', testCompanyId)
        .not('quarterly_digest_email', 'is', null);
      
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
        .select('id, name, quarterly_digest_email, quarterly_digest_month, quarterly_digest_day, quarterly_digest_time, quarterly_digest_timezone, last_quarterly_digest_at')
        .eq('quarterly_digest_enabled', true)
        .not('quarterly_digest_email', 'is', null);
      
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

    console.log(`Processing ${companies.length} companies for quarterly digest`);

    // Calculate date ranges
    const currentQuarter = Math.floor(now.getMonth() / 3);
    const thisQuarterStart = new Date(now.getFullYear(), currentQuarter * 3, 1);
    const lastQuarterStart = new Date(now.getFullYear(), (currentQuarter - 1) * 3, 1);
    const lastQuarterEnd = new Date(thisQuarterStart.getTime() - 1);
    const prevLastQuarterStart = new Date(now.getFullYear(), (currentQuarter - 2) * 3, 1);
    const prevLastQuarterEnd = new Date(lastQuarterStart.getTime() - 1);
    
    // Year-over-year comparison
    const lastYearSameQuarterStart = new Date(now.getFullYear() - 1, (currentQuarter - 1) * 3, 1);
    const lastYearSameQuarterEnd = new Date(now.getFullYear() - 1, currentQuarter * 3, 0);
    
    let digestsSent = 0;

    const calcChange = (current: number, previous: number): { value: number; direction: 'up' | 'down' | 'same' } => {
      if (previous === 0) return { value: current > 0 ? 100 : 0, direction: current > 0 ? 'up' : 'same' };
      const change = Math.round(((current - previous) / previous) * 100);
      return { value: Math.abs(change), direction: change > 0 ? 'up' : change < 0 ? 'down' : 'same' };
    };

    const renderChange = (change: { value: number; direction: 'up' | 'down' | 'same' }, positiveIsGood = true, label = '') => {
      if (change.direction === 'same' || change.value === 0) return '-';
      const isGood = (change.direction === 'up') === positiveIsGood;
      const color = isGood ? '#10b981' : '#ef4444';
      const arrow = change.direction === 'up' ? '↑' : '↓';
      return `<span style="color: ${color};">${arrow}${change.value}%${label ? ` ${label}` : ''}</span>`;
    };

    const formatQuarter = (d: Date) => `Q${Math.floor(d.getMonth() / 3) + 1} ${d.getFullYear()}`;

    for (const company of companies) {
      if (!isTestMode) {
        const companyTimezone = company.quarterly_digest_timezone || 'America/New_York';
        const localTime = getLocalTime(companyTimezone);
        
        if (localTime.quarterMonth !== company.quarterly_digest_month) {
          console.log(`Skipping ${company.name}: not in scheduled month of quarter`);
          continue;
        }
        
        if (localTime.day !== company.quarterly_digest_day) {
          console.log(`Skipping ${company.name}: not scheduled for this day`);
          continue;
        }
        
        if (company.quarterly_digest_time) {
          const scheduledHour = parseInt(company.quarterly_digest_time.split(':')[0], 10);
          if (Math.abs(localTime.hour - scheduledHour) > 1) {
            console.log(`Skipping ${company.name}: not scheduled for this hour`);
            continue;
          }
        }
      }

      if (!isTestMode && company.last_quarterly_digest_at) {
        const lastDigest = new Date(company.last_quarterly_digest_at);
        if (now.getTime() - lastDigest.getTime() < 80 * 24 * 60 * 60 * 1000) {
          console.log(`Skipping ${company.name}: digest already sent this quarter`);
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

      // Fetch THIS QUARTER data
      const { data: appointments } = await supabase
        .from('appointments')
        .select('status')
        .eq('company_id', company.id)
        .gte('created_at', lastQuarterStart.toISOString())
        .lte('created_at', lastQuarterEnd.toISOString());

      const { data: prevAppointments } = await supabase
        .from('appointments')
        .select('status')
        .eq('company_id', company.id)
        .gte('created_at', prevLastQuarterStart.toISOString())
        .lte('created_at', prevLastQuarterEnd.toISOString());

      const { data: yoyAppointments } = await supabase
        .from('appointments')
        .select('status')
        .eq('company_id', company.id)
        .gte('created_at', lastYearSameQuarterStart.toISOString())
        .lte('created_at', lastYearSameQuarterEnd.toISOString());

      const { data: reminderLogs } = await supabase
        .from('reminder_logs')
        .select('status, channel')
        .eq('company_id', company.id)
        .gte('created_at', lastQuarterStart.toISOString())
        .lte('created_at', lastQuarterEnd.toISOString());

      const { data: prevReminderLogs } = await supabase
        .from('reminder_logs')
        .select('status, channel')
        .eq('company_id', company.id)
        .gte('created_at', prevLastQuarterStart.toISOString())
        .lte('created_at', prevLastQuarterEnd.toISOString());

      const { data: yoyReminderLogs } = await supabase
        .from('reminder_logs')
        .select('status, channel')
        .eq('company_id', company.id)
        .gte('created_at', lastYearSameQuarterStart.toISOString())
        .lte('created_at', lastYearSameQuarterEnd.toISOString());

      const { data: subscriptionEvents } = await supabase
        .from('subscription_events')
        .select('action')
        .eq('company_id', company.id)
        .gte('created_at', lastQuarterStart.toISOString())
        .lte('created_at', lastQuarterEnd.toISOString());

      const { data: prevSubscriptionEvents } = await supabase
        .from('subscription_events')
        .select('action')
        .eq('company_id', company.id)
        .gte('created_at', prevLastQuarterStart.toISOString())
        .lte('created_at', prevLastQuarterEnd.toISOString());

      // Calculate stats
      const appointmentStats = {
        total: appointments?.length || 0,
        completed: appointments?.filter(a => a.status === 'completed').length || 0,
        cancelled: appointments?.filter(a => a.status === 'cancelled').length || 0,
        noShow: appointments?.filter(a => a.status === 'no_show').length || 0
      };

      const prevAppointmentStats = {
        total: prevAppointments?.length || 0,
        completed: prevAppointments?.filter(a => a.status === 'completed').length || 0
      };

      const yoyAppointmentStats = {
        total: yoyAppointments?.length || 0,
        completed: yoyAppointments?.filter(a => a.status === 'completed').length || 0
      };

      const reminderStats = {
        total: reminderLogs?.length || 0,
        sent: reminderLogs?.filter(r => r.status === 'sent').length || 0,
        sms: reminderLogs?.filter(r => r.channel === 'sms').length || 0,
        email: reminderLogs?.filter(r => r.channel === 'email').length || 0,
        call: reminderLogs?.filter(r => r.channel === 'call').length || 0
      };

      const prevReminderStats = {
        total: prevReminderLogs?.length || 0,
        sent: prevReminderLogs?.filter(r => r.status === 'sent').length || 0
      };

      const yoyReminderStats = {
        total: yoyReminderLogs?.length || 0,
        sent: yoyReminderLogs?.filter(r => r.status === 'sent').length || 0
      };

      const subscriptionStats = {
        unsubscribes: subscriptionEvents?.filter(e => e.action === 'unsubscribe').length || 0,
        resubscribes: subscriptionEvents?.filter(e => e.action === 'subscribe').length || 0,
      };
      const netChange = subscriptionStats.resubscribes - subscriptionStats.unsubscribes;

      const prevSubscriptionStats = {
        unsubscribes: prevSubscriptionEvents?.filter(e => e.action === 'unsubscribe').length || 0
      };

      // Calculate changes
      const qoqChanges = {
        appointments: calcChange(appointmentStats.total, prevAppointmentStats.total),
        completed: calcChange(appointmentStats.completed, prevAppointmentStats.completed),
        reminders: calcChange(reminderStats.total, prevReminderStats.total),
        unsubscribes: calcChange(subscriptionStats.unsubscribes, prevSubscriptionStats.unsubscribes)
      };

      const yoyChanges = {
        appointments: calcChange(appointmentStats.total, yoyAppointmentStats.total),
        completed: calcChange(appointmentStats.completed, yoyAppointmentStats.completed),
        reminders: calcChange(reminderStats.total, yoyReminderStats.total)
      };

      const successRate = reminderStats.total > 0 ? Math.round((reminderStats.sent / reminderStats.total) * 100) : 100;
      const prevSuccessRate = prevReminderStats.total > 0 ? Math.round((prevReminderStats.sent / prevReminderStats.total) * 100) : 100;
      const yoySuccessRate = yoyReminderStats.total > 0 ? Math.round((yoyReminderStats.sent / yoyReminderStats.total) * 100) : 100;
      const completionRate = appointmentStats.total > 0 ? Math.round((appointmentStats.completed / appointmentStats.total) * 100) : 0;
      const avgPerWeek = Math.round(appointmentStats.total / 13);

      const resend = new Resend(integrations.resend_api_key);

      const { error: emailError } = await resend.emails.send({
        from: `${company.name} <onboarding@resend.dev>`,
        to: [company.quarterly_digest_email],
        subject: `📊 Quarterly Business Review - ${formatQuarter(lastQuarterStart)}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 650px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">📊 Quarterly Business Review</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">${company.name}</p>
                <p style="color: rgba(255,255,255,0.7); margin: 4px 0 0 0; font-size: 14px;">${formatQuarter(lastQuarterStart)}</p>
              </div>
              
              <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
                
                <!-- Executive Summary -->
                <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                  <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #374151;">📈 Executive Summary</h2>
                  <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
                    <div style="text-align: center; flex: 1; min-width: 70px;">
                      <div style="font-size: 24px; font-weight: bold; color: #4f46e5;">${appointmentStats.total}</div>
                      <div style="font-size: 11px; color: #6b7280;">Appointments</div>
                      <div style="font-size: 11px; margin-top: 4px;">${renderChange(qoqChanges.appointments, true, 'QoQ')}</div>
                    </div>
                    <div style="text-align: center; flex: 1; min-width: 70px;">
                      <div style="font-size: 24px; font-weight: bold; color: #10b981;">${appointmentStats.completed}</div>
                      <div style="font-size: 11px; color: #6b7280;">Completed</div>
                      <div style="font-size: 11px; margin-top: 4px;">${renderChange(qoqChanges.completed, true, 'QoQ')}</div>
                    </div>
                    <div style="text-align: center; flex: 1; min-width: 70px;">
                      <div style="font-size: 24px; font-weight: bold; color: #4f46e5;">${reminderStats.total}</div>
                      <div style="font-size: 11px; color: #6b7280;">Reminders</div>
                      <div style="font-size: 11px; margin-top: 4px;">${renderChange(qoqChanges.reminders, true, 'QoQ')}</div>
                    </div>
                    <div style="text-align: center; flex: 1; min-width: 70px;">
                      <div style="font-size: 24px; font-weight: bold; color: #10b981;">${successRate}%</div>
                      <div style="font-size: 11px; color: #6b7280;">Success Rate</div>
                    </div>
                  </div>
                </div>

                <!-- Year-over-Year Comparison -->
                <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                  <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #374151;">📅 Year-over-Year Comparison</h2>
                  <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    <thead>
                      <tr style="border-bottom: 1px solid #e5e7eb;">
                        <th style="text-align: left; padding: 8px 4px;">Metric</th>
                        <th style="text-align: center; padding: 8px 4px;">${formatQuarter(lastYearSameQuarterStart)}</th>
                        <th style="text-align: center; padding: 8px 4px;">${formatQuarter(lastQuarterStart)}</th>
                        <th style="text-align: center; padding: 8px 4px;">YoY</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style="border-bottom: 1px solid #e5e7eb;">
                        <td style="padding: 8px 4px;">Appointments</td>
                        <td style="text-align: center; padding: 8px 4px;">${yoyAppointmentStats.total}</td>
                        <td style="text-align: center; padding: 8px 4px; font-weight: 600;">${appointmentStats.total}</td>
                        <td style="text-align: center; padding: 8px 4px;">${renderChange(yoyChanges.appointments)}</td>
                      </tr>
                      <tr style="border-bottom: 1px solid #e5e7eb;">
                        <td style="padding: 8px 4px;">Completed</td>
                        <td style="text-align: center; padding: 8px 4px;">${yoyAppointmentStats.completed}</td>
                        <td style="text-align: center; padding: 8px 4px; font-weight: 600;">${appointmentStats.completed}</td>
                        <td style="text-align: center; padding: 8px 4px;">${renderChange(yoyChanges.completed)}</td>
                      </tr>
                      <tr style="border-bottom: 1px solid #e5e7eb;">
                        <td style="padding: 8px 4px;">Reminders</td>
                        <td style="text-align: center; padding: 8px 4px;">${yoyReminderStats.total}</td>
                        <td style="text-align: center; padding: 8px 4px; font-weight: 600;">${reminderStats.total}</td>
                        <td style="text-align: center; padding: 8px 4px;">${renderChange(yoyChanges.reminders)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 4px;">Success Rate</td>
                        <td style="text-align: center; padding: 8px 4px;">${yoySuccessRate}%</td>
                        <td style="text-align: center; padding: 8px 4px; font-weight: 600;">${successRate}%</td>
                        <td style="text-align: center; padding: 8px 4px; color: ${successRate >= yoySuccessRate ? '#10b981' : '#ef4444'};">${successRate >= yoySuccessRate ? '+' : ''}${successRate - yoySuccessRate}pp</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- Quarterly Metrics -->
                <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                  <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #374151;">📊 Quarterly Metrics</h2>
                  <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
                    <div style="text-align: center; flex: 1; min-width: 80px;">
                      <div style="font-size: 20px; font-weight: bold; color: #4f46e5;">${avgPerWeek}</div>
                      <div style="font-size: 11px; color: #6b7280;">Avg/Week</div>
                    </div>
                    <div style="text-align: center; flex: 1; min-width: 80px;">
                      <div style="font-size: 20px; font-weight: bold; color: #10b981;">${completionRate}%</div>
                      <div style="font-size: 11px; color: #6b7280;">Completion</div>
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
                </div>

                <!-- Subscription Health -->
                <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                  <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #374151;">📈 Subscription Health</h2>
                  <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
                    <div style="text-align: center; flex: 1; min-width: 80px;">
                      <div style="font-size: 20px; font-weight: bold; color: #ef4444;">${subscriptionStats.unsubscribes}</div>
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

                <!-- Strategic Insights -->
                ${yoyChanges.appointments.direction === 'up' && yoyChanges.appointments.value >= 10 ? `
                <div style="background: #d1fae5; border: 1px solid #10b981; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                  <h3 style="margin: 0 0 8px 0; color: #065f46; font-size: 14px;">💡 Strategic Insights</h3>
                  <ul style="margin: 0; padding-left: 20px; color: #065f46; font-size: 13px;">
                    <li>Appointments grew ${yoyChanges.appointments.value}% year-over-year</li>
                    ${successRate > yoySuccessRate ? `<li>Reminder success rate improved by ${successRate - yoySuccessRate} percentage points</li>` : ''}
                    ${qoqChanges.appointments.direction === 'up' ? `<li>Quarter-over-quarter growth of ${qoqChanges.appointments.value}%</li>` : ''}
                  </ul>
                </div>
                ` : ''}

                ${subscriptionStats.unsubscribes > 20 ? `
                <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                  <p style="margin: 0; color: #92400e; font-size: 14px;">
                    ⚠️ <strong>Attention:</strong> ${subscriptionStats.unsubscribes} unsubscribes this quarter. Consider reviewing your communication strategy.
                  </p>
                </div>
                ` : ''}

                <p style="text-align: center; font-size: 12px; color: #6b7280; margin-top: 24px;">
                  This is an automated quarterly report from ${company.name}.
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
          .update({ last_quarterly_digest_at: now.toISOString() })
          .eq('id', company.id);
      }

      digestsSent++;
      console.log(`Quarterly digest sent to ${company.name} at ${company.quarterly_digest_email}`);
    }

    return new Response(
      JSON.stringify({ success: true, digests_sent: digestsSent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in quarterly-digest function:', message);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});