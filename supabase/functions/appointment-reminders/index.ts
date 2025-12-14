import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Appointment {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  datetime: string;
  service_type: string;
  company_id: string;
  reminder_24h_sent: boolean;
  reminder_1h_sent: boolean;
}

interface CompanyIntegration {
  company_id: string;
  twilio_account_sid: string | null;
  twilio_auth_token: string | null;
  twilio_phone_number: string | null;
  company: {
    name: string;
  };
}

interface ReminderSetting {
  id: string;
  company_id: string;
  reminder_type: string;
  is_enabled: boolean;
  hours_before: number;
  sms_template: string;
  call_enabled: boolean;
  call_template: string | null;
}

function applyTemplate(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  return result;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const now = new Date();
    console.log(`Processing reminders at ${now.toISOString()}`);

    // Fetch all enabled reminder settings
    const { data: allSettings, error: settingsErr } = await supabase
      .from('reminder_settings')
      .select('*')
      .eq('is_enabled', true);

    if (settingsErr) {
      console.error('Error fetching reminder settings:', settingsErr);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch settings' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!allSettings || allSettings.length === 0) {
      console.log('No reminder settings configured');
      return new Response(
        JSON.stringify({ success: true, message: 'No reminder settings configured', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Group settings by company
    const settingsByCompany = new Map<string, ReminderSetting[]>();
    for (const setting of allSettings) {
      const existing = settingsByCompany.get(setting.company_id) || [];
      existing.push(setting);
      settingsByCompany.set(setting.company_id, existing);
    }

    console.log(`Found ${allSettings.length} reminder settings across ${settingsByCompany.size} companies`);

    // Fetch company integrations
    const companyIds = Array.from(settingsByCompany.keys());
    const { data: integrations, error: intErr } = await supabase
      .from('tenant_integrations')
      .select('company_id, twilio_account_sid, twilio_auth_token, twilio_phone_number, company:companies(name)')
      .in('company_id', companyIds);

    if (intErr) {
      console.error('Error fetching integrations:', intErr);
    }

    const integrationMap = new Map<string, CompanyIntegration>();
    (integrations || []).forEach((int: any) => {
      integrationMap.set(int.company_id, int);
    });

    let totalSent = 0;
    let totalFailed = 0;

    // Process each company's settings
    for (const [companyId, settings] of settingsByCompany) {
      const integration = integrationMap.get(companyId);
      
      if (!integration?.twilio_account_sid || !integration?.twilio_auth_token || !integration?.twilio_phone_number) {
        console.log(`Skipping company ${companyId}: No Twilio integration`);
        continue;
      }

      const companyName = integration.company?.name || 'Our company';

      // Process each reminder setting for this company
      for (const setting of settings) {
        const hoursBeforeStart = setting.hours_before;
        const hoursBeforeEnd = setting.hours_before + 1;
        
        const windowStart = new Date(now.getTime() + hoursBeforeStart * 60 * 60 * 1000);
        const windowEnd = new Date(now.getTime() + hoursBeforeEnd * 60 * 60 * 1000);

        console.log(`Company ${companyId}: Looking for ${setting.reminder_type} reminders (${setting.hours_before}h) between ${windowStart.toISOString()} and ${windowEnd.toISOString()}`);

        // Determine which reminder field to check based on hours
        // Use the standard fields for 24h and 1h, ignore for custom timings
        let reminderSentField: string | null = null;
        let reminderSentAtField: string | null = null;
        
        if (setting.hours_before === 24) {
          reminderSentField = 'reminder_24h_sent';
          reminderSentAtField = 'reminder_24h_sent_at';
        } else if (setting.hours_before === 1) {
          reminderSentField = 'reminder_1h_sent';
          reminderSentAtField = 'reminder_1h_sent_at';
        }

        // Build query
        let query = supabase
          .from('appointments')
          .select('*')
          .eq('company_id', companyId)
          .eq('status', 'scheduled')
          .gte('datetime', windowStart.toISOString())
          .lt('datetime', windowEnd.toISOString());

        if (reminderSentField) {
          query = query.eq(reminderSentField, false);
        }

        const { data: appointments, error: apptErr } = await query;

        if (apptErr) {
          console.error(`Error fetching appointments for company ${companyId}:`, apptErr);
          continue;
        }

        console.log(`Found ${appointments?.length || 0} appointments for ${setting.reminder_type} reminder`);

        for (const appointment of appointments || []) {
          if (!appointment.customer_phone) {
            console.log(`Skipping appointment ${appointment.id}: No customer phone`);
            continue;
          }

          const appointmentDate = new Date(appointment.datetime);
          const formattedDate = appointmentDate.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          });
          const formattedTime = appointmentDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          });

          const message = applyTemplate(setting.sms_template, {
            customer_name: appointment.customer_name,
            service_type: appointment.service_type,
            company_name: companyName,
            date: formattedDate,
            time: formattedTime,
          });

          try {
            // Send SMS via Twilio
            const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${integration.twilio_account_sid}/Messages.json`;
            const authHeader = btoa(`${integration.twilio_account_sid}:${integration.twilio_auth_token}`);

            const formData = new URLSearchParams();
            formData.append('From', integration.twilio_phone_number);
            formData.append('To', appointment.customer_phone);
            formData.append('Body', message);

            const twilioResponse = await fetch(twilioUrl, {
              method: 'POST',
              headers: {
                'Authorization': `Basic ${authHeader}`,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: formData.toString(),
            });

            if (!twilioResponse.ok) {
              const errorText = await twilioResponse.text();
              console.error(`Twilio error for appointment ${appointment.id}:`, errorText);
              totalFailed++;
              continue;
            }

            const twilioResult = await twilioResponse.json();
            console.log(`SMS sent for appointment ${appointment.id}, SID: ${twilioResult.sid}`);

            // Update reminder status if using standard fields
            if (reminderSentField && reminderSentAtField) {
              const { error: updateErr } = await supabase
                .from('appointments')
                .update({ 
                  [reminderSentField]: true, 
                  [reminderSentAtField]: new Date().toISOString() 
                })
                .eq('id', appointment.id);

              if (updateErr) {
                console.error(`Error updating reminder status for ${appointment.id}:`, updateErr);
              }
            }

            totalSent++;

          } catch (smsError) {
            console.error(`Error sending SMS for appointment ${appointment.id}:`, smsError);
            totalFailed++;
          }
        }
      }
    }

    console.log(`Reminder processing complete. Sent: ${totalSent}, Failed: ${totalFailed}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed reminders`,
        sent: totalSent,
        failed: totalFailed,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in appointment-reminders:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
