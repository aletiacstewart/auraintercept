import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UnsubscribeRequest {
  token: string;
  channel: 'sms' | 'email' | 'call' | 'all';
}

// HTML escape function to prevent XSS attacks
function escapeHtml(str: string): string {
  if (!str) return '';
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return str.replace(/[&<>"']/g, (char) => htmlEntities[char] || char);
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Support both GET (from email links) and POST requests
    let token: string;
    let channel: string;

    if (req.method === 'GET') {
      const url = new URL(req.url);
      token = url.searchParams.get('token') || '';
      channel = url.searchParams.get('channel') || 'all';
    } else {
      const body: UnsubscribeRequest = await req.json();
      token = body.token;
      channel = body.channel;
    }

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate token format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(token)) {
      return new Response(
        generateHtmlResponse('Error', 'Invalid request. Please contact us for assistance.', false),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
      );
    }

    console.log(`Processing unsubscribe request for token, channel: ${channel}`);

    // Find appointment by customer token
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('id, customer_name, company_id, sms_opt_out, email_opt_out, call_opt_out, companies:company_id(name)')
      .eq('customer_token', token)
      .single();

    if (fetchError || !appointment) {
      console.error('Appointment fetch error:', fetchError);
      return new Response(
        generateHtmlResponse('Error', 'Invalid or expired link. Please contact us for assistance.', false),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
      );
    }

    // Build update object based on channel
    const updates: Record<string, boolean> = {};
    
    switch (channel) {
      case 'sms':
        updates.sms_opt_out = true;
        break;
      case 'email':
        updates.email_opt_out = true;
        break;
      case 'call':
        updates.call_opt_out = true;
        break;
      case 'all':
        updates.sms_opt_out = true;
        updates.email_opt_out = true;
        updates.call_opt_out = true;
        break;
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid channel. Use: sms, email, call, or all' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    // Update appointment preferences
    const { error: updateError } = await supabase
      .from('appointments')
      .update(updates)
      .eq('id', appointment.id);

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(
        generateHtmlResponse('Error', 'Failed to update your preferences. Please try again.', false),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
      );
    }

    // Log subscription events for analytics
    const channelsToLog = channel === 'all' ? ['sms', 'email', 'call'] : [channel];
    const eventsToInsert = channelsToLog.map(ch => ({
      company_id: appointment.company_id,
      appointment_id: appointment.id,
      channel: ch,
      action: 'unsubscribe',
      source: 'email_link',
      customer_email: (appointment.companies as any)?.customer_email || null,
      customer_phone: null
    }));

    const { error: eventError } = await supabase
      .from('subscription_events')
      .insert(eventsToInsert);

    if (eventError) {
      console.error('Failed to log subscription events:', eventError);
    } else {
      console.log(`Logged ${eventsToInsert.length} unsubscribe events from email link`);
    }

    // Escape company name to prevent XSS - only use safe, escaped values in HTML
    const rawCompanyName = (appointment.companies as any)?.name || 'Our Business';
    const safeCompanyName = escapeHtml(rawCompanyName);
    const channelName = channel === 'all' ? 'all reminder' : channel.toUpperCase();
    
    console.log(`Successfully unsubscribed customer from ${channel} reminders`);

    // Return success HTML page for GET requests, JSON for POST
    if (req.method === 'GET') {
      return new Response(
        generateHtmlResponse(
          'Unsubscribed Successfully',
          `You have been unsubscribed from ${escapeHtml(channelName)} reminders for your appointment with ${safeCompanyName}.`,
          true,
          token
        ),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'text/html',
            'Content-Security-Policy': "default-src 'self'; style-src 'unsafe-inline'; script-src 'none'"
          } 
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Unsubscribed from ${channel} reminders`,
        updated: updates 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Unsubscribe error:', error);
    return new Response(
      generateHtmlResponse('Error', 'An error occurred. Please try again later.', false),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
    );
  }
});

function generateHtmlResponse(title: string, message: string, success: boolean, token?: string): string {
  // All dynamic content is already escaped before being passed to this function
  // Title is static, message contains pre-escaped content
  const safeTitle = escapeHtml(title);
  const portalLink = token ? `https://auraintercept.ai/appointment?token=${encodeURIComponent(token)}` : '';
  
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${safeTitle}</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 500px;
        margin: 50px auto;
        padding: 20px;
        text-align: center;
      }
      .icon {
        font-size: 48px;
        margin-bottom: 20px;
      }
      .success { color: #10b981; }
      .error { color: #ef4444; }
      h1 {
        margin-bottom: 16px;
        font-size: 24px;
      }
      p {
        color: #6b7280;
        margin-bottom: 24px;
      }
      .btn {
        display: inline-block;
        background: #0ea5e9;
        color: white;
        padding: 12px 24px;
        border-radius: 6px;
        text-decoration: none;
        font-weight: 500;
      }
      .btn:hover {
        background: #0284c7;
      }
    </style>
  </head>
  <body>
    <div class="icon ${success ? 'success' : 'error'}">${success ? '✓' : '✕'}</div>
    <h1>${safeTitle}</h1>
    <p>${message}</p>
    ${portalLink ? `<a href="${portalLink}" class="btn">Manage Preferences</a>` : ''}
  </body>
</html>`;
}
