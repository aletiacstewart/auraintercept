import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PortalRequest {
  action: 'get' | 'cancel' | 'reschedule';
  token: string;
  newDatetime?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { action, token, newDatetime }: PortalRequest = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Customer portal action: ${action} for token: ${token}`);

    // Fetch appointment by token
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select(`
        *,
        companies:company_id (
          id,
          name,
          primary_color,
          logo_url
        )
      `)
      .eq('customer_token', token)
      .maybeSingle();

    if (fetchError) {
      console.error('Fetch error:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch appointment' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!appointment) {
      return new Response(
        JSON.stringify({ error: 'Appointment not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    switch (action) {
      case 'get':
        return new Response(
          JSON.stringify({ success: true, appointment }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'cancel':
        if (appointment.status === 'cancelled') {
          return new Response(
            JSON.stringify({ error: 'Appointment is already cancelled' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { error: cancelError } = await supabase
          .from('appointments')
          .update({ status: 'cancelled' })
          .eq('id', appointment.id);

        if (cancelError) {
          console.error('Cancel error:', cancelError);
          return new Response(
            JSON.stringify({ error: 'Failed to cancel appointment' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Send cancellation email
        if (appointment.customer_email) {
          try {
            await fetch(`${supabaseUrl}/functions/v1/send-appointment-email`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ appointmentId: appointment.id, type: 'cancellation' })
            });
          } catch (emailError) {
            console.error('Failed to send cancellation email:', emailError);
          }
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Appointment cancelled successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'reschedule':
        if (!newDatetime) {
          return new Response(
            JSON.stringify({ error: 'New datetime is required for rescheduling' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (appointment.status === 'cancelled') {
          return new Response(
            JSON.stringify({ error: 'Cannot reschedule a cancelled appointment' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check if the new time is in the future
        if (new Date(newDatetime) <= new Date()) {
          return new Response(
            JSON.stringify({ error: 'New appointment time must be in the future' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { error: rescheduleError } = await supabase
          .from('appointments')
          .update({ datetime: newDatetime, status: 'scheduled' })
          .eq('id', appointment.id);

        if (rescheduleError) {
          console.error('Reschedule error:', rescheduleError);
          return new Response(
            JSON.stringify({ error: 'Failed to reschedule appointment' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Send confirmation email for rescheduled appointment
        if (appointment.customer_email) {
          try {
            await fetch(`${supabaseUrl}/functions/v1/send-appointment-email`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ appointmentId: appointment.id, type: 'confirmation' })
            });
          } catch (emailError) {
            console.error('Failed to send rescheduling confirmation email:', emailError);
          }
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Appointment rescheduled successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error: unknown) {
    console.error('Customer portal error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
