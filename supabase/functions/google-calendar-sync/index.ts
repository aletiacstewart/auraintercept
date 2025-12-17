import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Appointment {
  id: string;
  company_id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  service_type: string;
  datetime: string;
  duration_minutes: number;
  status: string;
  notes: string | null;
}

async function getAccessToken(refreshToken: string): Promise<string | null> {
  const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID');
  const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.error('Missing Google OAuth credentials');
    return null;
  }

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      console.error('Token refresh failed:', await response.text());
      return null;
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}

function appointmentToGoogleEvent(appointment: Appointment, companyName: string) {
  const startDate = new Date(appointment.datetime);
  const endDate = new Date(startDate.getTime() + appointment.duration_minutes * 60 * 1000);

  const description = [
    `Service: ${appointment.service_type}`,
    appointment.customer_phone ? `Phone: ${appointment.customer_phone}` : '',
    appointment.customer_email ? `Email: ${appointment.customer_email}` : '',
    appointment.notes ? `Notes: ${appointment.notes}` : '',
    `Status: ${appointment.status}`,
  ].filter(Boolean).join('\n');

  return {
    summary: `${appointment.customer_name} - ${appointment.service_type}`,
    description,
    location: appointment.customer_address || undefined,
    start: {
      dateTime: startDate.toISOString(),
      timeZone: 'UTC',
    },
    end: {
      dateTime: endDate.toISOString(),
      timeZone: 'UTC',
    },
    extendedProperties: {
      private: {
        appointmentId: appointment.id,
        companyId: appointment.company_id,
        source: 'lovable-platform',
      },
    },
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, companyId, appointmentId, appointment } = await req.json();
    
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get company integrations
    const { data: integrations, error: intError } = await supabase
      .from('tenant_integrations')
      .select('google_refresh_token, google_calendar_id, google_calendar_enabled')
      .eq('company_id', companyId)
      .single();

    if (intError || !integrations?.google_refresh_token || !integrations?.google_calendar_enabled) {
      return new Response(
        JSON.stringify({ error: 'Google Calendar not connected', skipped: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const accessToken = await getAccessToken(integrations.google_refresh_token);
    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: 'Failed to get access token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const calendarId = integrations.google_calendar_id || 'primary';

    // Get company name
    const { data: company } = await supabase
      .from('companies')
      .select('name')
      .eq('id', companyId)
      .single();

    const companyName = company?.name || 'Company';

    if (action === 'sync_appointment') {
      // Sync a single appointment to Google Calendar
      const eventData = appointmentToGoogleEvent(appointment, companyName);

      // Check if mapping exists
      const { data: mapping } = await supabase
        .from('calendar_event_mappings')
        .select('google_event_id')
        .eq('appointment_id', appointmentId)
        .single();

      let response;
      if (mapping?.google_event_id) {
        // Update existing event
        response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${mapping.google_event_id}`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(eventData),
          }
        );
      } else {
        // Create new event
        response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(eventData),
          }
        );
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Google Calendar API error:', errorText);
        return new Response(
          JSON.stringify({ error: 'Failed to sync to Google Calendar' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const eventResult = await response.json();

      // Save or update mapping
      if (mapping?.google_event_id) {
        await supabase
          .from('calendar_event_mappings')
          .update({ last_synced_at: new Date().toISOString(), sync_status: 'synced' })
          .eq('appointment_id', appointmentId);
      } else {
        await supabase
          .from('calendar_event_mappings')
          .insert({
            company_id: companyId,
            appointment_id: appointmentId,
            google_event_id: eventResult.id,
            sync_status: 'synced',
          });
      }

      console.log(`Synced appointment ${appointmentId} to Google Calendar event ${eventResult.id}`);

      return new Response(
        JSON.stringify({ success: true, eventId: eventResult.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'delete_event') {
      // Delete event from Google Calendar
      const { data: mapping } = await supabase
        .from('calendar_event_mappings')
        .select('google_event_id')
        .eq('appointment_id', appointmentId)
        .single();

      if (mapping?.google_event_id) {
        await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${mapping.google_event_id}`,
          {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        await supabase
          .from('calendar_event_mappings')
          .delete()
          .eq('appointment_id', appointmentId);
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'sync_from_google') {
      // Pull changes from Google Calendar (two-way sync)
      const now = new Date();
      const timeMin = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(); // Last 30 days
      const timeMax = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(); // Next 90 days

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?` +
        `timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!response.ok) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch Google Calendar events' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const calendarData = await response.json();
      const events = calendarData.items || [];

      // Get existing mappings
      const { data: mappings } = await supabase
        .from('calendar_event_mappings')
        .select('appointment_id, google_event_id')
        .eq('company_id', companyId);

      const mappingsByEventId = new Map(mappings?.map(m => [m.google_event_id, m.appointment_id]) || []);
      
      const syncResults = {
        updated: 0,
        created: 0,
        errors: 0,
      };

      for (const event of events) {
        // Check if this is an event we created (has our metadata)
        const appointmentId = event.extendedProperties?.private?.appointmentId;
        
        if (appointmentId && mappingsByEventId.has(event.id)) {
          // Update our appointment if Google event was modified
          const startTime = event.start?.dateTime || event.start?.date;
          if (startTime) {
            const { error } = await supabase
              .from('appointments')
              .update({
                datetime: new Date(startTime).toISOString(),
                customer_address: event.location || null,
                notes: event.description || null,
              })
              .eq('id', appointmentId);

            if (!error) {
              syncResults.updated++;
            } else {
              syncResults.errors++;
            }
          }
        }
      }

      return new Response(
        JSON.stringify({ success: true, results: syncResults }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'full_sync') {
      // Sync all appointments to Google Calendar
      const { data: appointments, error: apptError } = await supabase
        .from('appointments')
        .select('*')
        .eq('company_id', companyId)
        .in('status', ['scheduled', 'confirmed'])
        .gte('datetime', new Date().toISOString());

      if (apptError) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch appointments' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let synced = 0;
      let errors = 0;

      for (const appt of appointments || []) {
        try {
          const eventData = appointmentToGoogleEvent(appt, companyName);

          // Check existing mapping
          const { data: mapping } = await supabase
            .from('calendar_event_mappings')
            .select('google_event_id')
            .eq('appointment_id', appt.id)
            .single();

          let response;
          if (mapping?.google_event_id) {
            response = await fetch(
              `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${mapping.google_event_id}`,
              {
                method: 'PUT',
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(eventData),
              }
            );
          } else {
            response = await fetch(
              `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
              {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(eventData),
              }
            );
          }

          if (response.ok) {
            const eventResult = await response.json();
            if (!mapping?.google_event_id) {
              await supabase
                .from('calendar_event_mappings')
                .insert({
                  company_id: companyId,
                  appointment_id: appt.id,
                  google_event_id: eventResult.id,
                  sync_status: 'synced',
                });
            }
            synced++;
          } else {
            errors++;
          }
        } catch (e) {
          console.error(`Error syncing appointment ${appt.id}:`, e);
          errors++;
        }
      }

      return new Response(
        JSON.stringify({ success: true, synced, errors, total: appointments?.length || 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'import_events') {
      // Import events from Google Calendar that don't exist in platform
      const now = new Date();
      const timeMin = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(); // Last 7 days
      const timeMax = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(); // Next 90 days

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?` +
        `timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&maxResults=100`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch Google Calendar events:', errorText);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch Google Calendar events' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const calendarData = await response.json();
      const events = calendarData.items || [];

      // Get existing mappings to skip already-linked events
      const { data: existingMappings } = await supabase
        .from('calendar_event_mappings')
        .select('google_event_id')
        .eq('company_id', companyId);

      const existingEventIds = new Set(existingMappings?.map(m => m.google_event_id) || []);

      const importResults = {
        imported: 0,
        skipped: 0,
        errors: 0,
      };

      for (const event of events) {
        // Skip if already linked to platform
        if (existingEventIds.has(event.id)) {
          importResults.skipped++;
          continue;
        }

        // Skip events created by this platform
        if (event.extendedProperties?.private?.source === 'lovable-platform') {
          importResults.skipped++;
          continue;
        }

        // Skip all-day events or events without proper datetime
        const startTime = event.start?.dateTime;
        const endTime = event.end?.dateTime;
        if (!startTime || !endTime) {
          importResults.skipped++;
          continue;
        }

        try {
          // Calculate duration
          const startDate = new Date(startTime);
          const endDate = new Date(endTime);
          const durationMinutes = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));

          // Extract customer name from event summary
          const customerName = event.summary || 'Imported Event';

          // Create appointment from Google Calendar event
          const { data: newAppointment, error: insertError } = await supabase
            .from('appointments')
            .insert({
              company_id: companyId,
              customer_name: customerName,
              customer_email: null,
              customer_phone: null,
              customer_address: event.location || null,
              service_type: 'Imported from Google Calendar',
              datetime: startDate.toISOString(),
              duration_minutes: durationMinutes || 60,
              status: 'scheduled',
              notes: event.description || `Imported from Google Calendar: ${event.summary}`,
            })
            .select()
            .single();

          if (insertError) {
            console.error('Error creating appointment:', insertError);
            importResults.errors++;
            continue;
          }

          // Create mapping to link Google event with new appointment
          await supabase
            .from('calendar_event_mappings')
            .insert({
              company_id: companyId,
              appointment_id: newAppointment.id,
              google_event_id: event.id,
              sync_status: 'synced',
            });

          importResults.imported++;
        } catch (e) {
          console.error(`Error importing event ${event.id}:`, e);
          importResults.errors++;
        }
      }

      console.log(`Import complete: ${importResults.imported} imported, ${importResults.skipped} skipped, ${importResults.errors} errors`);

      return new Response(
        JSON.stringify({ success: true, results: importResults }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Google Calendar Sync error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
