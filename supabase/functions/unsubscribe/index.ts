import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UnsubscribeRequest {
  token: string;
  channel: 'sms' | 'email' | 'call' | 'all';
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

    console.log(`Processing unsubscribe request for token ${token}, channel: ${channel}`);

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

    const companyName = (appointment.companies as any)?.name || 'Our Business';
    const channelName = channel === 'all' ? 'all reminder' : channel.toUpperCase();
    
    console.log(`Successfully unsubscribed ${appointment.customer_name} from ${channel} reminders`);

    // Return success HTML page for GET requests, JSON for POST
    if (req.method === 'GET') {
      return new Response(
        generateHtmlResponse(
          'Unsubscribed Successfully',
          `You have been unsubscribed from ${channelName} reminders for your appointment with ${companyName}.`,
          true,
          token
        ),
        { headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
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
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    return new Response(
      generateHtmlResponse('Error', errorMessage, false),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
    );
  }
});

function generateHtmlResponse(title: string, message: string, success: boolean, token?: string): string {
  const portalLink = token ? `https://zwlcwtgjvesbevheknbk.lovable.app/appointment?token=${token}` : '';
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
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
        <h1>${title}</h1>
        <p>${message}</p>
        ${portalLink ? `<a href="${portalLink}" class="btn">Manage Preferences</a>` : ''}
      </body>
    </html>
  `;
}
