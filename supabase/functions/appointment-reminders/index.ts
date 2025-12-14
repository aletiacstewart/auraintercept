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
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1000);
    const in1Hour = new Date(now.getTime() + 60 * 60 * 1000);
    const in2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    console.log(`Processing reminders at ${now.toISOString()}`);
    console.log(`Looking for 24h reminders between ${in24Hours.toISOString()} and ${in25Hours.toISOString()}`);
    console.log(`Looking for 1h reminders between ${in1Hour.toISOString()} and ${in2Hours.toISOString()}`);

    // Fetch appointments needing 24-hour reminder
    const { data: appointments24h, error: err24h } = await supabase
      .from('appointments')
      .select('*')
      .eq('status', 'scheduled')
      .eq('reminder_24h_sent', false)
      .gte('datetime', in24Hours.toISOString())
      .lt('datetime', in25Hours.toISOString());

    if (err24h) {
      console.error('Error fetching 24h appointments:', err24h);
    }

    // Fetch appointments needing 1-hour reminder
    const { data: appointments1h, error: err1h } = await supabase
      .from('appointments')
      .select('*')
      .eq('status', 'scheduled')
      .eq('reminder_1h_sent', false)
      .gte('datetime', in1Hour.toISOString())
      .lt('datetime', in2Hours.toISOString());

    if (err1h) {
      console.error('Error fetching 1h appointments:', err1h);
    }

    const allAppointments = [
      ...(appointments24h || []).map(a => ({ ...a, reminderType: '24h' })),
      ...(appointments1h || []).map(a => ({ ...a, reminderType: '1h' })),
    ];

    console.log(`Found ${appointments24h?.length || 0} appointments for 24h reminder`);
    console.log(`Found ${appointments1h?.length || 0} appointments for 1h reminder`);

    if (allAppointments.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No reminders to send', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get unique company IDs
    const companyIds = [...new Set(allAppointments.map(a => a.company_id))];

    // Fetch company integrations
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

    let sentCount = 0;
    let failedCount = 0;

    // Process each appointment
    for (const appointment of allAppointments) {
      const integration = integrationMap.get(appointment.company_id);
      
      if (!integration?.twilio_account_sid || !integration?.twilio_auth_token || !integration?.twilio_phone_number) {
        console.log(`Skipping appointment ${appointment.id}: No Twilio integration for company ${appointment.company_id}`);
        continue;
      }

      if (!appointment.customer_phone) {
        console.log(`Skipping appointment ${appointment.id}: No customer phone number`);
        continue;
      }

      const companyName = integration.company?.name || 'Our company';
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

      const reminderType = (appointment as any).reminderType;
      const timeUntil = reminderType === '24h' ? 'tomorrow' : 'in 1 hour';

      const message = `Hi ${appointment.customer_name}! This is a reminder from ${companyName} about your ${appointment.service_type} appointment ${timeUntil} on ${formattedDate} at ${formattedTime}. Reply CONFIRM to confirm or call us to reschedule.`;

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
          failedCount++;
          continue;
        }

        const twilioResult = await twilioResponse.json();
        console.log(`SMS sent for appointment ${appointment.id}, SID: ${twilioResult.sid}`);

        // Update reminder status
        const updateField = reminderType === '24h' 
          ? { reminder_24h_sent: true, reminder_24h_sent_at: new Date().toISOString() }
          : { reminder_1h_sent: true, reminder_1h_sent_at: new Date().toISOString() };

        const { error: updateErr } = await supabase
          .from('appointments')
          .update(updateField)
          .eq('id', appointment.id);

        if (updateErr) {
          console.error(`Error updating reminder status for ${appointment.id}:`, updateErr);
        } else {
          sentCount++;
        }

      } catch (smsError) {
        console.error(`Error sending SMS for appointment ${appointment.id}:`, smsError);
        failedCount++;
      }
    }

    console.log(`Reminder processing complete. Sent: ${sentCount}, Failed: ${failedCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${allAppointments.length} appointments`,
        sent: sentCount,
        failed: failedCount,
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
