import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getAccessToken(refreshToken: string, clientId: string, clientSecret: string): Promise<string | null> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    console.error('Failed to refresh token:', await response.text());
    return null;
  }

  const data = await response.json();
  return data.access_token;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, code, companyId, redirectUri, calendarId, calendarColor, calendarName, visibility, shareEmail, shareRole, removeRuleId } = body;
    
    const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID');
    const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return new Response(
        JSON.stringify({ error: 'Google OAuth credentials not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (action === 'get_auth_url') {
      // Generate OAuth URL for Google Calendar
      const scopes = [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/calendar.readonly'
      ].join(' ');

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${GOOGLE_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent(scopes)}&` +
        `access_type=offline&` +
        `prompt=consent&` +
        `state=${companyId}`;

      return new Response(
        JSON.stringify({ authUrl }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'exchange_code') {
      // Exchange authorization code for tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Token exchange failed:', errorText);
        return new Response(
          JSON.stringify({ error: 'Failed to exchange code for tokens' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const tokens = await tokenResponse.json();
      console.log('Tokens received, has refresh_token:', !!tokens.refresh_token);

      // Get the primary calendar ID
      const calendarResponse = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary',
        {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        }
      );

      let primaryCalendarId = 'primary';
      if (calendarResponse.ok) {
        const calendarData = await calendarResponse.json();
        primaryCalendarId = calendarData.id || 'primary';
      }

      // Save tokens to tenant_integrations
      const { error: updateError } = await supabase
        .from('tenant_integrations')
        .update({
          google_refresh_token: tokens.refresh_token || null,
          google_calendar_id: primaryCalendarId,
          google_calendar_enabled: true,
        })
        .eq('company_id', companyId);

      if (updateError) {
        // If no row exists, insert one
        const { error: insertError } = await supabase
          .from('tenant_integrations')
          .insert({
            company_id: companyId,
            google_refresh_token: tokens.refresh_token || null,
            google_calendar_id: primaryCalendarId,
            google_calendar_enabled: true,
          });

        if (insertError) {
          console.error('Failed to save tokens:', insertError);
          return new Response(
            JSON.stringify({ error: 'Failed to save credentials' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      return new Response(
        JSON.stringify({ success: true, calendarId: primaryCalendarId }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'list_calendars') {
      // Fetch list of available calendars
      const { data: integration, error: fetchError } = await supabase
        .from('tenant_integrations')
        .select('google_refresh_token')
        .eq('company_id', companyId)
        .single();

      if (fetchError || !integration?.google_refresh_token) {
        return new Response(
          JSON.stringify({ error: 'Not connected to Google Calendar' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const accessToken = await getAccessToken(
        integration.google_refresh_token,
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET
      );

      if (!accessToken) {
        return new Response(
          JSON.stringify({ error: 'Failed to refresh access token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const calendarListResponse = await fetch(
        'https://www.googleapis.com/calendar/v3/users/me/calendarList',
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!calendarListResponse.ok) {
        const errorText = await calendarListResponse.text();
        console.error('Failed to fetch calendars:', errorText);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch calendars' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const calendarListData = await calendarListResponse.json();
      
      // Filter to only calendars user can write to
      const calendars = (calendarListData.items || [])
        .filter((cal: any) => cal.accessRole === 'owner' || cal.accessRole === 'writer')
        .map((cal: any) => ({
          id: cal.id,
          summary: cal.summary,
          primary: cal.primary || false,
          backgroundColor: cal.backgroundColor,
        }));

      return new Response(
        JSON.stringify({ calendars }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'select_calendar') {
      // Update selected calendar
      if (!calendarId) {
        return new Response(
          JSON.stringify({ error: 'Calendar ID required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error } = await supabase
        .from('tenant_integrations')
        .update({ google_calendar_id: calendarId })
        .eq('company_id', companyId);

      if (error) {
        console.error('Failed to update calendar:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to update calendar selection' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'create_calendar') {
      // Create a new dedicated calendar for appointments
      const { data: integration, error: fetchError } = await supabase
        .from('tenant_integrations')
        .select('google_refresh_token')
        .eq('company_id', companyId)
        .single();

      if (fetchError || !integration?.google_refresh_token) {
        return new Response(
          JSON.stringify({ error: 'Not connected to Google Calendar' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const accessToken = await getAccessToken(
        integration.google_refresh_token,
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET
      );

      if (!accessToken) {
        return new Response(
          JSON.stringify({ error: 'Failed to refresh access token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get company name for calendar title
      const { data: company } = await supabase
        .from('companies')
        .select('name')
        .eq('id', companyId)
        .single();

      const calendarName = company?.name 
        ? `${company.name} - Appointments` 
        : 'Business Appointments';

      // Create the calendar
      const createResponse = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            summary: calendarName,
            description: 'Appointments managed by the booking platform',
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York',
          }),
        }
      );

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        console.error('Failed to create calendar:', errorText);
        return new Response(
          JSON.stringify({ error: 'Failed to create calendar' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const newCalendar = await createResponse.json();
      console.log('Created new calendar:', newCalendar.id);

      // Set calendar color if provided
      if (calendarColor) {
        const colorResponse = await fetch(
          `https://www.googleapis.com/calendar/v3/users/me/calendarList/${encodeURIComponent(newCalendar.id)}`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              backgroundColor: calendarColor,
              foregroundColor: '#ffffff',
            }),
          }
        );
        if (!colorResponse.ok) {
          console.warn('Failed to set calendar color:', await colorResponse.text());
        }
      }

      // Update the selected calendar to the new one
      const { error: updateError } = await supabase
        .from('tenant_integrations')
        .update({ google_calendar_id: newCalendar.id })
        .eq('company_id', companyId);

      if (updateError) {
        console.error('Failed to update calendar selection:', updateError);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          calendar: {
            id: newCalendar.id,
            summary: newCalendar.summary,
            backgroundColor: calendarColor,
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'change_color') {
      // Change color of an existing calendar
      if (!calendarId || !calendarColor) {
        return new Response(
          JSON.stringify({ error: 'Calendar ID and color required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: integration, error: fetchError } = await supabase
        .from('tenant_integrations')
        .select('google_refresh_token')
        .eq('company_id', companyId)
        .single();

      if (fetchError || !integration?.google_refresh_token) {
        return new Response(
          JSON.stringify({ error: 'Not connected to Google Calendar' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const accessToken = await getAccessToken(
        integration.google_refresh_token,
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET
      );

      if (!accessToken) {
        return new Response(
          JSON.stringify({ error: 'Failed to refresh access token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const colorResponse = await fetch(
        `https://www.googleapis.com/calendar/v3/users/me/calendarList/${encodeURIComponent(calendarId)}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            backgroundColor: calendarColor,
            foregroundColor: '#ffffff',
          }),
        }
      );

      if (!colorResponse.ok) {
        const errorText = await colorResponse.text();
        console.error('Failed to change calendar color:', errorText);
        return new Response(
          JSON.stringify({ error: 'Failed to change calendar color' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, color: calendarColor }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'rename_calendar') {
      // Rename an existing calendar
      if (!calendarId || !calendarName) {
        return new Response(
          JSON.stringify({ error: 'Calendar ID and name required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: integration, error: fetchError } = await supabase
        .from('tenant_integrations')
        .select('google_refresh_token')
        .eq('company_id', companyId)
        .single();

      if (fetchError || !integration?.google_refresh_token) {
        return new Response(
          JSON.stringify({ error: 'Not connected to Google Calendar' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const accessToken = await getAccessToken(
        integration.google_refresh_token,
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET
      );

      if (!accessToken) {
        return new Response(
          JSON.stringify({ error: 'Failed to refresh access token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const renameResponse = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            summary: calendarName,
          }),
        }
      );

      if (!renameResponse.ok) {
        const errorText = await renameResponse.text();
        console.error('Failed to rename calendar:', errorText);
        return new Response(
          JSON.stringify({ error: 'Failed to rename calendar' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, name: calendarName }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'delete_calendar') {
      // Delete a user-created calendar
      if (!calendarId) {
        return new Response(
          JSON.stringify({ error: 'Calendar ID required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: integration, error: fetchError } = await supabase
        .from('tenant_integrations')
        .select('google_refresh_token, google_calendar_id')
        .eq('company_id', companyId)
        .single();

      if (fetchError || !integration?.google_refresh_token) {
        return new Response(
          JSON.stringify({ error: 'Not connected to Google Calendar' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const accessToken = await getAccessToken(
        integration.google_refresh_token,
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET
      );

      if (!accessToken) {
        return new Response(
          JSON.stringify({ error: 'Failed to refresh access token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Cannot delete primary calendar
      if (calendarId === 'primary' || calendarId.includes('@gmail.com') || calendarId.includes('@googlemail.com')) {
        return new Response(
          JSON.stringify({ error: 'Cannot delete primary calendar' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const deleteResponse = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!deleteResponse.ok) {
        const errorText = await deleteResponse.text();
        console.error('Failed to delete calendar:', errorText);
        return new Response(
          JSON.stringify({ error: 'Failed to delete calendar. You can only delete calendars you created.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // If the deleted calendar was the selected one, reset to primary
      if (integration.google_calendar_id === calendarId) {
        await supabase
          .from('tenant_integrations')
          .update({ google_calendar_id: 'primary' })
          .eq('company_id', companyId);
      }

      // Delete any event mappings for this calendar
      await supabase
        .from('calendar_event_mappings')
        .delete()
        .eq('company_id', companyId);

      console.log('Deleted calendar:', calendarId);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'disconnect') {
      // Disconnect Google Calendar
      const { error } = await supabase
        .from('tenant_integrations')
        .update({
          google_refresh_token: null,
          google_calendar_id: null,
          google_calendar_enabled: false,
        })
        .eq('company_id', companyId);

      if (error) {
        return new Response(
          JSON.stringify({ error: 'Failed to disconnect' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Delete all calendar mappings for this company
      await supabase
        .from('calendar_event_mappings')
        .delete()
        .eq('company_id', companyId);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'get_sharing') {
      // Get sharing settings for a calendar
      if (!calendarId) {
        return new Response(
          JSON.stringify({ error: 'Calendar ID required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: integration, error: fetchError } = await supabase
        .from('tenant_integrations')
        .select('google_refresh_token')
        .eq('company_id', companyId)
        .single();

      if (fetchError || !integration?.google_refresh_token) {
        return new Response(
          JSON.stringify({ error: 'Not connected to Google Calendar' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const accessToken = await getAccessToken(
        integration.google_refresh_token,
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET
      );

      if (!accessToken) {
        return new Response(
          JSON.stringify({ error: 'Failed to refresh access token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get ACL list for the calendar
      const aclResponse = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/acl`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!aclResponse.ok) {
        const errorText = await aclResponse.text();
        console.error('Failed to fetch ACL:', errorText);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch sharing settings' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const aclData = await aclResponse.json();
      const rules = (aclData.items || []).map((rule: any) => ({
        id: rule.id,
        role: rule.role,
        scope: {
          type: rule.scope?.type,
          value: rule.scope?.value,
        },
      }));

      // Check if calendar is public
      const isPublic = rules.some((r: any) => r.scope.type === 'default' && r.role !== 'none');
      const publicRole = rules.find((r: any) => r.scope.type === 'default')?.role || 'none';

      // Get shared users (excluding owner and default)
      const sharedUsers = rules
        .filter((r: any) => r.scope.type === 'user' && r.role !== 'owner')
        .map((r: any) => ({
          email: r.scope.value,
          role: r.role,
          id: r.id,
        }));

      return new Response(
        JSON.stringify({ 
          isPublic,
          publicRole,
          sharedUsers,
          rules,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'update_sharing') {
      // Update sharing settings for a calendar
      const { visibility, shareEmail, shareRole, removeRuleId } = await req.json().catch(() => ({}));
      
      if (!calendarId) {
        return new Response(
          JSON.stringify({ error: 'Calendar ID required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: integration, error: fetchError } = await supabase
        .from('tenant_integrations')
        .select('google_refresh_token')
        .eq('company_id', companyId)
        .single();

      if (fetchError || !integration?.google_refresh_token) {
        return new Response(
          JSON.stringify({ error: 'Not connected to Google Calendar' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const accessToken = await getAccessToken(
        integration.google_refresh_token,
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET
      );

      if (!accessToken) {
        return new Response(
          JSON.stringify({ error: 'Failed to refresh access token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Remove a specific ACL rule
      if (removeRuleId) {
        const deleteResponse = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/acl/${encodeURIComponent(removeRuleId)}`,
          {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        if (!deleteResponse.ok) {
          const errorText = await deleteResponse.text();
          console.error('Failed to remove sharing:', errorText);
          return new Response(
            JSON.stringify({ error: 'Failed to remove sharing' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Share with a specific email
      if (shareEmail && shareRole) {
        const aclResponse = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/acl`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              role: shareRole,
              scope: {
                type: 'user',
                value: shareEmail,
              },
            }),
          }
        );

        if (!aclResponse.ok) {
          const errorText = await aclResponse.text();
          console.error('Failed to share calendar:', errorText);
          return new Response(
            JSON.stringify({ error: 'Failed to share calendar with user' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update public visibility
      if (visibility !== undefined) {
        // First, try to get existing default ACL rule
        const aclListResponse = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/acl`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        let existingDefaultRule = null;
        if (aclListResponse.ok) {
          const aclData = await aclListResponse.json();
          existingDefaultRule = (aclData.items || []).find((r: any) => r.scope?.type === 'default');
        }

        if (visibility === 'private') {
          // Remove default rule if it exists
          if (existingDefaultRule) {
            await fetch(
              `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/acl/${encodeURIComponent(existingDefaultRule.id)}`,
              {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${accessToken}` },
              }
            );
          }
        } else {
          // Set public visibility (reader or freeBusyReader)
          const role = visibility === 'public' ? 'reader' : 'freeBusyReader';
          
          if (existingDefaultRule) {
            // Update existing rule
            await fetch(
              `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/acl/${encodeURIComponent(existingDefaultRule.id)}`,
              {
                method: 'PUT',
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  role,
                  scope: { type: 'default' },
                }),
              }
            );
          } else {
            // Create new rule
            await fetch(
              `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/acl`,
              {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  role,
                  scope: { type: 'default' },
                }),
              }
            );
          }
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'No valid sharing operation specified' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Google Calendar Auth error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
