import { createClient } from 'npm:@supabase/supabase-js@2';
import { getCompanyTerminology } from '../_shared/terminology.ts';
import { sendGuardedSms } from '../_shared/sms-guard.ts';
import { requireCronSecret } from '../_shared/cron-auth.ts';

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
  sms_opt_out: boolean;
  email_opt_out: boolean;
  call_opt_out: boolean;
}

interface CompanyIntegration {
  company_id: string;
  signalwire_project_id: string | null;
  signalwire_api_token: string | null;
  signalwire_phone_number: string | null;
  signalwire_space_url: string | null;
  resend_api_key: string | null;
  elevenlabs_api_key: string | null;
  elevenlabs_voice_id: string | null;
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

async function logReminder(
  supabase: any,
  companyId: string,
  appointmentId: string,
  reminderType: string,
  channel: 'sms' | 'email' | 'call',
  status: 'sent' | 'failed' | 'skipped',
  recipient: string | null,
  messagePreview?: string,
  errorMessage?: string
) {
  try {
    await supabase.from('reminder_logs').insert({
      company_id: companyId,
      appointment_id: appointmentId,
      reminder_type: reminderType,
      channel,
      status,
      recipient,
      message_preview: messagePreview?.substring(0, 100),
      error_message: errorMessage,
    });
  } catch (err) {
    console.error('Failed to log reminder:', err);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const denied = await requireCronSecret(req, corsHeaders);
  if (denied) return denied;

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
      .select('company_id, signalwire_project_id, signalwire_api_token, signalwire_phone_number, signalwire_space_url, resend_api_key, elevenlabs_api_key, elevenlabs_voice_id, company:companies(name)')
      .in('company_id', companyIds);

    if (intErr) {
      console.error('Error fetching integrations:', intErr);
    }

    const integrationMap = new Map<string, CompanyIntegration>();
    (integrations || []).forEach((int: any) => {
      integrationMap.set(int.company_id, int);
    });

    let smsSent = 0;
    let smsFailed = 0;
    let emailsSent = 0;
    let emailsFailed = 0;
    let callsSent = 0;
    let callsFailed = 0;

    // Process each company's settings
    for (const [companyId, settings] of settingsByCompany) {
      const integration = integrationMap.get(companyId);
      
      const hasSignalWire = integration?.signalwire_project_id && integration?.signalwire_api_token && integration?.signalwire_phone_number && integration?.signalwire_space_url;
      const hasResend = !!integration?.resend_api_key;
      const hasElevenLabs = !!(integration?.elevenlabs_api_key);
      
      if (!hasSignalWire && !hasResend) {
        console.log(`Skipping company ${companyId}: No SignalWire or Resend integration`);
        continue;
      }

      const companyName = integration?.company?.name || 'Our company';
      // Resolve industry-aware nouns once per company so SMS/email/call
      // templates can substitute {appointment_noun}, {service_noun}, {job_noun}.
      const term = await getCompanyTerminology(supabase as any, companyId);

      // Process each reminder setting for this company
      for (const setting of settings) {
        const hoursBeforeStart = setting.hours_before;
        const hoursBeforeEnd = setting.hours_before + 1;
        
        const windowStart = new Date(now.getTime() + hoursBeforeStart * 60 * 60 * 1000);
        const windowEnd = new Date(now.getTime() + hoursBeforeEnd * 60 * 60 * 1000);

        console.log(`Company ${companyId}: Looking for ${setting.reminder_type} reminders (${setting.hours_before}h) between ${windowStart.toISOString()} and ${windowEnd.toISOString()}`);

        // Determine which reminder field to check based on hours
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

          const templateVars = {
            customer_name: appointment.customer_name,
            service_type: appointment.service_type,
            company_name: companyName,
            date: formattedDate,
            time: formattedTime,
            appointment_noun: term.appointment,
            service_noun: term.serviceType,
            job_noun: term.job,
            customer_noun: term.customer,
          };

          // Send SMS reminder (check opt-out)
          if (hasSignalWire && appointment.customer_phone && !appointment.sms_opt_out) {
            const message = applyTemplate(setting.sms_template, templateVars);

            try {
              const result = await sendGuardedSms({
                supabase,
                companyId,
                from: integration!.signalwire_phone_number!,
                to: appointment.customer_phone,
                body: message,
                source: 'reminder',
                appointmentId: appointment.id,
                customerName: appointment.customer_name,
              });
              if (!result.ok) {
                console.error(`SignalWire error for appointment ${appointment.id}:`, result.error);
                smsFailed++;
                await logReminder(supabase, companyId, appointment.id, setting.reminder_type, 'sms', 'failed', appointment.customer_phone, message, result.error || 'send failed');
              } else {
                console.log(`SMS sent for appointment ${appointment.id}, SID: ${result.providerMessageId || 'n/a'}`);
                smsSent++;
                await logReminder(supabase, companyId, appointment.id, setting.reminder_type, 'sms', 'sent', appointment.customer_phone, message);
              }
            } catch (smsError: any) {
              console.error(`Error sending SMS for appointment ${appointment.id}:`, smsError);
              smsFailed++;
              await logReminder(supabase, companyId, appointment.id, setting.reminder_type, 'sms', 'failed', appointment.customer_phone, undefined, smsError.message);
            }
          } else if (appointment.sms_opt_out) {
            console.log(`Skipping SMS for appointment ${appointment.id}: Customer opted out`);
            await logReminder(supabase, companyId, appointment.id, setting.reminder_type, 'sms', 'skipped', appointment.customer_phone, undefined, 'Customer opted out');
          } else if (!appointment.customer_phone) {
            console.log(`Skipping SMS for appointment ${appointment.id}: No customer phone`);
            await logReminder(supabase, companyId, appointment.id, setting.reminder_type, 'sms', 'skipped', null, undefined, 'No customer phone');
          }

          // Send Email reminder (check opt-out)
          if (hasResend && appointment.customer_email && !appointment.email_opt_out) {
            try {
              // Call the send-appointment-email function
              const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-appointment-email`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${serviceRoleKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  appointmentId: appointment.id,
                  type: 'reminder',
                }),
              });

              if (!emailResponse.ok) {
                const errorText = await emailResponse.text();
                console.error(`Email error for appointment ${appointment.id}:`, errorText);
                emailsFailed++;
                await logReminder(supabase, companyId, appointment.id, setting.reminder_type, 'email', 'failed', appointment.customer_email, undefined, errorText);
              } else {
                console.log(`Email reminder sent for appointment ${appointment.id}`);
                emailsSent++;
                await logReminder(supabase, companyId, appointment.id, setting.reminder_type, 'email', 'sent', appointment.customer_email, 'Email reminder sent');
              }
            } catch (emailError: any) {
              console.error(`Error sending email for appointment ${appointment.id}:`, emailError);
              emailsFailed++;
              await logReminder(supabase, companyId, appointment.id, setting.reminder_type, 'email', 'failed', appointment.customer_email, undefined, emailError.message);
            }
          } else if (appointment.email_opt_out) {
            console.log(`Skipping email for appointment ${appointment.id}: Customer opted out`);
            await logReminder(supabase, companyId, appointment.id, setting.reminder_type, 'email', 'skipped', appointment.customer_email, undefined, 'Customer opted out');
          } else if (!appointment.customer_email) {
            console.log(`Skipping email for appointment ${appointment.id}: No customer email`);
            await logReminder(supabase, companyId, appointment.id, setting.reminder_type, 'email', 'skipped', null, undefined, 'No customer email');
          }

          // Send Voice Call reminder (if enabled and configured - check call_opt_out)
          if (setting.call_enabled && hasSignalWire && hasElevenLabs && appointment.customer_phone && !appointment.call_opt_out) {
            const callMessage = setting.call_template 
              ? applyTemplate(setting.call_template, templateVars)
              : applyTemplate(setting.sms_template, templateVars);

            try {
              const signalwireUrl = `https://${integration!.signalwire_space_url}/api/laml/2010-04-01/Accounts/${integration!.signalwire_project_id}/Calls`;
              const authHeader = btoa(`${integration!.signalwire_project_id}:${integration!.signalwire_api_token}`);

              // Build the URL for the voice handler with context
              const voiceHandlerUrl = new URL(`${supabaseUrl}/functions/v1/voice-handler`);
              voiceHandlerUrl.searchParams.set('action', 'outbound');
              voiceHandlerUrl.searchParams.set('context', JSON.stringify({
                message: callMessage,
                purpose: 'reminder',
                appointmentId: appointment.id,
                companyId: companyId,
              }));

              const formData = new URLSearchParams();
              formData.append('From', integration!.signalwire_phone_number!);
              formData.append('To', appointment.customer_phone);
              formData.append('Url', voiceHandlerUrl.toString());
              formData.append('StatusCallback', `${supabaseUrl}/functions/v1/voice-handler?action=status`);
              formData.append('StatusCallbackEvent', 'initiated');
              formData.append('StatusCallbackEvent', 'ringing');
              formData.append('StatusCallbackEvent', 'answered');
              formData.append('StatusCallbackEvent', 'completed');

              const signalwireResponse = await fetch(signalwireUrl, {
                method: 'POST',
                headers: {
                  'Authorization': `Basic ${authHeader}`,
                  'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData.toString(),
              });

              if (!signalwireResponse.ok) {
                const errorText = await signalwireResponse.text();
                console.error(`SignalWire call error for appointment ${appointment.id}:`, errorText);
                callsFailed++;
                await logReminder(supabase, companyId, appointment.id, setting.reminder_type, 'call', 'failed', appointment.customer_phone, callMessage, errorText);
              } else {
                const signalwireResult = await signalwireResponse.json();
                console.log(`Voice call initiated for appointment ${appointment.id}, SID: ${signalwireResult.sid}`);
                callsSent++;
                await logReminder(supabase, companyId, appointment.id, setting.reminder_type, 'call', 'sent', appointment.customer_phone, callMessage);
              }
            } catch (callError: any) {
              console.error(`Error initiating call for appointment ${appointment.id}:`, callError);
              callsFailed++;
              await logReminder(supabase, companyId, appointment.id, setting.reminder_type, 'call', 'failed', appointment.customer_phone, undefined, callError.message);
            }
          } else if (setting.call_enabled && appointment.call_opt_out) {
            console.log(`Skipping call for appointment ${appointment.id}: Customer opted out`);
            await logReminder(supabase, companyId, appointment.id, setting.reminder_type, 'call', 'skipped', appointment.customer_phone, undefined, 'Customer opted out');
          } else if (setting.call_enabled && !hasElevenLabs) {
            console.log(`Skipping call for appointment ${appointment.id}: ElevenLabs not configured`);
            await logReminder(supabase, companyId, appointment.id, setting.reminder_type, 'call', 'skipped', appointment.customer_phone, undefined, 'ElevenLabs not configured');
          } else if (setting.call_enabled && !hasSignalWire) {
            console.log(`Skipping call for appointment ${appointment.id}: SignalWire not configured`);
            await logReminder(supabase, companyId, appointment.id, setting.reminder_type, 'call', 'skipped', appointment.customer_phone, undefined, 'SignalWire not configured');
          } else if (setting.call_enabled && !appointment.customer_phone) {
            console.log(`Skipping call for appointment ${appointment.id}: No customer phone`);
            await logReminder(supabase, companyId, appointment.id, setting.reminder_type, 'call', 'skipped', null, undefined, 'No customer phone');
          }

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
        }
      }
    }

    const summary = {
      success: true,
      processed: {
        sms: { sent: smsSent, failed: smsFailed },
        emails: { sent: emailsSent, failed: emailsFailed },
        calls: { sent: callsSent, failed: callsFailed },
      },
      timestamp: now.toISOString(),
    };

    console.log('Reminder processing complete:', summary);

    return new Response(
      JSON.stringify(summary),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error processing reminders:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
