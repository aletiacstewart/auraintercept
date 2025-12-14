import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SmsRequest {
  appointmentId: string;
  type: 'confirmation' | 'cancellation' | 'reminder';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { appointmentId, type }: SmsRequest = await req.json();

    if (!appointmentId || !type) {
      return new Response(
        JSON.stringify({ error: 'appointmentId and type are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${type} SMS for appointment ${appointmentId}`);

    // Fetch appointment with company details
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        *,
        companies:company_id (
          id,
          name
        )
      `)
      .eq('id', appointmentId)
      .single();

    if (appointmentError || !appointment) {
      console.error('Appointment fetch error:', appointmentError);
      return new Response(
        JSON.stringify({ error: 'Appointment not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!appointment.customer_phone) {
      console.log('No customer phone provided, skipping SMS notification');
      return new Response(
        JSON.stringify({ success: true, message: 'No customer phone, skipped' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch company's Twilio credentials
    const { data: integrations, error: integrationsError } = await supabase
      .from('tenant_integrations')
      .select('twilio_account_sid, twilio_auth_token, twilio_phone_number')
      .eq('company_id', appointment.company_id)
      .maybeSingle();

    if (integrationsError) {
      console.error('Integration fetch error:', integrationsError);
    }

    if (!integrations?.twilio_account_sid || !integrations?.twilio_auth_token || !integrations?.twilio_phone_number) {
      console.log('Twilio not configured for this company, skipping SMS');
      return new Response(
        JSON.stringify({ success: true, message: 'Twilio not configured, skipped' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const company = appointment.companies;
    const companyName = company?.name || 'Our Business';

    // Format appointment datetime
    const appointmentDate = new Date(appointment.datetime);
    const dateStr = appointmentDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    const timeStr = appointmentDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    // Fetch custom SMS template if exists
    const { data: customTemplate } = await supabase
      .from('sms_templates')
      .select('*')
      .eq('company_id', appointment.company_id)
      .eq('template_type', type)
      .maybeSingle();

    // Default templates
    const defaultTemplates: Record<string, string> = {
      confirmation: `Hi ${appointment.customer_name}! Your ${appointment.service_type} appointment at ${companyName} is confirmed for ${dateStr} at ${timeStr}. Reply HELP for assistance.`,
      cancellation: `Hi ${appointment.customer_name}, your appointment at ${companyName} on ${dateStr} at ${timeStr} has been cancelled. Contact us to rebook.`,
      reminder: `Reminder: You have a ${appointment.service_type} appointment at ${companyName} on ${dateStr} at ${timeStr}. See you soon!`,
    };

    // Use custom template or default
    let message: string;
    
    if (customTemplate?.message) {
      // Replace placeholders in custom template
      message = customTemplate.message
        .replace(/\{\{company_name\}\}/g, companyName)
        .replace(/\{\{customer_name\}\}/g, appointment.customer_name)
        .replace(/\{\{service_type\}\}/g, appointment.service_type)
        .replace(/\{\{date\}\}/g, dateStr)
        .replace(/\{\{time\}\}/g, timeStr)
        .replace(/\{\{duration\}\}/g, String(appointment.duration_minutes));
    } else {
      message = defaultTemplates[type];
    }

    // Send SMS via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${integrations.twilio_account_sid}/Messages.json`;
    const credentials = btoa(`${integrations.twilio_account_sid}:${integrations.twilio_auth_token}`);

    const formData = new URLSearchParams();
    formData.append('To', appointment.customer_phone);
    formData.append('From', integrations.twilio_phone_number);
    formData.append('Body', message);

    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const twilioResult = await twilioResponse.json();

    if (!twilioResponse.ok) {
      console.error('Twilio error:', twilioResult);
      return new Response(
        JSON.stringify({ error: 'Failed to send SMS', details: twilioResult }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('SMS sent successfully:', twilioResult.sid);

    return new Response(
      JSON.stringify({ success: true, messageSid: twilioResult.sid }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error sending appointment SMS:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to send SMS';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
