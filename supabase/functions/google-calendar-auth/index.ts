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

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    console.log('Google Calendar Auth - Action:', action);

    // Handle OAuth callback from Google
    if (action === 'callback') {
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state'); // Contains companyId and userId
      const error = url.searchParams.get('error');

      // HTML template for success/error pages
      const createCallbackHtml = (success: boolean, errorMessage?: string) => {
        const title = success ? 'Connection Successful!' : 'Connection Failed';
        const message = success 
          ? 'Your Google Calendar has been connected. You can close this window.'
          : `Error: ${errorMessage || 'Unknown error'}`;
        const iconColor = success ? '#22c55e' : '#ef4444';
        const icon = success 
          ? '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'
          : '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
        
        return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: #0f172a;
      color: #e2e8f0;
    }
    .container {
      text-align: center;
      padding: 2rem;
      max-width: 400px;
    }
    .icon {
      color: ${iconColor};
      margin-bottom: 1rem;
    }
    h1 {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
    }
    p {
      color: #94a3b8;
      margin-bottom: 1.5rem;
    }
    .btn {
      display: inline-block;
      padding: 0.75rem 1.5rem;
      background: #3b82f6;
      color: white;
      text-decoration: none;
      border-radius: 0.5rem;
      font-weight: 500;
    }
    .btn:hover {
      background: #2563eb;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">${icon}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="#" class="btn" id="closeBtn">Return to App</a>
  </div>
  <script>
    // Try to notify the opener window
    if (window.opener) {
      try {
        window.opener.postMessage({type: 'google-calendar-${success ? 'success' : 'error'}'${!success && errorMessage ? `, error: '${errorMessage.replace(/'/g, "\\'")}'` : ''}}, '*');
      } catch (e) {
        console.log('Could not post message to opener');
      }
    }
    
    // Set localStorage flag for redirect-based detection
    try {
      localStorage.setItem('gcal-oauth-complete', '${success ? 'success' : 'error'}');
    } catch (e) {
      console.log('Could not set localStorage');
    }
    
    // Handle button click
    document.getElementById('closeBtn').addEventListener('click', function(e) {
      e.preventDefault();
      
      // Try to close the window first (works if opened as popup)
      if (window.opener) {
        window.close();
        return;
      }
      
      // Otherwise redirect back to the app
      var returnUrl = '/dashboard/integrations/calendar';
      try {
        var storedUrl = localStorage.getItem('gcal-return-url');
        if (storedUrl) {
          returnUrl = storedUrl;
          localStorage.removeItem('gcal-return-url');
        }
      } catch (e) {}
      
      window.location.href = returnUrl;
    });
    
    // Auto-close popup after short delay if opener exists
    if (window.opener) {
      setTimeout(function() {
        window.close();
      }, 2000);
    }
  </script>
</body>
</html>`;
      };

      if (error) {
        console.error('OAuth error from Google:', error);
        return new Response(
          createCallbackHtml(false, error),
          { headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
        );
      }

      if (!code || !state) {
        return new Response(
          createCallbackHtml(false, 'Missing code or state parameter'),
          { headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
        );
      }

      // Validate the state nonce by looking it up server-side. The value received on
      // the callback MUST match a still-valid, unconsumed record we issued during the
      // `authorize` step. Prevents an attacker from forging a state parameter that
      // links their Google account to a victim company.
      const nonceClient = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
      const { data: nonceRow } = await nonceClient
        .from('oauth_state_nonces')
        .select('id, provider, company_id, user_id, consumed_at, expires_at')
        .eq('nonce', state)
        .eq('provider', 'google_calendar')
        .maybeSingle();

      if (!nonceRow || nonceRow.consumed_at || new Date(nonceRow.expires_at) < new Date()) {
        return new Response(
          createCallbackHtml(false, 'Invalid or expired state parameter'),
          { headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
        );
      }
      await nonceClient.from('oauth_state_nonces').update({ consumed_at: new Date().toISOString() }).eq('id', nonceRow.id);
      const companyId = nonceRow.company_id;
      const userId = nonceRow.user_id;

      // Exchange code for tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID!,
          client_secret: GOOGLE_CLIENT_SECRET!,
          redirect_uri: `${SUPABASE_URL}/functions/v1/google-calendar-auth?action=callback`,
          grant_type: 'authorization_code',
        }),
      });

      const tokenData = await tokenResponse.json();

      if (tokenData.error) {
        console.error('Token exchange error:', tokenData);
        return new Response(
          createCallbackHtml(false, tokenData.error_description || tokenData.error),
          { headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
        );
      }

      console.log('Token exchange successful');

      // Store tokens in database
      const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

      const { error: upsertError } = await supabase
        .from('google_calendar_connections')
        .upsert({
          company_id: companyId,
          user_id: userId,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
          sync_enabled: true,
          last_sync_at: null,
          last_error: null,
        }, { onConflict: 'company_id' });

      if (upsertError) {
        console.error('Database error:', upsertError);
        return new Response(
          createCallbackHtml(false, 'Failed to save connection'),
          { headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
        );
      }

      // Set up webhook for push notifications
      await setupGoogleWebhook(supabase, companyId, tokenData.access_token);

      console.log('Google Calendar connection saved successfully');

      return new Response(
        createCallbackHtml(true),
        { headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
      );
    }

    // Handle authorization URL generation
    if (action === 'authorize') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Authorization required' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);

      if (userError || !user) {
        return new Response(
          JSON.stringify({ error: 'Invalid token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get user's company
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) {
        return new Response(
          JSON.stringify({ error: 'User not associated with a company' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Persist a single-use state nonce server-side and only pass the opaque id to Google.
      const state = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
      const { error: nonceErr } = await supabase.from('oauth_state_nonces').insert({
        nonce: state,
        provider: 'google_calendar',
        company_id: profile.company_id,
        user_id: user.id,
      });
      if (nonceErr) {
        console.error('Failed to persist OAuth state nonce:', nonceErr);
        return new Response(
          JSON.stringify({ error: 'Failed to start OAuth' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID!);
      authUrl.searchParams.set('redirect_uri', `${SUPABASE_URL}/functions/v1/google-calendar-auth?action=callback`);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events');
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('prompt', 'consent');
      authUrl.searchParams.set('state', state);

      return new Response(
        JSON.stringify({ authUrl: authUrl.toString() }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle disconnect
    if (action === 'disconnect') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Authorization required' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);

      if (userError || !user) {
        return new Response(
          JSON.stringify({ error: 'Invalid token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) {
        return new Response(
          JSON.stringify({ error: 'User not associated with a company' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get connection to revoke token
      const { data: connection } = await supabase
        .from('google_calendar_connections')
        .select('access_token, webhook_channel_id, webhook_resource_id')
        .eq('company_id', profile.company_id)
        .single();

      if (connection?.access_token) {
        // Revoke the access token
        await fetch(`https://oauth2.googleapis.com/revoke?token=${connection.access_token}`, {
          method: 'POST',
        });

        // Stop webhook if exists
        if (connection.webhook_channel_id && connection.webhook_resource_id) {
          await stopGoogleWebhook(connection.access_token, connection.webhook_channel_id, connection.webhook_resource_id);
        }
      }

      // Delete the connection
      await supabase
        .from('google_calendar_connections')
        .delete()
        .eq('company_id', profile.company_id);

      console.log('Google Calendar disconnected successfully');

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle connection status check
    if (action === 'status') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Authorization required' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);

      if (userError || !user) {
        return new Response(
          JSON.stringify({ error: 'Invalid token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) {
        return new Response(
          JSON.stringify({ connected: false }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: connection } = await supabase
        .from('google_calendar_connections')
        .select('sync_enabled, last_sync_at, last_error, created_at')
        .eq('company_id', profile.company_id)
        .single();

      return new Response(
        JSON.stringify({
          connected: !!connection,
          syncEnabled: connection?.sync_enabled ?? false,
          lastSyncAt: connection?.last_sync_at,
          lastError: connection?.last_error,
          connectedAt: connection?.created_at,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Google Calendar Auth error:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function setupGoogleWebhook(supabase: any, companyId: string, accessToken: string) {
  try {
    const channelId = crypto.randomUUID();
    const webhookUrl = `${SUPABASE_URL}/functions/v1/google-calendar-webhook`;

    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events/watch', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: channelId,
        type: 'web_hook',
        address: webhookUrl,
        params: {
          ttl: '604800', // 7 days
        },
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error('Webhook setup error:', data.error);
      return;
    }

    await supabase
      .from('google_calendar_connections')
      .update({
        webhook_channel_id: data.id,
        webhook_resource_id: data.resourceId,
        webhook_expiration: new Date(parseInt(data.expiration)).toISOString(),
      })
      .eq('company_id', companyId);

    console.log('Google Calendar webhook set up successfully');
  } catch (error) {
    console.error('Failed to set up webhook:', error);
  }
}

async function stopGoogleWebhook(accessToken: string, channelId: string, resourceId: string) {
  try {
    await fetch('https://www.googleapis.com/calendar/v3/channels/stop', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: channelId,
        resourceId: resourceId,
      }),
    });
    console.log('Google Calendar webhook stopped');
  } catch (error) {
    console.error('Failed to stop webhook:', error);
  }
}