import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting for account creation
const registrationAttempts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = { maxAttempts: 3, windowMs: 300000 }; // 3 attempts per 5 minutes

function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         req.headers.get('x-real-ip') ||
         'unknown';
}

function checkRegistrationRateLimit(identifier: string): { allowed: boolean } {
  const now = Date.now();
  const record = registrationAttempts.get(identifier);
  
  if (!record || now > record.resetAt) {
    registrationAttempts.set(identifier, { count: 1, resetAt: now + RATE_LIMIT.windowMs });
    return { allowed: true };
  }
  
  if (record.count >= RATE_LIMIT.maxAttempts) {
    return { allowed: false };
  }
  
  record.count++;
  return { allowed: true };
}

// Input validation
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

function validatePassword(password: string): boolean {
  return password.length >= 8 && password.length <= 128;
}

function sanitizeString(input: string, maxLength: number): string {
  return input.slice(0, maxLength).trim();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const clientIP = getClientIP(req);
    
    // Rate limit check per IP
    const rateCheck = checkRegistrationRateLimit(clientIP);
    if (!rateCheck.allowed) {
      console.warn(`Registration rate limit exceeded for IP: ${clientIP}`);
      return new Response(JSON.stringify({ error: 'Too many registration attempts. Please try again later.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { email, password, name, companyId, termsAgreed } = body;

    // Validate required fields
    if (!email || !password || !companyId) {
      return new Response(JSON.stringify({ error: 'Email, password, and company are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate terms agreement
    if (!termsAgreed) {
      return new Response(JSON.stringify({ error: 'You must agree to the Terms of Service and Privacy Policy' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate password strength
    if (!validatePassword(password)) {
      return new Response(JSON.stringify({ error: 'Password must be at least 8 characters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Server-side password strength validation with HIBP check
    try {
      const validatePasswordUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/validate-password`;
      const validationResponse = await fetch(validatePasswordUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, checkHibp: true }),
      });

      if (validationResponse.ok) {
        const validation = await validationResponse.json();
        if (validation.breached) {
          return new Response(JSON.stringify({ 
            error: 'This password has been exposed in data breaches. Please choose a different password.' 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        if (!validation.valid) {
          return new Response(JSON.stringify({ 
            error: `Password is too weak: ${validation.issues?.join(', ') || 'Please choose a stronger password'}` 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    } catch (validationError) {
      // Log but don't block registration if validation service is unavailable
      console.warn('Password validation service error:', validationError);
    }

    // Rate limit per email to prevent abuse
    const emailRateCheck = checkRegistrationRateLimit(email.toLowerCase());
    if (!emailRateCheck.allowed) {
      return new Response(JSON.stringify({ error: 'Too many registration attempts for this email' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify company exists and is active
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      console.warn(`Invalid company ID attempted: ${companyId}`);
      return new Response(JSON.stringify({ error: 'Invalid company' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create the user account
    const sanitizedName = name ? sanitizeString(name, 100) : undefined;
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password,
      email_confirm: true, // Auto-confirm for customer accounts (widget flow)
      user_metadata: {
        full_name: sanitizedName,
        registered_via: 'widget',
        registration_company_id: companyId,
      },
    });

    if (authError) {
      console.error('Auth creation error:', authError);
      // Return generic error to prevent email enumeration
      if (authError.message.includes('already registered')) {
        return new Response(JSON.stringify({ error: 'An account with this email already exists. Please log in instead.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ error: 'Failed to create account. Please try again.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!authData.user) {
      return new Response(JSON.stringify({ error: 'Failed to create account' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = authData.user.id;

    // Add customer role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'customer',
      });

    if (roleError) {
      console.error('Role assignment error:', roleError);
      // Clean up the user if role assignment fails
      await supabase.auth.admin.deleteUser(userId);
      return new Response(JSON.stringify({ error: 'Failed to complete registration. Please try again.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create customer company association
    const { error: assocError } = await supabase
      .from('customer_company_associations')
      .insert({
        customer_user_id: userId,
        company_id: companyId,
        last_interaction_at: new Date().toISOString(),
      });

    if (assocError) {
      console.error('Association creation error:', assocError);
      // Don't fail registration if association fails - it can be created later
    }

    console.log(`Customer registered successfully: ${userId} for company ${companyId}`);

    return new Response(JSON.stringify({ 
      success: true, 
      userId,
      message: 'Account created successfully' 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Registration error:', error);
    return new Response(JSON.stringify({ error: 'An unexpected error occurred' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
