import { createClient } from 'npm:@supabase/supabase-js@2';
import { normalizePhoneNumber } from "../_shared/phone-utils.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AppointmentSmsRequest {
  appointmentId: string;
  type: 'confirmation' | 'cancellation' | 'reminder';
}

interface CustomSmsRequest {
  companyId: string;
  toPhone: string;
  message: string;
  type: 'custom';
}

type SmsRequest = AppointmentSmsRequest | CustomSmsRequest;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body: SmsRequest = await req.json();

    // Handle custom SMS (direct message)
    if (body.type === 'custom' && 'companyId' in body && 'toPhone' in body && 'message' in body) {
      const { companyId, toPhone, message } = body;

      console.log(`Processing custom SMS to ${toPhone} for company ${companyId}`);

      // Fetch company's SignalWire credentials
      const { data: integrations, error: integrationsError } = await supabase
        .from('tenant_integrations')
        .select('signalwire_project_id, signalwire_api_token, signalwire_phone_number, signalwire_space_url')
        .eq('company_id', companyId)
        .maybeSingle();

      if (integrationsError) {
        console.error('Integration fetch error:', integrationsError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch integrations' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!integrations?.signalwire_project_id || !integrations?.signalwire_api_token || !integrations?.signalwire_phone_number || !integrations?.signalwire_space_url) {
        return new Response(
          JSON.stringify({ error: 'SignalWire not configured for this company' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Send SMS via SignalWire
      const signalwireUrl = `https://${integrations.signalwire_space_url}/api/laml/2010-04-01/Accounts/${integrations.signalwire_project_id}/Messages`;
      const credentials = btoa(`${integrations.signalwire_project_id}:${integrations.signalwire_api_token}`);

      const formData = new URLSearchParams();
      formData.append('To', toPhone);
      formData.append('From', normalizePhoneNumber(integrations.signalwire_phone_number));
      formData.append('Body', message);

      const signalwireResponse = await fetch(signalwireUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: formData.toString(),
      });

      const signalwireResult = await signalwireResponse.json();

      if (!signalwireResponse.ok) {
        console.error('SignalWire error:', signalwireResult);
        return new Response(
          JSON.stringify({ error: 'Failed to send SMS', details: signalwireResult }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Custom SMS sent successfully:', signalwireResult.sid);

      return new Response(
        JSON.stringify({ success: true, messageSid: signalwireResult.sid }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle appointment-based SMS
    const { appointmentId, type } = body as AppointmentSmsRequest;

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

    // Fetch company's SignalWire credentials
    const { data: integrations, error: integrationsError } = await supabase
      .from('tenant_integrations')
      .select('signalwire_project_id, signalwire_api_token, signalwire_phone_number, signalwire_space_url')
      .eq('company_id', appointment.company_id)
      .maybeSingle();

    if (integrationsError) {
      console.error('Integration fetch error:', integrationsError);
    }

    if (!integrations?.signalwire_project_id || !integrations?.signalwire_api_token || !integrations?.signalwire_phone_number || !integrations?.signalwire_space_url) {
      console.log('SignalWire not configured for this company, skipping SMS');
      return new Response(
        JSON.stringify({ success: true, message: 'SignalWire not configured, skipped' }),
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

    // Send SMS via SignalWire
    const signalwireUrl = `https://${integrations.signalwire_space_url}/api/laml/2010-04-01/Accounts/${integrations.signalwire_project_id}/Messages`;
    const credentials = btoa(`${integrations.signalwire_project_id}:${integrations.signalwire_api_token}`);

    const formData = new URLSearchParams();
    formData.append('To', appointment.customer_phone);
    formData.append('From', normalizePhoneNumber(integrations.signalwire_phone_number));
    formData.append('Body', message);

    const signalwireResponse = await fetch(signalwireUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: formData.toString(),
    });

    const signalwireResult = await signalwireResponse.json();

    if (!signalwireResponse.ok) {
      console.error('SignalWire error:', signalwireResult);
      return new Response(
        JSON.stringify({ error: 'Failed to send SMS', details: signalwireResult }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('SMS sent successfully:', signalwireResult.sid);

    return new Response(
      JSON.stringify({ success: true, messageSid: signalwireResult.sid }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error sending SMS:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to send SMS';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
