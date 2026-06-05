import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID');
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

  try {
    const body = await req.json();
    let { action, companyId, appointmentId, appointment, requestConference } = body;

    // If appointment object is missing but we have an appointmentId, fetch it
    if (!appointment && appointmentId) {
      const { data: fetchedAppt } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', appointmentId)
        .single();
      appointment = fetchedAppt;
      if (!companyId && appointment) {
        companyId = appointment.company_id;
      }
    }

    // If we still don't have the appointment for sync actions, return early
    if (action === 'sync_appointment' && !appointment) {
      console.error('No appointment data available for sync, appointmentId:', appointmentId);
      return new Response(
        JSON.stringify({ success: false, error: 'Appointment not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Google Calendar Sync - Action:', action, 'Company:', companyId);

    // Get the company's Google Calendar connection
    const { data: connection, error: connError } = await supabase
      .from('google_calendar_connections')
      .select('*')
      .eq('company_id', companyId)
      .single();

    if (connError || !connection) {
      console.log('No Google Calendar connection found for company:', companyId);
      return new Response(
        JSON.stringify({ success: false, message: 'No Google Calendar connection' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!connection.sync_enabled) {
      console.log('Sync disabled for company:', companyId);
      return new Response(
        JSON.stringify({ success: false, message: 'Sync disabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Refresh token if needed
    let accessToken = connection.access_token;
    if (new Date(connection.token_expires_at) <= new Date()) {
      accessToken = await refreshAccessToken(supabase, connection);
      if (!accessToken) {
        return new Response(
          JSON.stringify({ success: false, message: 'Failed to refresh token' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Get the company name for event descriptions
    const { data: company } = await supabase
      .from('companies')
      .select('name')
      .eq('id', companyId)
      .single();

    const companyName = company?.name || 'Service';

    if (action === 'sync_appointment') {
      return await syncAppointmentToGoogle(supabase, accessToken, companyId, appointment, companyName, requestConference);
    } else if (action === 'delete_event') {
      return await deleteEventFromGoogle(supabase, accessToken, companyId, appointmentId);
    } else if (action === 'sync_all' || action === 'full_sync' || action === 'manual_sync') {
      // Sync all appointments to Google Calendar
      return await syncAllAppointments(supabase, accessToken, companyId, companyName);
    } else if (action === 'import_events') {
      // Import events from Google Calendar into appointments
      return await importEventsFromGoogle(supabase, accessToken, companyId);
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Google Calendar Sync error:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function refreshAccessToken(supabase: any, connection: any): Promise<string | null> {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        refresh_token: connection.refresh_token,
        grant_type: 'refresh_token',
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error('Token refresh error:', data);
      const isInvalidGrant = String(data.error || '').toLowerCase().includes('invalid_grant');
      await supabase
        .from('google_calendar_connections')
        .update({
          last_error: `Token refresh failed: ${data.error}. Please reconnect Google Calendar.`,
          // Disable sync so the UI surfaces a clear "reconnect" state and
          // we stop hammering Google with refresh attempts that will keep failing.
          ...(isInvalidGrant ? { sync_enabled: false } : {}),
        })
        .eq('company_id', connection.company_id);
      if (isInvalidGrant) {
        try {
          await supabase.from('platform_issues').insert({
            issue_type: 'integration_error',
            severity: 'high',
            status: 'new',
            title: 'Google Calendar disconnected — reconnection required',
            description:
              'Google rejected the stored refresh token (invalid_grant). Calendar sync is paused until the owner reconnects under Integrations → Calendar.',
            company_id: connection.company_id,
            context: { source: 'google-calendar-sync', error: data.error },
          } as any);
          await supabase.from('staff_notifications').insert({
            company_id: connection.company_id,
            type: 'integration_alert',
            title: 'Google Calendar needs reconnection',
            body: 'Your Google Calendar connection expired. Open Integrations → Calendar and reconnect to resume appointment sync.',
            severity: 'high',
          } as any);
        } catch (e) {
          console.error('Failed to log invalid_grant platform issue:', e);
        }
      }
      return null;
    }

    await supabase
      .from('google_calendar_connections')
      .update({
        access_token: data.access_token,
        token_expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
        last_error: null,
      })
      .eq('company_id', connection.company_id);

    return data.access_token;
  } catch (error) {
    console.error('Token refresh exception:', error);
    return null;
  }
}

async function syncAppointmentToGoogle(
  supabase: any,
  accessToken: string,
  companyId: string,
  appointment: any,
  companyName: string,
  requestConference?: boolean
): Promise<Response> {
  try {
    // Get company timezone for Google Calendar events
    const { data: companyData } = await supabase
      .from('companies')
      .select('weekly_digest_timezone')
      .eq('id', companyId)
      .single();
    const companyTimezone = companyData?.weekly_digest_timezone || 'America/Chicago';

    // Check if we already have a mapping for this appointment
    const { data: existingMapping } = await supabase
      .from('calendar_event_mappings')
      .select('google_event_id')
      .eq('appointment_id', appointment.id)
      .eq('company_id', companyId)
      .single();

    const startDateTime = new Date(appointment.datetime);
    const endDateTime = new Date(startDateTime.getTime() + (appointment.duration_minutes || 60) * 60 * 1000);

    // Platform stores local times with +00 offset (treating UTC as local).
    // Format as offset-free ISO string so Google uses the calendar's local timezone.
    const formatLocalDateTime = (d: Date) => {
      const year = d.getUTCFullYear();
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      const hours = String(d.getUTCHours()).padStart(2, '0');
      const minutes = String(d.getUTCMinutes()).padStart(2, '0');
      const seconds = String(d.getUTCSeconds()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    };

    const eventData: any = {
      summary: `${appointment.service_type} - ${appointment.customer_name}`,
      description: [
        `Customer: ${appointment.customer_name}`,
        appointment.customer_phone ? `Phone: ${appointment.customer_phone}` : null,
        appointment.customer_email ? `Email: ${appointment.customer_email}` : null,
        appointment.customer_address ? `Address: ${appointment.customer_address}` : null,
        appointment.notes ? `Notes: ${appointment.notes}` : null,
        `\nBooked via ${companyName}`,
      ].filter(Boolean).join('\n'),
      location: appointment.customer_address || undefined,
      start: {
        dateTime: formatLocalDateTime(startDateTime),
        timeZone: companyTimezone,
      },
      end: {
        dateTime: formatLocalDateTime(endDateTime),
        timeZone: companyTimezone,
      },
      extendedProperties: {
        private: {
          appointmentId: appointment.id,
          companyId: companyId,
          source: 'platform',
        },
      },
    };

    // Add conferenceData for virtual appointments when requested
    const isVirtual = appointment.delivery_type === 'virtual';
    const shouldAddConference = requestConference || isVirtual;
    
    if (shouldAddConference) {
      eventData.conferenceData = {
        createRequest: {
          requestId: crypto.randomUUID(),
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      };
    }

    // Determine API URL with conference support
    const conferenceParam = shouldAddConference ? '?conferenceDataVersion=1' : '';

    let response;
    let googleEventId;

    if (existingMapping?.google_event_id) {
      // Update existing event
      response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${existingMapping.google_event_id}${conferenceParam}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventData),
        }
      );
      googleEventId = existingMapping.google_event_id;
    } else {
      // Create new event
      response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events${conferenceParam}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventData),
        }
      );
    }

    const data = await response.json();

    if (data.error) {
      console.error('Google Calendar API error:', data.error);
      await updateSyncStatus(supabase, companyId, appointment.id, 'failed', data.error.message);
      return new Response(
        JSON.stringify({ success: false, error: data.error.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    googleEventId = data.id;
    
    // Extract Google Meet link if available
    const hangoutLink = data.hangoutLink || data.conferenceData?.entryPoints?.find((e: any) => e.entryPointType === 'video')?.uri || null;
    
    if (hangoutLink) {
      console.log('Google Meet link generated:', hangoutLink);
      // Save meeting link to appointment
      await supabase
        .from('appointments')
        .update({ meeting_link: hangoutLink })
        .eq('id', appointment.id);
    }

    // Update or create mapping
    await supabase
      .from('calendar_event_mappings')
      .upsert({
        appointment_id: appointment.id,
        company_id: companyId,
        google_event_id: googleEventId,
        sync_status: 'synced',
        sync_source: 'platform',
        last_synced_at: new Date().toISOString(),
      }, { onConflict: 'appointment_id' });

    // Update connection last sync time
    await supabase
      .from('google_calendar_connections')
      .update({
        last_sync_at: new Date().toISOString(),
        last_error: null,
      })
      .eq('company_id', companyId);

    console.log('Appointment synced to Google Calendar:', appointment.id, '->', googleEventId);

    return new Response(
      JSON.stringify({ success: true, googleEventId, meetingLink: hangoutLink }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Sync error:', error);
    await updateSyncStatus(supabase, companyId, appointment.id, 'failed', error?.message);
    return new Response(
      JSON.stringify({ success: false, error: error?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function deleteEventFromGoogle(
  supabase: any,
  accessToken: string,
  companyId: string,
  appointmentId: string
): Promise<Response> {
  try {
    const { data: mapping } = await supabase
      .from('calendar_event_mappings')
      .select('google_event_id')
      .eq('appointment_id', appointmentId)
      .eq('company_id', companyId)
      .single();

    if (!mapping?.google_event_id) {
      console.log('No Google event mapping found for appointment:', appointmentId);
      return new Response(
        JSON.stringify({ success: true, message: 'No event to delete' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${mapping.google_event_id}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok && response.status !== 404) {
      const error = await response.text();
      console.error('Failed to delete Google event:', error);
      return new Response(
        JSON.stringify({ success: false, error }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Remove the mapping
    await supabase
      .from('calendar_event_mappings')
      .delete()
      .eq('appointment_id', appointmentId)
      .eq('company_id', companyId);

    console.log('Google Calendar event deleted for appointment:', appointmentId);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Delete error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function syncAllAppointments(
  supabase: any,
  accessToken: string,
  companyId: string,
  companyName: string
): Promise<Response> {
  try {
    // Get all scheduled appointments for this company
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('company_id', companyId)
      .in('status', ['scheduled', 'confirmed'])
      .gte('datetime', new Date().toISOString());

    if (error) {
      console.error('Failed to fetch appointments:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let synced = 0;
    let failed = 0;

    for (const appointment of appointments || []) {
      const response = await syncAppointmentToGoogle(supabase, accessToken, companyId, appointment, companyName);
      const result = await response.json();
      if (result.success) {
        synced++;
      } else {
        failed++;
      }
    }

    console.log(`Sync complete - Synced: ${synced}, Failed: ${failed}`);

    return new Response(
      JSON.stringify({ success: true, synced, failed, total: (appointments || []).length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Sync all error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function importEventsFromGoogle(
  supabase: any,
  accessToken: string,
  companyId: string
): Promise<Response> {
  try {
    // Get events from Google Calendar for the next 30 days
    const timeMin = new Date().toISOString();
    const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    const data = await response.json();

    if (data.error) {
      console.error('Google Calendar API error:', data.error);
      return new Response(
        JSON.stringify({ success: false, error: data.error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let imported = 0;
    let skipped = 0;

    for (const event of data.items || []) {
      // Skip all-day events or events without proper dateTime
      if (!event.start?.dateTime || !event.end?.dateTime) {
        skipped++;
        continue;
      }

      // Check if this event was created by our platform (has our extended properties)
      const appointmentId = event.extendedProperties?.private?.appointmentId;
      if (appointmentId) {
        // This event came from our platform, skip it
        skipped++;
        continue;
      }

      // Check if we already have a mapping for this Google event
      const { data: existingMapping } = await supabase
        .from('calendar_event_mappings')
        .select('appointment_id')
        .eq('google_event_id', event.id)
        .eq('company_id', companyId)
        .maybeSingle();

      if (existingMapping) {
        skipped++;
        continue;
      }

      // Create a new appointment from this Google event
      const startDateTime = new Date(event.start.dateTime);
      const endDateTime = new Date(event.end.dateTime);
      const durationMinutes = Math.round((endDateTime.getTime() - startDateTime.getTime()) / 60000);

      const { data: newAppointment, error: insertError } = await supabase
        .from('appointments')
        .insert({
          company_id: companyId,
          customer_name: event.summary || 'Google Calendar Event',
          customer_address: event.location || null,
          service_type: 'Imported Event',
          datetime: startDateTime.toISOString(),
          duration_minutes: durationMinutes,
          notes: event.description || `Imported from Google Calendar: ${event.summary}`,
          status: 'scheduled',
        })
        .select()
        .single();

      if (insertError) {
        console.error('Failed to create appointment:', insertError);
        continue;
      }

      // Create mapping
      await supabase
        .from('calendar_event_mappings')
        .insert({
          appointment_id: newAppointment.id,
          company_id: companyId,
          google_event_id: event.id,
          sync_status: 'synced',
          sync_source: 'google',
          sync_direction: 'from_google',
          last_synced_at: new Date().toISOString(),
        });

      imported++;
    }

    console.log(`Import complete - Imported: ${imported}, Skipped: ${skipped}`);

    // Update connection last sync time
    await supabase
      .from('google_calendar_connections')
      .update({
        last_sync_at: new Date().toISOString(),
        last_error: null,
      })
      .eq('company_id', companyId);

    return new Response(
      JSON.stringify({ success: true, imported, skipped }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Import error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function updateSyncStatus(
  supabase: any,
  companyId: string,
  appointmentId: string,
  status: string,
  errorMessage?: string
) {
  await supabase
    .from('calendar_event_mappings')
    .upsert({
      appointment_id: appointmentId,
      company_id: companyId,
      google_event_id: '',
      sync_status: status,
      last_synced_at: new Date().toISOString(),
    }, { onConflict: 'appointment_id' });

  if (errorMessage) {
    await supabase
      .from('google_calendar_connections')
      .update({ last_error: errorMessage })
      .eq('company_id', companyId);
  }
}