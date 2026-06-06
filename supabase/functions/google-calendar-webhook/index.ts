import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-goog-channel-id, x-goog-channel-token, x-goog-resource-id, x-goog-resource-state, x-goog-message-number',
};

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID');
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

  try {
    // Google sends notifications via headers
    const channelId = req.headers.get('x-goog-channel-id');
    const resourceState = req.headers.get('x-goog-resource-state');
    const resourceId = req.headers.get('x-goog-resource-id');

    console.log('Google Calendar Webhook received:', {
      channelId,
      resourceState,
      resourceId,
    });

    // Verify this is a valid webhook (check if we have a connection with this channel)
    if (!channelId) {
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    // Find the connection with this webhook channel
    const { data: connection, error: connError } = await supabase
      .from('google_calendar_connections')
      .select('*')
      .eq('webhook_channel_id', channelId)
      .single();

    if (connError || !connection) {
      console.log('No matching connection found for channel:', channelId);
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    // Handle sync notification - this means calendar was modified
    if (resourceState === 'sync') {
      console.log('Initial sync notification - ignoring');
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    if (resourceState === 'exists') {
      // Something changed in the calendar - fetch recent changes
      await processCalendarChanges(supabase, connection);
    }

    return new Response('OK', { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('Google Calendar Webhook error:', error);
    // Always return 200 to prevent Google from retrying
    return new Response('OK', { status: 200, headers: corsHeaders });
  }
});

async function processCalendarChanges(supabase: any, connection: any) {
  try {
    // Refresh token if needed
    let accessToken = connection.access_token;
    if (new Date(connection.token_expires_at) <= new Date()) {
      accessToken = await refreshAccessToken(supabase, connection);
      if (!accessToken) {
        console.error('Failed to refresh token for webhook processing');
        return;
      }
    }

    // Get recently updated events (last 5 minutes to catch changes)
    const updatedMin = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?updatedMin=${encodeURIComponent(updatedMin)}&showDeleted=true&singleEvents=true`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    const data = await response.json();

    if (data.error) {
      console.error('Failed to fetch calendar events:', data.error);
      return;
    }

    const events = data.items || [];
    console.log(`Processing ${events.length} changed events`);

    for (const event of events) {
      await processEventChange(supabase, connection.company_id, event);
    }

    // Update last sync time
    await supabase
      .from('google_calendar_connections')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('company_id', connection.company_id);

  } catch (error) {
    console.error('Error processing calendar changes:', error);
  }
}

async function processEventChange(supabase: any, companyId: string, event: any) {
  try {
    const googleEventId = event.id;

    // Check if this event is linked to one of our appointments
    const { data: mapping } = await supabase
      .from('calendar_event_mappings')
      .select('appointment_id')
      .eq('google_event_id', googleEventId)
      .eq('company_id', companyId)
      .single();

    if (!mapping) {
      // Check if this event was created in Google and has our extended properties
      const extProps = event.extendedProperties?.private;
      if (extProps?.source === 'platform') {
        // This is our event, skip to avoid loops
        return;
      }

      // This is a new event created directly in Google Calendar
      // Check if we should import it (only if it looks like an appointment)
      if (event.status !== 'cancelled' && event.start?.dateTime) {
        console.log('New event from Google Calendar detected:', event.summary);
        // Optionally create an appointment from this event
        // For now, we'll skip importing to avoid duplicate data
        // This could be enabled as a user preference
      }
      return;
    }

    // Event is linked to our appointment
    const appointmentId = mapping.appointment_id;

    if (event.status === 'cancelled') {
      // Event was deleted in Google - update appointment status
      console.log('Event cancelled in Google, updating appointment:', appointmentId);
      
      await supabase
        .from('appointments')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', appointmentId);

      // Update mapping status
      await supabase
        .from('calendar_event_mappings')
        .update({ 
          sync_status: 'synced',
          sync_source: 'google',
          last_synced_at: new Date().toISOString(),
        })
        .eq('appointment_id', appointmentId);

      return;
    }

    // Event was updated in Google - sync changes back
    if (event.start?.dateTime) {
      const newDateTime = new Date(event.start.dateTime);
      const newEndTime = event.end?.dateTime ? new Date(event.end.dateTime) : null;
      const durationMinutes = newEndTime 
        ? Math.round((newEndTime.getTime() - newDateTime.getTime()) / 60000)
        : 60;

      console.log('Event updated in Google, syncing to appointment:', appointmentId);

      await supabase
        .from('appointments')
        .update({
          datetime: newDateTime.toISOString(),
          duration_minutes: durationMinutes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', appointmentId);

      await supabase
        .from('calendar_event_mappings')
        .update({
          sync_status: 'synced',
          sync_source: 'google',
          last_synced_at: new Date().toISOString(),
        })
        .eq('appointment_id', appointmentId);
    }

  } catch (error) {
    console.error('Error processing event change:', error);
  }
}

async function refreshAccessToken(supabase: any, connection: any): Promise<string | null> {
  try {
    if (!connection.refresh_token) {
      console.error('Cannot refresh token: connection has no refresh_token');
      await handleInvalidGrant(supabase, connection, 'missing_refresh_token');
      return null;
    }

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
      if (data.error === 'invalid_grant') {
        await handleInvalidGrant(supabase, connection, data.error_description || 'invalid_grant');
      }
      return null;
    }

    await supabase
      .from('google_calendar_connections')
      .update({
        access_token: data.access_token,
        token_expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
      })
      .eq('company_id', connection.company_id);

    return data.access_token;
  } catch (error) {
    console.error('Token refresh exception:', error);
    return null;
  }
}

// When Google rejects the refresh token, disable sync, log a platform issue,
// and notify staff so the admin can reconnect.
async function handleInvalidGrant(supabase: any, connection: any, reason: string) {
  try {
    await supabase
      .from('google_calendar_connections')
      .update({
        sync_enabled: false,
        last_error: `invalid_grant: ${reason}`,
        updated_at: new Date().toISOString(),
      })
      .eq('company_id', connection.company_id);

    await supabase.from('platform_issues').insert({
      issue_type: 'api_error',
      severity: 'high',
      status: 'new',
      title: 'Google Calendar disconnected — reconnect required',
      description: `Google rejected the refresh token (${reason}). Calendar sync has been disabled for company ${connection.company_id}. The admin must reconnect Google Calendar.`,
      company_id: connection.company_id,
      metadata: { source: 'google-calendar-webhook', reason },
    } as any);

    await supabase.from('staff_notifications').insert({
      company_id: connection.company_id,
      recipient_role: 'company_admin',
      notification_type: 'integration_error',
      message: 'Google Calendar needs to be reconnected. Open Integrations → Google Calendar to restore sync.',
      metadata: { integration: 'google_calendar', reason },
    } as any);
  } catch (e) {
    console.error('handleInvalidGrant failed:', e);
  }
}