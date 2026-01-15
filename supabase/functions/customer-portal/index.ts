import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PortalRequest {
  action: 'get' | 'cancel' | 'reschedule' | 'update-preferences' | 'get-dashboard' | 'get-appointments' | 'get-invoices' | 'get-profile';
  token: string;
  newDatetime?: string;
  preferences?: {
    sms_opt_out?: boolean;
    email_opt_out?: boolean;
    call_opt_out?: boolean;
  };
}

type LegacyAction = 'get' | 'cancel' | 'reschedule' | 'get-appointments' | 'get-invoices';

// Rate limiting configuration
const RATE_LIMITS = {
  portal: { requests: 30, windowSeconds: 60 },  // 30 requests per minute per IP
  token: { requests: 10, windowSeconds: 60 },   // 10 requests per minute per token
};

// In-memory rate limit store
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(identifier: string, action: string): { allowed: boolean; retryAfter?: number } {
  const config = RATE_LIMITS[action as keyof typeof RATE_LIMITS] || RATE_LIMITS.portal;
  const key = `${identifier}:${action}`;
  const now = Date.now();
  
  const record = rateLimitStore.get(key);
  
  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + config.windowSeconds * 1000 });
    return { allowed: true };
  }
  
  if (record.count >= config.requests) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }
  
  record.count++;
  return { allowed: true };
}

function getClientIP(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIP = req.headers.get('x-real-ip');
  if (realIP) return realIP;
  const cfIP = req.headers.get('cf-connecting-ip');
  if (cfIP) return cfIP;
  return 'unknown';
}

// Validate UUID format
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// Log appointment access for audit trail
async function logAppointmentAccess(
  supabase: any,
  appointmentId: string | null,
  token: string,
  accessType: string,
  clientIP: string,
  userAgent: string | null,
  success: boolean,
  metadata?: Record<string, any>
) {
  try {
    await supabase.rpc('log_appointment_access', {
      p_appointment_id: appointmentId,
      p_customer_token: token,
      p_access_type: accessType,
      p_client_ip: clientIP,
      p_user_agent: userAgent,
      p_success: success,
      p_metadata: metadata ? JSON.stringify(metadata) : null
    });
  } catch (err) {
    console.error('Failed to log appointment access:', err);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIP = getClientIP(req);
  const userAgent = req.headers.get('user-agent');
  const requestId = crypto.randomUUID();

  try {
    // Rate limit by IP
    const ipRateCheck = checkRateLimit(clientIP, 'portal');
    if (!ipRateCheck.allowed) {
      console.warn(`Rate limit exceeded for IP ${clientIP}, request_id=${requestId}`);
      return new Response(JSON.stringify({ 
        error: 'Too many requests. Please try again later.',
        retryAfter: ipRateCheck.retryAfter 
      }), {
        status: 429,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Retry-After': String(ipRateCheck.retryAfter || 60)
        },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { action, token, newDatetime, preferences }: PortalRequest = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate token format (must be valid UUID)
    if (!isValidUUID(token)) {
      console.warn(`Invalid token format attempted: ip=${clientIP}, request_id=${requestId}`);
      return new Response(
        JSON.stringify({ error: 'Invalid request' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limit by token to prevent token enumeration
    const tokenRateCheck = checkRateLimit(token, 'token');
    if (!tokenRateCheck.allowed) {
      console.warn(`Token rate limit exceeded: ip=${clientIP}, request_id=${requestId}`);
      return new Response(JSON.stringify({ 
        error: 'Too many requests. Please try again later.',
        retryAfter: tokenRateCheck.retryAfter 
      }), {
        status: 429,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Retry-After': String(tokenRateCheck.retryAfter || 60)
        },
      });
    }

    console.log(`Customer portal action: ${action}, request_id=${requestId}, ip=${clientIP}`);

    // Handle dashboard actions that use customer_profiles token
    if (action === 'get-dashboard' || action === 'get-profile' || action === 'update-preferences') {
      // Try to find customer profile by portal token
      const { data: profile, error: profileError } = await supabase
        .from('customer_profiles')
        .select('*')
        .eq('portal_token', token)
        .maybeSingle();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch profile' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // For update-preferences with profile token
      if (action === 'update-preferences' && profile) {
        if (!preferences) {
          return new Response(
            JSON.stringify({ error: 'Preferences are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const updateData: Record<string, boolean> = {};
        const subscriptionEvents: { channel: string; action: string }[] = [];

        if (typeof preferences.sms_opt_out === 'boolean') {
          updateData.sms_opt_out = preferences.sms_opt_out;
          if (preferences.sms_opt_out !== profile.sms_opt_out) {
            subscriptionEvents.push({
              channel: 'sms',
              action: preferences.sms_opt_out ? 'unsubscribe' : 'subscribe'
            });
          }
        }
        if (typeof preferences.email_opt_out === 'boolean') {
          updateData.email_opt_out = preferences.email_opt_out;
          if (preferences.email_opt_out !== profile.email_opt_out) {
            subscriptionEvents.push({
              channel: 'email',
              action: preferences.email_opt_out ? 'unsubscribe' : 'subscribe'
            });
          }
        }
        if (typeof preferences.call_opt_out === 'boolean') {
          updateData.call_opt_out = preferences.call_opt_out;
          if (preferences.call_opt_out !== profile.call_opt_out) {
            subscriptionEvents.push({
              channel: 'call',
              action: preferences.call_opt_out ? 'unsubscribe' : 'subscribe'
            });
          }
        }

        if (Object.keys(updateData).length === 0) {
          return new Response(
            JSON.stringify({ error: 'No valid preferences provided' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Update customer profile preferences
        const { error: prefError } = await supabase
          .from('customer_profiles')
          .update(updateData)
          .eq('id', profile.id);

        if (prefError) {
          console.error('Preferences update error:', prefError);
          return new Response(
            JSON.stringify({ error: 'Failed to update preferences' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Also update future appointments for this customer
        await supabase
          .from('appointments')
          .update(updateData)
          .eq('company_id', profile.company_id)
          .eq('customer_email', profile.email)
          .gte('datetime', new Date().toISOString());

        // Log subscription events for analytics
        if (subscriptionEvents.length > 0) {
          const eventsToInsert = subscriptionEvents.map(event => ({
            company_id: profile.company_id,
            channel: event.channel,
            action: event.action,
            source: 'customer_portal',
            customer_email: profile.email,
            customer_phone: profile.phone
          }));

          const { error: eventError } = await supabase
            .from('subscription_events')
            .insert(eventsToInsert);

          if (eventError) {
            console.error('Failed to log subscription events:', eventError);
          } else {
            console.log(`Logged ${subscriptionEvents.length} subscription events`);
          }
        }

        console.log(`Updated preferences for customer profile ${profile.id}:`, updateData);

        return new Response(
          JSON.stringify({ success: true, message: 'Preferences updated successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!profile) {
        // Fall back to appointment token for backward compatibility
        const { data: appointment } = await supabase
          .from('appointments')
          .select('customer_email, company_id')
          .eq('customer_token', token)
          .maybeSingle();

        if (!appointment) {
          return new Response(
            JSON.stringify({ error: 'Customer not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Try to find profile by email
        const { data: profileByEmail } = await supabase
          .from('customer_profiles')
          .select('*')
          .eq('company_id', appointment.company_id)
          .eq('email', appointment.customer_email)
          .maybeSingle();

        if (!profileByEmail) {
          return new Response(
            JSON.stringify({ error: 'Customer profile not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Use the found profile
        return await getDashboardData(supabase, profileByEmail);
      }

      if (action === 'get-profile') {
        return new Response(
          JSON.stringify({ success: true, profile }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return await getDashboardData(supabase, profile);
    }

    // Handle appointment-token based actions (legacy)
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
      // Log failed access attempt
      await logAppointmentAccess(supabase, null, token, 'token_lookup', clientIP, userAgent, false, { reason: 'not_found' });
      return new Response(
        JSON.stringify({ error: 'Appointment not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log successful token access
    await logAppointmentAccess(supabase, appointment.id, token, action, clientIP, userAgent, true);

    switch (action as LegacyAction) {
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

        // Send cancellation notifications
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

        if (appointment.customer_phone) {
          try {
            await fetch(`${supabaseUrl}/functions/v1/send-appointment-sms`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ appointmentId: appointment.id, type: 'cancellation' })
            });
          } catch (smsError) {
            console.error('Failed to send cancellation SMS:', smsError);
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
    // Log full error server-side for debugging but return generic message to client
    console.error('Customer portal error:', error, `request_id=${requestId}`);
    return new Response(
      JSON.stringify({ error: 'An error occurred processing your request' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper function to get full dashboard data
async function getDashboardData(supabase: any, profile: any) {
  const companyId = profile.company_id;
  const customerEmail = profile.email;

  // Fetch company info
  const { data: company } = await supabase
    .from('companies')
    .select('name, logo_url, primary_color')
    .eq('id', companyId)
    .single();

  // Fetch appointments for this customer
  const { data: appointments } = await supabase
    .from('appointments')
    .select('id, customer_name, service_type, datetime, status, customer_address, notes')
    .eq('company_id', companyId)
    .eq('customer_email', customerEmail)
    .order('datetime', { ascending: false })
    .limit(50);

  // Fetch invoices for this customer
  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, invoice_number, customer_name, total, status, due_date, created_at')
    .eq('company_id', companyId)
    .eq('customer_email', customerEmail)
    .order('created_at', { ascending: false })
    .limit(50);

  // Fetch quotes for this customer
  const { data: quotes } = await supabase
    .from('quotes')
    .select('id, customer_name, total_amount, status, valid_until, created_at')
    .eq('company_id', companyId)
    .eq('customer_email', customerEmail)
    .order('created_at', { ascending: false })
    .limit(50);

  // Fetch referrals by this customer
  const { data: referrals } = await supabase
    .from('customer_referrals')
    .select('id, referral_code, status, reward_type, reward_value, referred_name')
    .eq('company_id', companyId)
    .eq('referrer_email', customerEmail)
    .order('created_at', { ascending: false })
    .limit(20);

  console.log(`Dashboard data fetched for ${customerEmail}: ${appointments?.length || 0} appointments, ${invoices?.length || 0} invoices, ${quotes?.length || 0} quotes`);

  return new Response(
    JSON.stringify({
      profile,
      appointments: appointments || [],
      invoices: invoices || [],
      quotes: quotes || [],
      referrals: referrals || [],
      company: company || { name: 'Unknown', logo_url: null, primary_color: null }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
